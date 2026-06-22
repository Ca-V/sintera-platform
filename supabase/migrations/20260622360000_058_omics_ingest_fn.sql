-- 058 — Ômica Fase 6: função de ingestão estruturada.
-- Upload → Parser (na API) → Validação → Mapeamento pelo catálogo (resolução de
-- identidade) → Versionamento (imutável) → Persistência. p_rows é jsonb
-- [{name,value,unit,category,method,detection_status,external_id}]. SECURITY
-- INVOKER → RLS do chamador. A SINTERA só organiza/normaliza — não interpreta.

CREATE OR REPLACE FUNCTION public.omics_ingest(
  p_panel uuid, p_domain text, p_rows jsonb, p_measured_on date, p_source_file text, p_note text
) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_version int;
  v_inserted int := 0;
  v_resolved int := 0;
  r jsonb;
  v_term text;
  v_cat uuid;
  v_fid uuid;
  v_cname text;
  v_valtxt text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  PERFORM 1 FROM public.omics_panels WHERE id = p_panel AND user_id = v_uid;
  IF NOT FOUND THEN RAISE EXCEPTION 'panel not found'; END IF;

  SELECT coalesce(max(version_number),0)+1 INTO v_version FROM public.omics_versions WHERE panel_id = p_panel;
  INSERT INTO public.omics_versions(panel_id, user_id, version_number, source_file, note, created_by)
    VALUES (p_panel, v_uid, v_version, p_source_file, p_note, v_uid);

  FOR r IN SELECT * FROM jsonb_array_elements(p_rows) LOOP
    v_term := coalesce(nullif(btrim(r->>'external_id'),''), nullif(btrim(r->>'name'),''));
    IF v_term IS NULL THEN CONTINUE; END IF;
    v_fid := public.omics_resolve_feature(p_domain, v_term);
    v_cat := NULL; v_cname := nullif(btrim(r->>'name'),'');
    IF v_fid IS NOT NULL THEN
      SELECT category_id, canonical_name INTO v_cat, v_cname FROM public.omics_catalog WHERE id = v_fid;
      v_resolved := v_resolved + 1;
    END IF;
    v_valtxt := nullif(btrim(r->>'value'),'');
    INSERT INTO public.omics_results(panel_id, user_id, domain, feature_id, feature_name, category_id,
      value, unit, raw_value, detection_status, method, measured_on)
    VALUES (p_panel, v_uid, p_domain, v_fid, coalesce(v_cname, v_term), v_cat,
      CASE WHEN v_valtxt ~ '^-?\d+(\.\d+)?$' THEN v_valtxt::numeric ELSE NULL END,
      nullif(btrim(r->>'unit'),''), v_valtxt,
      nullif(btrim(r->>'detection_status'),''), nullif(btrim(r->>'method'),''), p_measured_on);
    v_inserted := v_inserted + 1;
  END LOOP;

  UPDATE public.omics_panels
     SET total_features = (SELECT count(*) FROM public.omics_results WHERE panel_id = p_panel)
   WHERE id = p_panel;

  RETURN jsonb_build_object('version', v_version, 'inserted', v_inserted, 'resolved', v_resolved);
END $$;

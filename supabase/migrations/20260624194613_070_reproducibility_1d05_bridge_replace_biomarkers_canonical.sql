-- 1d.0.5 — Hotfix de ponte: replace_biomarkers passa a criar versao canonica + promover.
-- Aplicada em producao via MCP em 24/06/2026 (version 20260624194613).
-- Fecha o gap de escrita: apos a 1c (leitura via current_biomarkers), uma analise nova
-- com a funcao antiga gerava biomarcadores sem extraction_version_id -> exame sumia da
-- camada canonica. Agora a funcao cria versao + vincula + promove ponteiro.
-- So funcao SQL; sem mudanca de app/deploy; reversivel. DELETE legado permanece
-- (append-only definitivo = 1d.1-1d.5).

create or replace function public.replace_biomarkers(p_exam_id uuid, p_user_id uuid, p_biomarkers jsonb)
 returns void
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_version_id uuid;
  v_next int;
begin
  -- Guarda de propriedade (inalterada): service_role pode operar por qualquer usuario;
  -- authenticated so pode substituir os PROPRIOS biomarcadores.
  if coalesce(auth.role(), '') <> 'service_role'
     and p_user_id is distinct from auth.uid() then
    raise exception 'forbidden: p_user_id deve ser o usuario autenticado';
  end if;

  delete from public.biomarkers where exam_id = p_exam_id;

  -- 1d.0.5: criar versao minima (append) + promover ponteiro canonico
  select coalesce(max(version_number), 0) + 1 into v_next
    from public.extraction_versions where exam_id = p_exam_id;

  insert into public.extraction_versions
    (exam_id, user_id, version_number, origin, reason, processing_mode, status, created_by, created_at)
  values
    (p_exam_id, p_user_id, v_next, 'fresh', 'bridge_1d05', 'replace_legacy', 'valid', p_user_id, now())
  returning id into v_version_id;

  insert into public.biomarkers (
    exam_id, user_id, name, value, value_text, unit,
    reference_min, reference_max, result_type, interpretation,
    source, confidence, raw_text, range_extracted,
    reference_source, ai_log_id, catalog_id, synthetic,
    extraction_version_id
  )
  select
    p_exam_id, p_user_id, (bm->>'name'), (bm->>'value')::numeric, (bm->>'value_text'),
    (bm->>'unit'), (bm->>'reference_min')::numeric, (bm->>'reference_max')::numeric,
    (bm->>'result_type'), (bm->>'interpretation'), (bm->>'source'), (bm->>'confidence')::numeric,
    (bm->>'raw_text'), (bm->>'range_extracted')::boolean, (bm->>'reference_source'),
    (bm->>'ai_log_id')::uuid, (bm->>'catalog_id')::uuid, false,
    v_version_id
  from jsonb_array_elements(p_biomarkers) as bm;

  update public.exams set current_extraction_version_id = v_version_id where id = p_exam_id;
end;
$function$;

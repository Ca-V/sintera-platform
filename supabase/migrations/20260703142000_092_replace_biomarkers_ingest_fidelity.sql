-- 092 — Fidelidade da Ingestão no caminho LEGADO (replace_biomarkers): grava
-- source_material/source_exam_name e registra extraction_schema_version=2 na versão.
-- Necessário porque o dispatcher ainda roteia ~99% por aqui (canonical_write_pct=1).
-- Recreate idempotente; mantém guarda de propriedade e a ponte canônica (1d.0.5).
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
  if coalesce(auth.role(), '') <> 'service_role'
     and p_user_id is distinct from auth.uid() then
    raise exception 'forbidden: p_user_id deve ser o usuario autenticado';
  end if;

  delete from public.biomarkers where exam_id = p_exam_id;

  select coalesce(max(version_number), 0) + 1 into v_next
    from public.extraction_versions where exam_id = p_exam_id;

  insert into public.extraction_versions
    (exam_id, user_id, version_number, origin, reason, processing_mode, status, created_by, created_at, extraction_schema_version)
  values
    (p_exam_id, p_user_id, v_next, 'fresh', 'bridge_1d05', 'replace_legacy', 'valid', p_user_id, now(), 2)
  returning id into v_version_id;

  insert into public.biomarkers (
    exam_id, user_id, name, value, value_text, unit,
    reference_min, reference_max, result_type, interpretation,
    source, confidence, raw_text, range_extracted,
    reference_source, ai_log_id, catalog_id, synthetic,
    extraction_version_id, source_material, source_exam_name
  )
  select
    p_exam_id, p_user_id, (bm->>'name'), (bm->>'value')::numeric, (bm->>'value_text'),
    (bm->>'unit'), (bm->>'reference_min')::numeric, (bm->>'reference_max')::numeric,
    (bm->>'result_type'), (bm->>'interpretation'), (bm->>'source'), (bm->>'confidence')::numeric,
    (bm->>'raw_text'), (bm->>'range_extracted')::boolean, (bm->>'reference_source'),
    (bm->>'ai_log_id')::uuid, (bm->>'catalog_id')::uuid, false,
    v_version_id, (bm->>'source_material'), (bm->>'source_exam_name')
  from jsonb_array_elements(p_biomarkers) as bm;

  update public.exams set current_extraction_version_id = v_version_id where id = p_exam_id;
end;
$function$;

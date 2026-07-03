-- 091 — Fidelidade da Ingestão: write_canonical_extraction passa a gravar o contexto
-- do laudo (source_material, source_exam_name) e a registrar extraction_schema_version
-- na própria versão de extração. Os dois campos ENTRAM no version_hash (decisão
-- fundadora 03/07): mudar o contexto extraído = extração diferente. Recreate idempotente
-- (create or replace); mantém append-only, reuso por chave, gate I6/I7 e o contrato jsonb.
create or replace function public.write_canonical_extraction(
  p_exam_id uuid, p_user_id uuid, p_biomarkers jsonb, p_meta jsonb
) returns jsonb
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_existing uuid;
  v_version_id uuid;
  v_next int;
  v_count int;
  v_action text;
  v_hash text;
  v_current uuid;
  v_sha text := p_meta->>'document_sha256';
  v_ext text := p_meta->>'extractor_version';
  v_pr  text := p_meta->>'prompt_version';
  v_mod text := p_meta->>'model_version';
  v_esv int := coalesce((p_meta->>'extraction_schema_version')::int, 1);
begin
  if coalesce(auth.role(),'') <> 'service_role' and p_user_id is distinct from auth.uid() then
    raise exception 'forbidden: p_user_id deve ser o usuario autenticado';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_exam_id::text, 0));

  select current_extraction_version_id into v_current from public.exams where id = p_exam_id;

  if v_sha is not null and v_ext is not null and v_pr is not null and v_mod is not null then
    select id into v_existing from public.extraction_versions
      where exam_id=p_exam_id and status='valid'
        and document_sha256=v_sha and extractor_version=v_ext
        and prompt_version=v_pr and model_version=v_mod
      order by version_number desc limit 1;
  end if;

  if v_existing is not null then
    v_version_id := v_existing;
    v_action := 'REUSED';
  else
    select coalesce(max(version_number),0)+1 into v_next
      from public.extraction_versions where exam_id=p_exam_id;
    insert into public.extraction_versions
      (exam_id,user_id,version_number,document_sha256,source_text,extractor_version,prompt_version,
       model_version,ai_log_id,origin,reason,processing_mode,status,created_by,created_at,extraction_schema_version)
    values
      (p_exam_id,p_user_id,v_next,v_sha,p_meta->>'source_text',v_ext,v_pr,v_mod,
       (p_meta->>'ai_log_id')::uuid,coalesce(p_meta->>'origin','fresh'),'canonical_write',
       coalesce(p_meta->>'processing_mode','canonical_on'),'valid',p_user_id,now(),v_esv)
    returning id into v_version_id;

    insert into public.biomarkers (
      exam_id,user_id,name,value,value_text,unit,reference_min,reference_max,result_type,interpretation,
      source,confidence,raw_text,range_extracted,reference_source,ai_log_id,catalog_id,synthetic,extraction_version_id,
      source_material,source_exam_name
    )
    select p_exam_id,p_user_id,(bm->>'name'),(bm->>'value')::numeric,(bm->>'value_text'),(bm->>'unit'),
      (bm->>'reference_min')::numeric,(bm->>'reference_max')::numeric,(bm->>'result_type'),(bm->>'interpretation'),
      (bm->>'source'),(bm->>'confidence')::numeric,(bm->>'raw_text'),(bm->>'range_extracted')::boolean,
      (bm->>'reference_source'),(bm->>'ai_log_id')::uuid,(bm->>'catalog_id')::uuid,false,v_version_id,
      (bm->>'source_material'),(bm->>'source_exam_name')
    from jsonb_array_elements(p_biomarkers) as bm;

    select count(*) into v_count from public.biomarkers where extraction_version_id=v_version_id;
    if v_count = 0 then
      update public.extraction_versions set status='invalid' where id=v_version_id;
      return jsonb_build_object('version_id',v_version_id,'action','INVALID_EMPTY','promoted',false,'version_hash',null);
    end if;
    v_action := 'CREATED';
  end if;

  if v_current is distinct from v_version_id then
    update public.exams set current_extraction_version_id=v_version_id where id=p_exam_id;
    update public.extraction_versions
      set promoted_by=p_user_id, promoted_at=now(),
          promotion_reason = case when v_action='REUSED' then 'reuse' else 'fresh_extraction' end
      where id=v_version_id;
  end if;

  -- version_hash: assinatura AGORA inclui source_material/source_exam_name (contexto do laudo)
  select md5(coalesce(string_agg(r,'|' order by r),'')) into v_hash from (
    select row(name,value,value_text,unit,reference_min,reference_max,interpretation,result_type,
               reference_source,catalog_id,source_material,source_exam_name)::text as r
    from public.biomarkers where extraction_version_id=v_version_id
  ) t;

  return jsonb_build_object('version_id',v_version_id,'action',v_action,'promoted',true,'version_hash',v_hash);
end;
$function$;

revoke all on function public.write_canonical_extraction(uuid,uuid,jsonb,jsonb) from public, anon;
grant execute on function public.write_canonical_extraction(uuid,uuid,jsonb,jsonb) to authenticated, service_role;

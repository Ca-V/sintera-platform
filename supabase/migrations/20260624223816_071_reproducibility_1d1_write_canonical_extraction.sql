-- 1d.1 — Escrita canonica append-only: write_canonical_extraction.
-- Aplicada em producao via MCP em 24/06/2026 (version 20260624223816).
-- INERTE ate o dispatcher rotear (system_flags.canonical_write_mode segue 'off').
-- Append-only (nenhum DELETE), reuso por chave (por exame), advisory lock (concorrencia),
-- promocao idempotente, gate I6/I7, contrato jsonb {version_id, action, promoted, version_hash}.

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
begin
  -- (1) validar propriedade do exame (guarda 064)
  if coalesce(auth.role(),'') <> 'service_role' and p_user_id is distinct from auth.uid() then
    raise exception 'forbidden: p_user_id deve ser o usuario autenticado';
  end if;

  -- (concorrencia) advisory lock por exame -> serializa escritas do mesmo exam_id
  perform pg_advisory_xact_lock(hashtextextended(p_exam_id::text, 0));

  select current_extraction_version_id into v_current from public.exams where id = p_exam_id;

  -- (2)(3) calcular chave de reuso + procurar versao reutilizavel (so com chave completa)
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
    -- (4) criar versao (APPEND; nenhum DELETE)
    select coalesce(max(version_number),0)+1 into v_next
      from public.extraction_versions where exam_id=p_exam_id;
    insert into public.extraction_versions
      (exam_id,user_id,version_number,document_sha256,source_text,extractor_version,prompt_version,
       model_version,ai_log_id,origin,reason,processing_mode,status,created_by,created_at)
    values
      (p_exam_id,p_user_id,v_next,v_sha,p_meta->>'source_text',v_ext,v_pr,v_mod,
       (p_meta->>'ai_log_id')::uuid,coalesce(p_meta->>'origin','fresh'),'canonical_write',
       coalesce(p_meta->>'processing_mode','canonical_on'),'valid',p_user_id,now())
    returning id into v_version_id;

    -- (5) inserir biomarcadores vinculados (APPEND)
    insert into public.biomarkers (
      exam_id,user_id,name,value,value_text,unit,reference_min,reference_max,result_type,interpretation,
      source,confidence,raw_text,range_extracted,reference_source,ai_log_id,catalog_id,synthetic,extraction_version_id
    )
    select p_exam_id,p_user_id,(bm->>'name'),(bm->>'value')::numeric,(bm->>'value_text'),(bm->>'unit'),
      (bm->>'reference_min')::numeric,(bm->>'reference_max')::numeric,(bm->>'result_type'),(bm->>'interpretation'),
      (bm->>'source'),(bm->>'confidence')::numeric,(bm->>'raw_text'),(bm->>'range_extracted')::boolean,
      (bm->>'reference_source'),(bm->>'ai_log_id')::uuid,(bm->>'catalog_id')::uuid,false,v_version_id
    from jsonb_array_elements(p_biomarkers) as bm;

    -- (I7) versao nao-vazia: senao marca invalida e NAO promove
    select count(*) into v_count from public.biomarkers where extraction_version_id=v_version_id;
    if v_count = 0 then
      update public.extraction_versions set status='invalid' where id=v_version_id;
      return jsonb_build_object('version_id',v_version_id,'action','INVALID_EMPTY','promoted',false,'version_hash',null);
    end if;
    v_action := 'CREATED';
  end if;

  -- (6) promover ponteiro (IDEMPOTENTE: no-op se ja for current) + (7) auditar
  if v_current is distinct from v_version_id then
    update public.exams set current_extraction_version_id=v_version_id where id=p_exam_id;
    update public.extraction_versions
      set promoted_by=p_user_id, promoted_at=now(),
          promotion_reason = case when v_action='REUSED' then 'reuse' else 'fresh_extraction' end
      where id=v_version_id;
  end if;

  -- version_hash (md5 normalizado dos biomarcadores da versao)
  select md5(coalesce(string_agg(r,'|' order by r),'')) into v_hash from (
    select row(name,value,value_text,unit,reference_min,reference_max,interpretation,result_type,reference_source,catalog_id)::text as r
    from public.biomarkers where extraction_version_id=v_version_id
  ) t;

  -- (8) retornar contrato
  return jsonb_build_object('version_id',v_version_id,'action',v_action,'promoted',true,'version_hash',v_hash);
end;
$function$;

revoke all on function public.write_canonical_extraction(uuid,uuid,jsonb,jsonb) from public, anon;
grant execute on function public.write_canonical_extraction(uuid,uuid,jsonb,jsonb) to authenticated, service_role;

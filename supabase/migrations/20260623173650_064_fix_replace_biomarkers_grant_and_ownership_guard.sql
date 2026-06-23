-- Fix de drift de permissões + hardening.
--
-- Bug: o papel `authenticated` NÃO tinha EXECUTE em public.replace_biomarkers,
-- então TODA extração real (rota /analyze, chamada como usuária autenticada)
-- falhava ao salvar os biomarcadores (BIOMARKER_PERSIST_FAILED). Os testes
-- isolados passavam por rodarem como service_role. As funções de ômica tinham
-- o grant; só esta ficou sem — manifestação do drift de migrations.
--
-- Correção:
--  1. Recria a função adicionando uma GUARDA DE PROPRIEDADE (defesa contra IDOR,
--     já que é SECURITY DEFINER e não checava o dono). service_role (ex.: cron
--     de recuperação futuro) pode operar em nome de qualquer usuário; o papel
--     authenticated só pode substituir os PRÓPRIOS biomarcadores.
--  2. Concede EXECUTE para authenticated.
--
-- Idempotente (CREATE OR REPLACE + GRANT). Aplicada em produção via MCP em
-- 23/06/2026 (version 20260623173650).

create or replace function public.replace_biomarkers(p_exam_id uuid, p_user_id uuid, p_biomarkers jsonb)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if coalesce(auth.role(), '') <> 'service_role'
     and p_user_id is distinct from auth.uid() then
    raise exception 'forbidden: p_user_id deve ser o usuario autenticado';
  end if;

  delete from public.biomarkers where exam_id = p_exam_id;

  insert into public.biomarkers (
    exam_id, user_id, name, value, value_text, unit,
    reference_min, reference_max, result_type, interpretation,
    source, confidence, raw_text, range_extracted,
    reference_source, ai_log_id, catalog_id, synthetic
  )
  select
    p_exam_id, p_user_id, (bm->>'name'), (bm->>'value')::numeric, (bm->>'value_text'),
    (bm->>'unit'), (bm->>'reference_min')::numeric, (bm->>'reference_max')::numeric,
    (bm->>'result_type'), (bm->>'interpretation'), (bm->>'source'), (bm->>'confidence')::numeric,
    (bm->>'raw_text'), (bm->>'range_extracted')::boolean, (bm->>'reference_source'),
    (bm->>'ai_log_id')::uuid, (bm->>'catalog_id')::uuid, false
  from jsonb_array_elements(p_biomarkers) as bm;
end;
$function$;

grant execute on function public.replace_biomarkers(uuid, uuid, jsonb) to authenticated;

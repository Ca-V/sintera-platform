-- Validação da migração 138 (C-2) em PostgreSQL isolado. Levanta exceção em qualquer falha (psql exit != 0).
\set ON_ERROR_STOP on

-- ── A) ESTRUTURA ────────────────────────────────────────────────────────────────
do $$ begin
  if to_regclass('public.service_requests') is null then raise exception 'A1: service_requests ausente'; end if;
  if to_regclass('public.service_request_results') is null then raise exception 'A2: service_request_results ausente'; end if;
  -- RLS habilitada nas duas tabelas
  if not (select relrowsecurity from pg_class where oid='public.service_requests'::regclass) then raise exception 'A3: RLS off em service_requests'; end if;
  if not (select relrowsecurity from pg_class where oid='public.service_request_results'::regclass) then raise exception 'A4: RLS off em service_request_results'; end if;
  -- 4 policies por tabela
  if (select count(*) from pg_policies where tablename='service_requests') <> 4 then raise exception 'A5: policies != 4 em service_requests'; end if;
  if (select count(*) from pg_policies where tablename='service_request_results') <> 4 then raise exception 'A6: policies != 4 em service_request_results'; end if;
  -- FKs esperadas
  if not exists (select 1 from pg_constraint where conname='service_requests_source_exam_id_fkey') then raise exception 'A7: FK source_exam_id ausente'; end if;
  if not exists (select 1 from pg_constraint where conrelid='public.service_request_results'::regclass and contype='f' and confrelid='public.service_requests'::regclass) then raise exception 'A8: FK srr->service_requests ausente'; end if;
  -- constraint de proveniência de confirmação
  if not exists (select 1 from pg_constraint where conname='chk_confirmation_provenance') then raise exception 'A9: chk_confirmation_provenance ausente'; end if;
  -- unique (service_request_id, result_exam_id)
  if not exists (select 1 from pg_constraint where conrelid='public.service_request_results'::regclass and contype='u') then raise exception 'A10: unique(sr,result) ausente'; end if;
  -- índices
  if to_regclass('public.idx_service_requests_requisition') is null then raise exception 'A11: idx requisition ausente'; end if;
  raise notice 'A) ESTRUTURA OK (tabelas, RLS, 4+4 policies, FKs, CHECK, unique, índices)';
end $$;

-- ── B) CENÁRIO BILATERAL: dois ServiceRequest, mesmo requisition_id, lateralidade distinta ──────────────
do $$
declare v_req uuid := '33333333-3333-3333-3333-333333333333';
        v_u   uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
begin
  insert into public.service_requests (id, user_id, requisition_id, source_exam_id, code_text, laterality, subject_user_id)
  values
    ('a0000000-0000-0000-0000-000000000001', v_u, v_req, '11111111-1111-1111-1111-111111111111','Doppler colorido venoso de membro inferior','esquerdo', v_u),
    ('a0000000-0000-0000-0000-000000000002', v_u, v_req, '11111111-1111-1111-1111-111111111111','Doppler colorido venoso de membro inferior','direito',  v_u);
  if (select count(*) from public.service_requests where requisition_id=v_req) <> 2 then raise exception 'B1: bilateral != 2 ServiceRequest'; end if;
  if (select count(distinct laterality) from public.service_requests where requisition_id=v_req) <> 2 then raise exception 'B2: lateralidades não distintas'; end if;
  -- código NÃO inventado: coding NULL, text preservado
  if exists (select 1 from public.service_requests where requisition_id=v_req and (code_system is not null or code_value is not null)) then raise exception 'B3: coding foi inventado (deveria ser NULL)'; end if;
  if exists (select 1 from public.service_requests where requisition_id=v_req and code_text is null) then raise exception 'B4: code_text nulo'; end if;
  raise notice 'B) BILATERAL OK (2 ServiceRequest, mesmo requisition, lateralidade distinta, coding NULL, text preservado)';
end $$;

-- ── C) RESULTADO PARCIAL: lado esquerdo vinculado a resultado; direito pendente (sem vínculo) ───────────
do $$
declare v_u uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
begin
  -- vínculo CONFIRMADO do lado esquerdo (com proveniência completa)
  insert into public.service_request_results
    (user_id, service_request_id, result_exam_id, linked_by, link_method, confirmed, confirmed_by, confirmed_at, evidence)
  values
    (v_u, 'a0000000-0000-0000-0000-000000000001','22222222-2222-2222-2222-222222222222', v_u, 'user_confirmed', true, v_u, now(), 'paciente+lateralidade+data');
  -- esquerdo tem 1 vínculo; direito tem 0 (pendente)
  if (select count(*) from public.service_request_results where service_request_id='a0000000-0000-0000-0000-000000000001') <> 1 then raise exception 'C1: esquerdo sem vínculo'; end if;
  if (select count(*) from public.service_request_results where service_request_id='a0000000-0000-0000-0000-000000000002') <> 0 then raise exception 'C2: direito não deveria ter vínculo (parcial)'; end if;
  raise notice 'C) PARCIAL OK (esquerdo vinculado; direito pendente)';
end $$;

-- ── D) SUGESTÃO AUTOMÁTICA NÃO VIRA CONFIRMADA SOZINHA ───────────────────────────────────────────────
do $$
declare v_u uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
begin
  -- sugestão automática: nasce NÃO confirmada (default)
  insert into public.service_request_results
    (id, user_id, service_request_id, result_exam_id, linked_by, link_method, match_confidence, evidence)
  values
    ('b0000000-0000-0000-0000-000000000001', v_u, 'a0000000-0000-0000-0000-000000000002','22222222-2222-2222-2222-222222222222', v_u, 'auto_suggested', 0.72, 'match heurístico');
  if (select confirmed from public.service_request_results where id='b0000000-0000-0000-0000-000000000001') <> false then raise exception 'D1: auto_suggested nasceu confirmado'; end if;
  raise notice 'D) AUTO-SUGESTÃO OK (nasce confirmed=false)';
end $$;

-- ── E) NEGATIVOS: proveniência obrigatória e confirmação não-silenciosa ────────────────────────────────
do $$
declare v_u uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
begin
  -- E1: vínculo sem linked_by deve FALHAR (NOT NULL)
  begin
    insert into public.service_request_results (user_id, service_request_id, link_method)
      values (v_u, 'a0000000-0000-0000-0000-000000000001', 'user_confirmed');
    raise exception 'E1 FALHOU: aceitou vínculo sem linked_by';
  exception when not_null_violation then raise notice 'E1 OK: linked_by NOT NULL barrou vínculo sem autor'; end;

  -- E2: confirmar (confirmed=true) sem confirmed_by/at deve FALHAR (chk_confirmation_provenance)
  begin
    insert into public.service_request_results (user_id, service_request_id, linked_by, link_method, confirmed)
      values (v_u, 'a0000000-0000-0000-0000-000000000001', v_u, 'auto_suggested', true);
    raise exception 'E2 FALHOU: confirmou sem confirmed_by/at';
  exception when check_violation then raise notice 'E2 OK: chk_confirmation_provenance barrou confirmação silenciosa'; end;
  raise notice 'E) NEGATIVOS OK (proveniência e confirmação obrigatórias)';
end $$;

-- ── F) RLS efetiva (dois sentidos), em transação (SET LOCAL válido); role não-owner → RLS enforced ─────────
do $$ begin
  if not exists (select 1 from pg_roles where rolname='c2_app_user') then create role c2_app_user nologin; end if;
end $$;
grant usage on schema public, auth to c2_app_user;
grant select, insert, update, delete on public.service_requests, public.service_request_results, public.exams to c2_app_user;
begin;
  set local role c2_app_user;
  set local "test.uid" = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';   -- usuário A (dono das linhas de B/C acima)
  do $$ begin
    if (select count(*) from public.service_requests) <> 2 then raise exception 'F1: A não vê as próprias 2 solicitações'; end if;
    raise notice 'F1 OK: usuário A enxerga as próprias solicitações';
  end $$;
  set local "test.uid" = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';   -- usuário B (não-dono)
  do $$ begin
    if (select count(*) from public.service_requests) <> 0 then raise exception 'F2: RLS não isolou (B viu linhas de A)'; end if;
    if (select count(*) from public.service_request_results) <> 0 then raise exception 'F3: RLS não isolou (results)'; end if;
    raise notice 'F) RLS OK (A vê as próprias; B não enxerga dados de A)';
  end $$;
commit;

select 'VALIDATION_138_OK' as resultado;

-- Validação da 141 (terminologia) em PostgreSQL isolado, dados sintéticos. Exit != 0 em falha.
\set ON_ERROR_STOP on
create schema if not exists auth;
create or replace function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;

-- ── A) ESTRUTURA ─────────────────────────────────────────────────────────────
do $$ begin
  if to_regclass('public.terminology_bindings') is null then raise exception 'A: tabela ausente'; end if;
  if not (select relrowsecurity from pg_class where oid='public.terminology_bindings'::regclass) then raise exception 'A: RLS off'; end if;
  if (select count(*) from pg_policies where tablename='terminology_bindings') <> 4 then raise exception 'A: policies != 4'; end if;
  if not exists (select 1 from pg_constraint where conname='chk_confirmed_coding') then raise exception 'A: chk_confirmed_coding ausente'; end if;
  raise notice 'A) ESTRUTURA OK (tabela, RLS+4 policies, chk_confirmed_coding)';
end $$;

-- ── B) UNMAPPED: conceito preservado, coding NULL (não inventado) ──────────────
do $$ declare v_u uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
begin
  insert into public.terminology_bindings (user_id,concept_text,target_type) values (v_u,'Doppler colorido venoso de membro inferior','service_request_code');
  if (select status from public.terminology_bindings where concept_text like 'Doppler%') <> 'unmapped' then raise exception 'B: status default != unmapped'; end if;
  if exists (select 1 from public.terminology_bindings where concept_text like 'Doppler%' and (system is not null or code is not null)) then raise exception 'B: coding inventado (deveria ser NULL)'; end if;
  raise notice 'B) UNMAPPED OK (concept_text preservado; system/code NULL; status=unmapped)';
end $$;

-- ── C) PROPOSED (ai_suggested): coding presente porém NÃO confirmado ───────────
do $$ declare v_u uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
begin
  insert into public.terminology_bindings (user_id,concept_text,target_type,system,code,display,confidence,coding_source,status)
    values (v_u,'Hemoglobina','observation_code','http://loinc.org','718-7','Hemoglobin [Mass/volume] in Blood',0.8,'ai_suggested','proposed');
  if (select count(*) from public.terminology_bindings where status='proposed' and confidence is not null) <> 1 then raise exception 'C: proposta não registrada'; end if;
  raise notice 'C) PROPOSED OK (sugestão com coding + confidence, status=proposed — não vira confirmado sozinha)';
end $$;

-- ── D) NEGATIVO: confirmar sem system/code/coded_by/coded_at deve FALHAR ───────
do $$ declare v_u uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
begin
  begin
    insert into public.terminology_bindings (user_id,concept_text,status) values (v_u,'X','confirmed');
    raise exception 'D FALHOU: confirmou sem system/code/autor/instante';
  exception when check_violation then raise notice 'D OK: chk_confirmed_coding barrou confirmação sem fonte/autor'; end;
end $$;

-- ── E) CONFIRMAÇÃO VÁLIDA: com system+code+coded_by+coded_at ───────────────────
do $$ declare v_u uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
begin
  insert into public.terminology_bindings (user_id,concept_text,system,code,display,version,coding_source,coded_by,coded_at,status)
    values (v_u,'Glicose','http://loinc.org','2345-7','Glucose [Mass/volume] in Serum or Plasma','2.77','manual_curation',v_u,now(),'confirmed');
  if (select count(*) from public.terminology_bindings where status='confirmed' and coded_by is not null and coded_at is not null) <> 1 then raise exception 'E: confirmação válida não persistiu'; end if;
  raise notice 'E) CONFIRMAÇÃO OK (system+code+autor+instante presentes)';
end $$;

-- ── F) RLS (dois sentidos) ────────────────────────────────────────────────────
do $$ begin if not exists (select 1 from pg_roles where rolname='term_app_user') then create role term_app_user nologin; end if; end $$;
grant usage on schema public, auth to term_app_user;
grant select, insert, update, delete on public.terminology_bindings to term_app_user;
insert into public.terminology_bindings (user_id,concept_text) values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','Conceito de B');
begin;
  set local role term_app_user;
  set local "test.uid" = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  do $$ begin if exists (select 1 from public.terminology_bindings where user_id <> 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') then raise exception 'F-A: A viu binding de outro'; end if; raise notice 'F-A OK: A vê só os próprios'; end $$;
  set local "test.uid" = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  do $$ begin if (select count(*) from public.terminology_bindings where user_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') <> 0 then raise exception 'F-B: B viu bindings de A'; end if; raise notice 'F-B OK: B não vê bindings de A'; end $$;
commit;

select 'VALIDATION_141_OK' as resultado;

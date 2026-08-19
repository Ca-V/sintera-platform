-- Validação da migração 139 (identidade) em PostgreSQL isolado. Dados sintéticos. Exit != 0 em falha.
\set ON_ERROR_STOP on
create schema if not exists auth;
create or replace function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;

-- ── A) ESTRUTURA ──────────────────────────────────────────────────────────────
do $$ declare t text; begin
  foreach t in array array['patients','practitioners','organizations','party_identifiers'] loop
    if to_regclass('public.'||t) is null then raise exception 'A: tabela % ausente', t; end if;
    if not (select relrowsecurity from pg_class where oid=('public.'||t)::regclass) then raise exception 'A: RLS off em %', t; end if;
    if (select count(*) from pg_policies where tablename=t) <> 4 then raise exception 'A: policies != 4 em %', t; end if;
  end loop;
  if not exists (select 1 from pg_constraint where conname='chk_one_party') then raise exception 'A: chk_one_party ausente'; end if;
  -- 3 FKs reais em party_identifiers
  if (select count(*) from pg_constraint where conrelid='public.party_identifiers'::regclass and contype='f') <> 3 then raise exception 'A: FKs de party_identifiers != 3'; end if;
  raise notice 'A) ESTRUTURA OK (4 tabelas, RLS+4 policies cada, 3 FKs, chk_one_party)';
end $$;

-- ── B) ENTIDADES + IDENTIFICADORES (system NULL; identidade local preservada) ────
do $$
declare v_u uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
        v_pat uuid; v_prac uuid; v_org uuid;
begin
  insert into public.patients (user_id,name,birth_date,gender) values (v_u,'Paciente Sintético','1990-01-01','female') returning id into v_pat;
  insert into public.practitioners (user_id,name) values (v_u,'Dra. Sintética') returning id into v_prac;
  insert into public.organizations (user_id,name) values (v_u,'Clínica Sintética') returning id into v_org;
  -- CPF/CNS do paciente; CRM do profissional; CNES da organização — valores SINTÉTICOS, system NULL ([NC])
  insert into public.party_identifiers (user_id,patient_id,kind,value,use)      values (v_u,v_pat,'cpf','000.000.000-00','official'),(v_u,v_pat,'cns','000000000000000','secondary');
  insert into public.party_identifiers (user_id,practitioner_id,kind,value)     values (v_u,v_prac,'crm','CRM-SP-000000');
  insert into public.party_identifiers (user_id,organization_id,kind,value)     values (v_u,v_org,'cnes','0000000');
  -- identidade LOCAL preservada: patient tem user_id independente do CPF
  if (select user_id from public.patients where id=v_pat) is null then raise exception 'B: identidade local (user_id) ausente'; end if;
  -- system oficial NÃO inventado
  if exists (select 1 from public.party_identifiers where system is not null) then raise exception 'B: system foi inventado (deveria ser NULL)'; end if;
  if (select count(*) from public.party_identifiers) <> 4 then raise exception 'B: nº de identificadores != 4'; end if;
  raise notice 'B) ENTIDADES OK (patient/practitioner/organization + CPF/CNS/CRM/CNES; system NULL; identidade local preservada)';
end $$;

-- ── C) NEGATIVOS: exclusive-arc (chk_one_party) ──────────────────────────────────
do $$
declare v_u uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'; v_pat uuid;
begin
  select id into v_pat from public.patients limit 1;
  -- C1: zero proprietários deve FALHAR
  begin
    insert into public.party_identifiers (user_id,kind,value) values (v_u,'outro','x');
    raise exception 'C1 FALHOU: aceitou identificador sem proprietário';
  exception when check_violation then raise notice 'C1 OK: chk_one_party barrou identificador órfão'; end;
  -- C2: dois proprietários deve FALHAR
  begin
    insert into public.party_identifiers (user_id,patient_id,organization_id,kind,value)
      values (v_u,v_pat,(select id from public.organizations limit 1),'outro','y');
    raise exception 'C2 FALHOU: aceitou identificador com 2 proprietários';
  exception when check_violation then raise notice 'C2 OK: chk_one_party barrou proprietário duplo'; end;
  raise notice 'C) NEGATIVOS OK (exatamente um proprietário por identificador)';
end $$;

-- ── D) INTEGRIDADE REFERENCIAL: apagar patient remove seus identificadores (cascade) ─
do $$
declare v_u uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'; v_pat uuid; v_before int; v_after int;
begin
  insert into public.patients (user_id,name) values (v_u,'Temp') returning id into v_pat;
  insert into public.party_identifiers (user_id,patient_id,kind,value) values (v_u,v_pat,'cpf','111');
  select count(*) into v_before from public.party_identifiers;
  delete from public.patients where id=v_pat;
  select count(*) into v_after from public.party_identifiers;
  if v_after <> v_before-1 then raise exception 'D: cascade não removeu identificador do patient apagado'; end if;
  raise notice 'D) INTEGRIDADE OK (cascade patient→identifiers)';
end $$;

-- ── E) RLS (dois sentidos) ───────────────────────────────────────────────────────
do $$ begin if not exists (select 1 from pg_roles where rolname='id_app_user') then create role id_app_user nologin; end if; end $$;
grant usage on schema public, auth to id_app_user;
grant select, insert, update, delete on public.patients, public.practitioners, public.organizations, public.party_identifiers to id_app_user;
insert into public.patients (user_id,name) values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','Paciente de B');
begin;
  set local role id_app_user;
  set local "test.uid" = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  do $$ begin if (select count(*) from public.patients) < 1 then raise exception 'E-A: A não vê os próprios patients'; end if; if exists (select 1 from public.patients where user_id <> 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') then raise exception 'E-A: A viu patient de outro'; end if; raise notice 'E-A OK: A vê só os próprios'; end $$;
  set local "test.uid" = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  do $$ begin if (select count(*) from public.patients where user_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') <> 0 then raise exception 'E-B: B viu patients de A'; end if; raise notice 'E-B OK: B não vê patients de A'; end $$;
commit;

select 'VALIDATION_139_OK' as resultado;

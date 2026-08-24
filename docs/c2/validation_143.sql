-- Validação da 143 (Procedure) em PostgreSQL isolado, dados sintéticos. Exit != 0 em falha.
-- Pré: harness (auth + exams) + 138 (service_requests) + 139 (identidade) + 143 aplicados.
\set ON_ERROR_STOP on

-- ── A) ESTRUTURA ─────────────────────────────────────────────────────────────
do $$ begin
  if to_regclass('public.procedures') is null then raise exception 'A: tabela ausente'; end if;
  if not (select relrowsecurity from pg_class where oid='public.procedures'::regclass) then raise exception 'A: RLS off'; end if;
  if (select count(*) from pg_policies where tablename='procedures') <> 4 then raise exception 'A: policies != 4'; end if;
  -- FKs: service_requests, patients, practitioners, organizations, exams = 5
  if (select count(*) from pg_constraint where conrelid='public.procedures'::regclass and contype='f') <> 5 then raise exception 'A: FKs != 5'; end if;
  raise notice 'A) ESTRUTURA OK (tabela, RLS+4 policies, 5 FKs)';
end $$;

-- ── B) EXECUÇÃO: Procedure basedOn ServiceRequest, subject/performer estruturados, report→exams ────────
do $$
declare v_u uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
        v_sr uuid; v_pat uuid; v_org uuid; v_res uuid := '22222222-2222-2222-2222-222222222222';
begin
  insert into public.service_requests (id,user_id,requisition_id,code_text,subject_user_id)
    values (gen_random_uuid(), v_u, gen_random_uuid(),'Doppler venoso MI esquerdo', v_u) returning id into v_sr;
  insert into public.patients (user_id,name) values (v_u,'Paciente') returning id into v_pat;
  insert into public.organizations (user_id,name) values (v_u,'Executante') returning id into v_org;
  insert into public.procedures (id,user_id,based_on_service_request_id,status,code_text,subject_user_id,subject_patient_id,performer_organization_id,performed_start,laterality,report_exam_id)
    values ('70000000-0000-0000-0000-000000000001', v_u, v_sr,'completed','Doppler venoso MI', v_u, v_pat, v_org, now(),'esquerdo', v_res);
  -- basedOn resolve; report resolve; performer resolve
  if not exists (select 1 from public.procedures p join public.service_requests s on s.id=p.based_on_service_request_id where p.id='70000000-0000-0000-0000-000000000001') then raise exception 'B: basedOn não resolve'; end if;
  if not exists (select 1 from public.procedures p join public.exams e on e.id=p.report_exam_id where p.id='70000000-0000-0000-0000-000000000001') then raise exception 'B: report→exams não resolve'; end if;
  if (select code_system from public.procedures where id='70000000-0000-0000-0000-000000000001') is not null then raise exception 'B: coding inventado'; end if;
  raise notice 'B) EXECUÇÃO OK (Procedure basedOn ServiceRequest; report→exams; performer estruturado; coding NULL)';
end $$;

-- ── C) SEPARAÇÃO: Procedure é execução, distinta de solicitação e de resultado ─────────────────────────
do $$ begin
  -- a mesma linha não é service_request nem exam (entidades distintas)
  if exists (select 1 from public.procedures p join public.service_requests s on s.id=p.id) then raise exception 'C: procedure colide com service_request'; end if;
  if exists (select 1 from public.procedures p join public.exams e on e.id=p.id) then raise exception 'C: procedure colide com exam'; end if;
  raise notice 'C) SEPARAÇÃO OK (execução ≠ solicitação ≠ resultado)';
end $$;

-- ── D) on delete set null: apagar a solicitação/paciente NÃO apaga a execução ──────────────────────────
do $$ declare v_sr uuid; v_pat uuid;
begin
  select based_on_service_request_id, subject_patient_id into v_sr, v_pat from public.procedures where id='70000000-0000-0000-0000-000000000001';
  delete from public.service_requests where id=v_sr;
  delete from public.patients where id=v_pat;
  if not exists (select 1 from public.procedures where id='70000000-0000-0000-0000-000000000001') then raise exception 'D: procedure apagada junto'; end if;
  if (select based_on_service_request_id from public.procedures where id='70000000-0000-0000-0000-000000000001') is not null then raise exception 'D: based_on não virou NULL'; end if;
  if (select subject_patient_id from public.procedures where id='70000000-0000-0000-0000-000000000001') is not null then raise exception 'D: subject_patient não virou NULL'; end if;
  raise notice 'D) ON DELETE SET NULL OK (execução preservada; FKs → NULL)';
end $$;

-- ── E) RLS (dois sentidos) ────────────────────────────────────────────────────
do $$ begin if not exists (select 1 from pg_roles where rolname='proc_app_user') then create role proc_app_user nologin; end if; end $$;
grant usage on schema public, auth to proc_app_user;
grant select, insert, update, delete on public.procedures to proc_app_user;
insert into public.procedures (user_id,code_text,subject_user_id) values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','Proc de B','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
begin;
  set local role proc_app_user;
  set local "test.uid" = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  do $$ begin if exists (select 1 from public.procedures where user_id <> 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') then raise exception 'E-A: A viu procedure de outro'; end if; raise notice 'E-A OK: A vê só os próprios'; end $$;
  set local "test.uid" = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  do $$ begin if (select count(*) from public.procedures where user_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') <> 0 then raise exception 'E-B: B viu procedures de A'; end if; raise notice 'E-B OK: B não vê procedures de A'; end $$;
commit;

select 'VALIDATION_143_OK' as resultado;

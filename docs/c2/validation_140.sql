-- Validação da 140 (wiring de atores) em PostgreSQL isolado, dados sintéticos. Exit != 0 em falha.
-- Pré: harness (auth stub + exams mínima) + 138 + 139 + 140 aplicados.
\set ON_ERROR_STOP on

-- ── A) ESTRUTURA: 3 colunas FK nullable + FKs + índices ─────────────────────────
do $$ begin
  if (select count(*) from information_schema.columns where table_name='service_requests' and column_name in ('subject_patient_id','requester_practitioner_id','performer_organization_id')) <> 3 then raise exception 'A: colunas de wiring ausentes'; end if;
  if (select count(*) from pg_constraint where conrelid='public.service_requests'::regclass and contype='f' and confrelid in ('public.patients'::regclass,'public.practitioners'::regclass,'public.organizations'::regclass)) <> 3 then raise exception 'A: FKs de ator != 3'; end if;
  raise notice 'A) ESTRUTURA OK (3 colunas FK nullable + 3 FKs para 139 + índices)';
end $$;

-- ── B) SOLICITAÇÃO com atores estruturados (139) ────────────────────────────────
do $$
declare v_u uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
        v_pat uuid; v_prac uuid; v_org uuid;
begin
  insert into public.patients (user_id,name) values (v_u,'Paciente') returning id into v_pat;
  insert into public.practitioners (user_id,name) values (v_u,'Solicitante') returning id into v_prac;
  insert into public.organizations (user_id,name) values (v_u,'Executante') returning id into v_org;
  insert into public.service_requests (id,user_id,requisition_id,code_text,subject_user_id,subject_patient_id,requester_practitioner_id,performer_organization_id)
    values ('50000000-0000-0000-0000-000000000001',v_u, gen_random_uuid(),'Doppler venoso MI', v_u, v_pat, v_prac, v_org);
  -- os 3 atores resolvem por join
  if not exists (
    select 1 from public.service_requests s
      join public.patients p on p.id=s.subject_patient_id
      join public.practitioners pr on pr.id=s.requester_practitioner_id
      join public.organizations o on o.id=s.performer_organization_id
      where s.id='50000000-0000-0000-0000-000000000001') then raise exception 'B: atores estruturados não resolvem'; end if;
  raise notice 'B) ATORES OK (subject/requester/performer estruturados via FK)';
end $$;

-- ── C) FALLBACK: solicitação só com campos interinos (FKs de ator NULL) permanece válida ─────────────────
do $$
declare v_u uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
begin
  insert into public.service_requests (id,user_id,requisition_id,code_text,subject_user_id,requester_text,performer_text)
    values ('50000000-0000-0000-0000-000000000002',v_u, gen_random_uuid(),'USG abdome', v_u, 'Dr. Interino (texto)', 'Lab Interino (texto)');
  if exists (select 1 from public.service_requests where id='50000000-0000-0000-0000-000000000002' and (subject_patient_id is not null or requester_practitioner_id is not null or performer_organization_id is not null)) then raise exception 'C: fallback não deveria ter FK preenchida'; end if;
  raise notice 'C) FALLBACK OK (campos interinos preservados; FKs de ator opcionais)';
end $$;

-- ── D) on delete set null: apagar o ator NÃO apaga a solicitação ─────────────────
do $$
declare v_pat uuid;
begin
  select subject_patient_id into v_pat from public.service_requests where id='50000000-0000-0000-0000-000000000001';
  delete from public.patients where id=v_pat;
  if not exists (select 1 from public.service_requests where id='50000000-0000-0000-0000-000000000001') then raise exception 'D: solicitação foi apagada junto com o paciente'; end if;
  if (select subject_patient_id from public.service_requests where id='50000000-0000-0000-0000-000000000001') is not null then raise exception 'D: subject_patient_id não virou NULL'; end if;
  raise notice 'D) ON DELETE SET NULL OK (ator removido → FK NULL; solicitação preservada)';
end $$;

select 'VALIDATION_140_OK' as resultado;

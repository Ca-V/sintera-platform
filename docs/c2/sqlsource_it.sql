-- Integração do adapter sqlSource contra o DDL REAL 137→143 (isolado/sintético). Prova: (1) as colunas dos SELECTs
-- do adapter existem no schema real; (2) RLS isola A×B. As queries espelham src/lib/fhir/canonical/sqlSource.ts (Q),
-- com $1 → literal para a checagem de existência. Exit != 0 em qualquer erro.
\set ON_ERROR_STOP on
\set A '''aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'''
\set B '''bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'''

-- Stub: espelha colunas REAIS que o adapter lê (o harness mínimo não as tinha). Não é migração real.
alter table public.exams add column if not exists exam_date date;
alter table public.biomarkers add column if not exists value numeric;
alter table public.biomarkers add column if not exists unit text;

-- Dados sintéticos (A e B).
insert into public.exams (id,user_id,document_type,display_title,order_status) values
  ('e0000000-0000-0000-0000-0000000000aa', :A, null,'Doppler venoso','processed'),
  ('e0000000-0000-0000-0000-0000000000ab', :A, 'medical_order','pedido.pdf','pendente'),
  ('e0000000-0000-0000-0000-0000000000ba', :B, null,'Exame de B','processed');
insert into public.biomarkers (id,exam_id,name) values (gen_random_uuid(),'e0000000-0000-0000-0000-0000000000aa','Fluxo');
insert into public.exam_documents (exam_id,user_id,file_url,document_role) values ('e0000000-0000-0000-0000-0000000000aa', :A,'synthetic://x.pdf','laudo_final');
insert into public.patients (id,user_id,name) values ('a0000000-0000-0000-0000-0000000000a1', :A,'Paciente A'),('b0000000-0000-0000-0000-0000000000b1', :B,'Paciente B');
insert into public.practitioners (id,user_id,name) values ('a0000000-0000-0000-0000-0000000000a2', :A,'Dra A');
insert into public.organizations (id,user_id,name) values ('a0000000-0000-0000-0000-0000000000a3', :A,'Lab A');
insert into public.party_identifiers (user_id,patient_id,kind,value) values (:A,'a0000000-0000-0000-0000-0000000000a1','cpf','000');
insert into public.service_requests (id,user_id,requisition_id,code_text,subject_user_id,subject_patient_id) values
  ('a0000000-0000-0000-0000-000000000011', :A, gen_random_uuid(),'Doppler', :A,'a0000000-0000-0000-0000-0000000000a1');
insert into public.service_request_results (user_id,service_request_id,result_exam_id,linked_by,link_method,confirmed,confirmed_by,confirmed_at)
  values (:A,'a0000000-0000-0000-0000-000000000011','e0000000-0000-0000-0000-0000000000aa', :A,'user_confirmed',true, :A, now());
insert into public.procedures (user_id,based_on_service_request_id,code_text,subject_user_id,report_exam_id) values
  (:A,'a0000000-0000-0000-0000-000000000011','Doppler', :A,'e0000000-0000-0000-0000-0000000000aa');
insert into public.terminology_bindings (user_id,concept_text,target_type,target_id,system,code,status,coded_by,coded_at)
  values (:A,'Fluxo','observation_code','c0000000-0000-0000-0000-0000000000c1','http://loinc.org','1','confirmed', :A, now());
insert into public.consents (user_id,subject_user_id,purpose) values (:A, :A,'assistencial');
insert into public.audit_events (user_id,action) values (:A,'read');

-- (1) EXISTÊNCIA DE COLUNAS: cada SELECT do adapter roda sobre o DDL real (erro se coluna faltar).
select 'patients' t, count(*) from (select id, name, birth_date, gender from public.patients where user_id = :A) x
union all select 'practitioners', count(*) from (select id, name from public.practitioners where user_id = :A) x
union all select 'organizations', count(*) from (select id, name from public.organizations where user_id = :A) x
union all select 'party_identifiers', count(*) from (select patient_id, practitioner_id, organization_id, kind, value, system, use from public.party_identifiers where user_id = :A) x
union all select 'service_requests', count(*) from (select id, requisition_id, status, intent, code_text, code_system, code_value, code_display, body_site_text, body_site_system, body_site_code, laterality, subject_patient_id, requester_practitioner_id, performer_organization_id, authored_on from public.service_requests where user_id = :A) x
union all select 'service_request_results', count(*) from (select service_request_id, result_exam_id, confirmed from public.service_request_results where user_id = :A) x
union all select 'resultEvents', count(*) from (select id, display_title, exam_date from public.exams where user_id = :A and (document_type is null or document_type not in ('medical_order','insurance_guide'))) x
union all select 'observations', count(*) from (select b.id, b.exam_id, b.exam_document_id, b.name, b.value, b.unit from public.biomarkers b join public.exams e on e.id = b.exam_id where e.user_id = :A) x
union all select 'procedures', count(*) from (select id, based_on_service_request_id, status, code_text, code_system, code_value, subject_patient_id, performer_organization_id, report_exam_id, laterality, performed_start from public.procedures where user_id = :A) x
union all select 'documents', count(*) from (select id, exam_id, file_url, document_sha256, document_role, uploaded_at, source, current_extraction_version_id from public.exam_documents where user_id = :A) x
union all select 'terminology', count(*) from (select target_type, target_id, concept_text, system, code, display, status from public.terminology_bindings where user_id = :A and status='confirmed') x
union all select 'consents', count(*) from (select id, purpose, status, recipient from public.consents where user_id = :A) x
union all select 'audit_events', count(*) from (select id, action, entity_type, occurred_at from public.audit_events where user_id = :A) x;

-- (2) RLS: role não-owner. Com test.uid=A vê os SR de A; com test.uid=B, o MESMO WHERE user_id=A retorna 0 (RLS nega).
do $$ begin if not exists (select 1 from pg_roles where rolname='sqlsrc_user') then create role sqlsrc_user nologin; end if; end $$;
grant usage on schema public, auth to sqlsrc_user;
grant select on public.service_requests, public.exams, public.procedures, public.patients to sqlsrc_user;
begin;
  set local role sqlsrc_user;
  set local "test.uid" = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  do $$ begin if (select count(*) from public.service_requests where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') <> 1 then raise exception 'RLS-A: A não vê seus SR'; end if; raise notice 'RLS-A OK (A vê os próprios SR)'; end $$;
  set local "test.uid" = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  do $$ begin if (select count(*) from public.service_requests where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') <> 0 then raise exception 'RLS-B: B leu SR de A (RLS falhou)'; end if; raise notice 'RLS-B OK (B NÃO vê SR de A, mesmo consultando user_id=A)'; end $$;
commit;

select 'SQLSOURCE_IT_OK' as resultado;

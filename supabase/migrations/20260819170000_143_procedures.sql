-- 143 — Procedure (execução efetivamente realizada — FHIR Procedure). DDL ADITIVO, idempotente, reversível.
-- Separa EXECUÇÃO de solicitação (ServiceRequest, 138) e de resultado (DiagnosticReport/Observation). NÃO popula
-- nada (coding NULL até curadoria). NÃO toca tabelas existentes nem o Ciclo 1. Depende de 138 (service_requests)
-- e 139 (patients/practitioners/organizations); referencia exams (resultado/relatório). Rollback: docs/c2/rollback_143_procedures.sql.

do $$ begin
  if not exists (select 1 from pg_type where typname='procedure_status') then
    create type public.procedure_status as enum
      ('preparation','in-progress','not-done','on-hold','stopped','completed','entered-in-error','unknown');
  end if;
end $$;

create table if not exists public.procedures (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null,
  -- FHIR Procedure.basedOn → ServiceRequest (a execução cumpre uma solicitação, quando houver).
  based_on_service_request_id uuid references public.service_requests(id) on delete set null,
  status                      public.procedure_status not null default 'completed',
  -- FHIR Procedure.code (CodeableConcept): text sempre; coding NULL até curadoria (NÃO inventar). [NC]
  code_text                   text not null,
  code_system                 text,
  code_value                  text,
  code_display                text,
  code_version                text,
  -- FHIR Procedure.subject (interim user + Patient estruturado).
  subject_user_id             uuid not null,
  subject_patient_id          uuid references public.patients(id) on delete set null,
  -- FHIR Procedure.performer (Practitioner/Organization).
  performer_practitioner_id   uuid references public.practitioners(id) on delete set null,
  performer_organization_id   uuid references public.organizations(id) on delete set null,
  -- FHIR Procedure.performed[x].
  performed_start             timestamptz,
  performed_end               timestamptz,
  -- FHIR Procedure.bodySite + lateralidade.
  body_site_text              text,
  body_site_system            text,
  body_site_code              text,
  laterality                  text check (laterality is null or laterality in ('esquerdo','direito','bilateral','nao_aplicavel')),
  -- FHIR Procedure.report → resultado/laudo (evento-resultado em exams).
  report_exam_id              uuid references public.exams(id) on delete set null,
  outcome_text                text,
  reason_text                 text,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);
create index if not exists idx_procedures_based_on   on public.procedures(based_on_service_request_id);
create index if not exists idx_procedures_subject    on public.procedures(subject_patient_id);
create index if not exists idx_procedures_report     on public.procedures(report_exam_id);
create index if not exists idx_procedures_user       on public.procedures(user_id);

alter table public.procedures enable row level security;
drop policy if exists procedures_select on public.procedures;
create policy procedures_select on public.procedures for select using (auth.uid() = user_id);
drop policy if exists procedures_insert on public.procedures;
create policy procedures_insert on public.procedures for insert with check (auth.uid() = user_id);
drop policy if exists procedures_update on public.procedures;
create policy procedures_update on public.procedures for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists procedures_delete on public.procedures;
create policy procedures_delete on public.procedures for delete using (auth.uid() = user_id);

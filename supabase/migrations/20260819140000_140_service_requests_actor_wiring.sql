-- 140 — Wiring dos atores: FKs NULLABLE de service_requests → Patient/Practitioner/Organization (139).
-- DDL ADITIVO, idempotente, reversível. Só ALTERA service_requests (tabela criada na 138 — NÃO é baseline do
-- Ciclo 1, NÃO tem dado legado). Mantém os campos INTERINOS (subject_user_id/requester_text/performer_text)
-- como fallback — não os remove. `on delete set null`: apagar o ator não apaga a solicitação. NÃO popula nada.
-- Depende de 138 (service_requests) e 139 (patients/practitioners/organizations). Rollback: docs/c2/rollback_140_wiring.sql.

alter table public.service_requests
  add column if not exists subject_patient_id        uuid references public.patients(id)        on delete set null;
alter table public.service_requests
  add column if not exists requester_practitioner_id uuid references public.practitioners(id)   on delete set null;
alter table public.service_requests
  add column if not exists performer_organization_id uuid references public.organizations(id)   on delete set null;

create index if not exists idx_service_requests_subject_patient        on public.service_requests(subject_patient_id);
create index if not exists idx_service_requests_requester_practitioner on public.service_requests(requester_practitioner_id);
create index if not exists idx_service_requests_performer_organization on public.service_requests(performer_organization_id);

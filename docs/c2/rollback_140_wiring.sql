-- Rollback da 140 (wiring de atores). Remove só as colunas/índices adicionados; não toca os campos interinos,
-- nem os dados de service_requests (138) / patients-practitioners-organizations (139). Idempotente/reversível.
drop index if exists public.idx_service_requests_subject_patient;
drop index if exists public.idx_service_requests_requester_practitioner;
drop index if exists public.idx_service_requests_performer_organization;
alter table public.service_requests drop column if exists subject_patient_id;
alter table public.service_requests drop column if exists requester_practitioner_id;
alter table public.service_requests drop column if exists performer_organization_id;

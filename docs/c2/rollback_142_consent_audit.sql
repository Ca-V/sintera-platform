-- Rollback da 142 (governança). Estrutural/reversível; remove só o que a 142 criou. Idempotente.
drop table if exists public.audit_events;
drop table if exists public.consents;
drop type  if exists public.audit_action;
drop type  if exists public.consent_purpose;
drop type  if exists public.consent_status;

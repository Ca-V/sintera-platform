-- Rollback da 141 (terminologia). Estrutural/reversível; remove só o que a 141 criou. Idempotente.
drop table if exists public.terminology_bindings;
drop type  if exists public.terminology_source;
drop type  if exists public.terminology_status;

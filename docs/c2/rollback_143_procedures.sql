-- Rollback da 143 (Procedure). Estrutural/reversível; remove só o que a 143 criou. Idempotente.
drop table if exists public.procedures;
drop type  if exists public.procedure_status;

-- Rollback da migração 139 (identidade). Estrutural e reversível; remove só o que a 139 criou. Idempotente.
drop table if exists public.party_identifiers;
drop table if exists public.patients;
drop table if exists public.practitioners;
drop table if exists public.organizations;
drop type  if exists public.identifier_kind;
drop type  if exists public.party_type;

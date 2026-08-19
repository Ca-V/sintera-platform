-- Harness da 139 (isolado): stub do schema/função auth.uid() do Supabase, exigido pelas policies RLS.
-- Em Supabase real o schema `auth` já existe; aqui reproduzimos o mínimo para testar RLS fora do Supabase.
create schema if not exists auth;
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('test.uid', true), '')::uuid $$;

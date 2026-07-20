-- HIP-001 / V2 Épico 1.1 (correção) — proteger tokens SEM view security-definer (passa no linter Shield).
-- Estratégia: RLS de leitura própria + GRANT por COLUNA (tokens nunca selecionáveis pelo cliente) +
-- view security_invoker (respeita RLS e os grants de coluna). Substitui a view definer criada na 127.

-- (1) tokens fora do alcance do cliente: revoga SELECT amplo e concede só colunas não-sensíveis.
revoke select on public.wearable_connections from anon;
revoke select on public.wearable_connections from authenticated;
grant select (user_id, provider, status, expires_at, scope, created_at, updated_at)
  on public.wearable_connections to authenticated;

-- (2) RLS: o usuário lê a PRÓPRIA linha (colunas de token continuam barradas pelo grant acima).
drop policy if exists wearable_connections_select_own on public.wearable_connections;
create policy wearable_connections_select_own on public.wearable_connections
  for select using ((select auth.uid()) = user_id);

-- (3) view de status = security_invoker (respeita a RLS e os grants de coluna do próprio usuário).
create or replace view public.wearable_connection_status
  with (security_invoker = on) as
  select user_id, provider, status, expires_at, scope, created_at, updated_at
  from public.wearable_connections;
comment on view public.wearable_connection_status is
  'HIP-001: estado das conexoes do proprio usuario SEM tokens (estado visivel/Painel). security_invoker: respeita RLS + grants de coluna.';
revoke all on public.wearable_connection_status from anon;
grant select on public.wearable_connection_status to authenticated;

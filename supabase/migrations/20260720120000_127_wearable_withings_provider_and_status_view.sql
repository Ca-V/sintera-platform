-- HIP-001 / V2 Épico 1.1 — reconciliação de esquema para o 1º conector cloud + segurança. Aditivo/seguro.
-- (1) provider aceita 'withings' (mantém oura/garmin/strava); reconciliação sob HIP-001, não ad hoc.
-- (2) reforço: tokens seguem SEGREDO — RLS habilitada e SEM policy de leitura = acesso só via service_role.
-- (3) VIEW de status SEM tokens: o usuário consulta o próprio estado de conexão (base do "estado visível").

-- (1) provider += withings
alter table public.wearable_connections drop constraint if exists wearable_connections_provider_check;
alter table public.wearable_connections
  add constraint wearable_connections_provider_check
  check (provider in ('oura','garmin','strava','withings'));

-- (2) tokens = segredo (idempotente: garante o estado desejado)
alter table public.wearable_connections enable row level security;
comment on table public.wearable_connections is
  'HIP-001: conexoes/tokens OAuth por usuario x fonte. SEGREDO: RLS sem policy = acesso so via service_role. Estado sem tokens em public.wearable_connection_status.';

-- (3) view de status SEM tokens — filtra por auth.uid(); nunca expoe access_token/refresh_token.
-- View (security definer por padrao no PG15) contorna a RLS da base e restringe ao proprio usuario pela clausula.
create or replace view public.wearable_connection_status as
  select user_id, provider, status, expires_at, scope, created_at, updated_at
  from public.wearable_connections
  where user_id = (select auth.uid());
comment on view public.wearable_connection_status is
  'HIP-001: estado das conexoes do proprio usuario SEM tokens (base do estado visivel/Painel Operacional). Filtra por auth.uid().';
revoke all on public.wearable_connection_status from anon;
grant select on public.wearable_connection_status to authenticated;

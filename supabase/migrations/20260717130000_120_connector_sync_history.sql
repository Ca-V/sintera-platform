-- WEA-001 / HIP-001 — histórico operacional de sincronizações + proveniência das leituras. Aditivo/seguro.
-- Suporta o Painel Operacional de Integrações e a reconciliação/dedup preservando origem.

create table if not exists public.connector_sync_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  source text not null,                       -- fonte/conector (strava/garmin/...); domain-neutral
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'pending',     -- pending | ok | partial | error
  records_count integer not null default 0,
  error text,
  last_success_at timestamptz,
  created_at timestamptz not null default now()
);
comment on table public.connector_sync_runs is
  'WEA-001/HIP-001: historico de sincronizacoes por conector (origem, data/hora, status, n registros, erros, ultima sync ok). Base do Painel Operacional de Integracoes.';
create index if not exists idx_connector_sync_runs_user_source
  on public.connector_sync_runs (user_id, source, started_at desc);
alter table public.connector_sync_runs enable row level security;
drop policy if exists connector_sync_runs_select_own on public.connector_sync_runs;
create policy connector_sync_runs_select_own on public.connector_sync_runs
  for select using (auth.uid() = user_id);

-- Proveniencia das leituras (idempotencia/auditoria) — aditivo.
alter table public.wearable_readings add column if not exists external_id text;
alter table public.wearable_readings add column if not exists connector_version text;
comment on column public.wearable_readings.external_id is
  'WEA-001: id do registro na fonte (idempotencia/rastreio na reconciliacao).';
comment on column public.wearable_readings.connector_version is
  'WEA-001: versao do conector que produziu a leitura (auditoria/reprodutibilidade).';

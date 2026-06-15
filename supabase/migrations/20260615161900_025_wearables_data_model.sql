-- FASE 2 (2a) — modelo de dados de wearables (provider-agnóstico).
-- Tabelas inertes até o fluxo OAuth ser implementado (depende de credenciais do provedor).

-- Conexões OAuth: tokens são SEGREDO → tabela é service_role only (RLS sem policies).
create table if not exists public.wearable_connections (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users on delete cascade,
  provider      text not null check (provider in ('oura','garmin','strava')),
  access_token  text,
  refresh_token text,
  expires_at    timestamptz,
  scope         text,
  status        text not null default 'connected' check (status in ('connected','expired','revoked','error')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, provider)
);
alter table public.wearable_connections enable row level security;
-- sem policies: acesso só via service_role (tokens nunca expostos ao client).

-- Leituras normalizadas: dado de saúde da usuária → ela pode ler o próprio (como biomarkers).
create table if not exists public.wearable_readings (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  provider    text not null,
  metric      text not null,
  value       numeric,
  unit        text,
  recorded_at timestamptz not null,
  raw         jsonb,
  created_at  timestamptz not null default now(),
  unique (user_id, provider, metric, recorded_at)
);
alter table public.wearable_readings enable row level security;
create policy wearable_readings_select_own on public.wearable_readings
  for select using ((select auth.uid()) = user_id);
create index if not exists wearable_readings_user_metric_idx
  on public.wearable_readings (user_id, metric, recorded_at desc);

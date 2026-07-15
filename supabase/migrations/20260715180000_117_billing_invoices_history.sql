-- BILLING-001 — Invoices + histórico da assinatura (fundadora 15/07: construir a infra completa já;
-- valores/planos comerciais depois). Serviço comercial DESACOPLADO; módulos só leem entitlements.
-- Gateway de pagamento é canal separado (adapter) — aqui só o registro financeiro/auditável.

-- Faturas do assinante (cobranças). status cobre o ciclo de pagamento; external_ref = id no gateway.
create table if not exists public.billing_invoices (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  plan_id      text references public.billing_plans(id),
  amount_cents integer not null default 0,
  currency     text not null default 'BRL',
  status       text not null default 'open'
                 check (status in ('open','paid','failed','void','refunded')),
  issued_at    timestamptz not null default now(),
  due_at       timestamptz,
  paid_at      timestamptz,
  external_ref text,                                   -- id da fatura no gateway (quando houver)
  meta         jsonb not null default '{}'::jsonb
);

comment on table public.billing_invoices is
  'BILLING-001: faturas/cobrancas do assinante. Historico financeiro. Gateway preenche external_ref/paid_at.';

create index if not exists billing_invoices_user_idx on public.billing_invoices (user_id, issued_at desc);

-- Histórico de eventos da assinatura (auditável/versionado): cada transição do ciclo de vida.
create table if not exists public.subscription_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  action      text not null,                           -- subscribe/renew/cancel/suspend/… (lifecycle)
  from_status text,
  to_status   text not null,
  plan_id     text references public.billing_plans(id),
  source      text not null default 'system',          -- system | gateway_webhook | admin
  external_ref text,
  created_at  timestamptz not null default now()
);

comment on table public.subscription_events is
  'BILLING-001: historico auditavel das transicoes da assinatura (ciclo de vida). Alimentado pelo servico/webhooks.';

create index if not exists subscription_events_user_idx on public.subscription_events (user_id, created_at desc);

-- RLS — usuário lê o PRÓPRIO histórico/faturas; escrita fica com o serviço de billing (service role).
alter table public.billing_invoices enable row level security;
drop policy if exists billing_invoices_select_own on public.billing_invoices;
create policy billing_invoices_select_own on public.billing_invoices
  for select using (auth.uid() = user_id);

alter table public.subscription_events enable row level security;
drop policy if exists subscription_events_select_own on public.subscription_events;
create policy subscription_events_select_own on public.subscription_events
  for select using (auth.uid() = user_id);

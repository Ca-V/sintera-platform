-- BILLING-001 — ACOMODAÇÃO do ciclo operacional no modelo (fundadora 15/07): o modelo deve
-- comportar renovação automática, período de carência, trial, múltiplos meios de pagamento,
-- cupons/créditos e documentos fiscais — SEM implementar os fluxos agora, para evitar mudança
-- estrutural futura. Apenas colunas/estruturas acomodadoras (nullable / com default seguro).

-- Assinatura: aspectos operacionais.
alter table public.subscriptions
  add column if not exists auto_renew     boolean not null default true,   -- renovação automática
  add column if not exists trial_ends_at  timestamptz,                     -- fim do período de teste
  add column if not exists grace_until    timestamptz,                     -- carência (inadimplência)
  add column if not exists payment_method text,                           -- meio ATUAL (ref no gateway)
  add column if not exists meta           jsonb not null default '{}'::jsonb;

-- Fatura: desconto/cupom + crédito aplicado + espaço fiscal (meta já existe p/ NF-e/nota).
alter table public.billing_invoices
  add column if not exists discount_cents integer not null default 0,      -- cupom/desconto
  add column if not exists credit_cents   integer not null default 0,      -- crédito aplicado (proração)
  add column if not exists coupon_code    text;

-- Métodos de pagamento cadastrados por usuário (MÚLTIPLOS meios). Tokens/segredos ficam no gateway;
-- aqui só a referência e o rótulo. Estrutura pronta; fluxo de uso implementado depois.
create table if not exists public.payment_methods (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  kind         text not null,                                             -- 'card' | 'pix' | 'boleto' | …
  brand        text,
  last4        text,
  external_ref text,                                                      -- id no gateway
  is_default   boolean not null default false,
  created_at   timestamptz not null default now()
);

comment on table public.payment_methods is
  'BILLING-001: meios de pagamento do usuario (multiplos). Segredos/tokens ficam no gateway; aqui so referencia.';

create index if not exists payment_methods_user_idx on public.payment_methods (user_id);

alter table public.payment_methods enable row level security;
drop policy if exists payment_methods_select_own on public.payment_methods;
create policy payment_methods_select_own on public.payment_methods
  for select using (auth.uid() = user_id);

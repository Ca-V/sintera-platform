-- BILLING-001 — Fundação de Assinaturas (fundadora). Serviço comercial DESACOPLADO: os módulos
-- só consultam ENTITLEMENTS. Aqui ficam o catálogo de planos e a assinatura do usuário. Gateway de
-- pagamento é canal separado (adapters), fora daqui. Pré-comercial: plano 'free' concede tudo.

-- Catálogo de planos (slug aberto; entitlements como JSON — features/limits/modules).
create table if not exists public.billing_plans (
  id           text primary key,                       -- 'free', 'pro', … (aberto)
  name         text not null,
  entitlements jsonb not null default '{"features":[],"limits":{},"modules":[]}'::jsonb,
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

comment on table public.billing_plans is
  'BILLING-001: catalogo de planos. entitlements = {features[],limits{},modules[]}. Fronteira unica = entitlements.';

-- Plano FREE (curinga) — pré-comercial não restringe nada.
insert into public.billing_plans (id, name, entitlements)
values ('free', 'Gratuito', '{"features":["*"],"limits":{},"modules":["*"]}'::jsonb)
on conflict (id) do nothing;

-- Assinatura do usuário (uma vigente por usuário; evolui se necessário).
create table if not exists public.subscriptions (
  user_id            uuid primary key references auth.users(id) on delete cascade,
  plan_id            text not null references public.billing_plans(id),
  status             text not null default 'active'
                       check (status in ('active','trial','past_due','suspended','canceled')),
  current_period_end timestamptz,
  updated_at         timestamptz not null default now()
);

comment on table public.subscriptions is
  'BILLING-001: assinatura vigente do usuario (plano + status). Ausencia = FREE no dominio.';

-- RLS — catálogo: leitura por autenticados (planos são públicos p/ o app); escrita só service role.
alter table public.billing_plans enable row level security;
drop policy if exists billing_plans_select_auth on public.billing_plans;
create policy billing_plans_select_auth on public.billing_plans
  for select using (auth.role() = 'authenticated');

-- RLS — assinatura: o usuário lê a PRÓPRIA; escrita fica com o serviço de billing (service role).
alter table public.subscriptions enable row level security;
drop policy if exists subscriptions_select_own on public.subscriptions;
create policy subscriptions_select_own on public.subscriptions
  for select using (auth.uid() = user_id);

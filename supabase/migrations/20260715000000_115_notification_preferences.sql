-- NOTIF-001 — Infraestrutura ÚNICA de notificações (fundadora 14/07/2026).
-- Preferências por USUÁRIO × CATEGORIA de evento, escolhendo o canal:
--   'email' | 'whatsapp' | 'both' | 'none'  (e-mail · WhatsApp · ambos · nenhum).
-- Reutilizada por TODOS os módulos; o orquestrador consulta esta tabela antes de enviar.
-- `category` é string ABERTA (Modelo Aberto): categoria nova não exige mudança estrutural;
-- ausência de linha = default no domínio (e-mail; ou continuidade do opt-in legado de WhatsApp).

create table if not exists public.notification_preferences (
  user_id    uuid not null references auth.users(id) on delete cascade,
  category   text not null,
  channel    text not null default 'email' check (channel in ('email','whatsapp','both','none')),
  updated_at timestamptz not null default now(),
  primary key (user_id, category)
);

comment on table public.notification_preferences is
  'NOTIF-001: canal de notificação por usuário × categoria de evento (email/whatsapp/both/none). Infra única transversal; ausência de linha = default do domínio.';

alter table public.notification_preferences enable row level security;

-- RLS: cada usuário gerencia apenas as próprias preferências.
drop policy if exists notification_preferences_select_own on public.notification_preferences;
create policy notification_preferences_select_own on public.notification_preferences
  for select using (auth.uid() = user_id);

drop policy if exists notification_preferences_insert_own on public.notification_preferences;
create policy notification_preferences_insert_own on public.notification_preferences
  for insert with check (auth.uid() = user_id);

drop policy if exists notification_preferences_update_own on public.notification_preferences;
create policy notification_preferences_update_own on public.notification_preferences
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists notification_preferences_delete_own on public.notification_preferences;
create policy notification_preferences_delete_own on public.notification_preferences
  for delete using (auth.uid() = user_id);

-- NOTIF-001 (FB-011) — Central de Notificações: fonte ÚNICA das preferências.
-- Granularidade por EVENTO (categoria.evento), com CANAL escolhido pela usuária. Eventos OBRIGATÓRIOS
-- (críticos: cadastro/senha/compartilhamento aceito) NÃO entram aqui — sempre enviados pelo sistema.
-- Aditivo/reversível; RLS owner-only. O catálogo (categorias/eventos/prioridade/default) vive no CÓDIGO
-- (src/lib/notifications/catalog.ts) — o banco guarda só o override por evento.
create table if not exists public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_key text not null,                       -- ex.: 'consultas.lembrete', 'exames.recorrencia'
  channel text not null check (channel in ('nenhum','email','whatsapp','ambos')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, event_key)
);
comment on table public.notification_preferences is 'NOTIF-001: preferência de canal por usuário × evento de notificação (categoria.evento). Fonte única; catálogo no código.';

alter table public.notification_preferences enable row level security;

drop policy if exists notif_prefs_select on public.notification_preferences;
create policy notif_prefs_select on public.notification_preferences for select using (auth.uid() = user_id);
drop policy if exists notif_prefs_insert on public.notification_preferences;
create policy notif_prefs_insert on public.notification_preferences for insert with check (auth.uid() = user_id);
drop policy if exists notif_prefs_update on public.notification_preferences;
create policy notif_prefs_update on public.notification_preferences for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists notif_prefs_delete on public.notification_preferences;
create policy notif_prefs_delete on public.notification_preferences for delete using (auth.uid() = user_id);

-- Telefone p/ WhatsApp (o envio real depende de provedor; a preferência/telefone ficam salvos desde já).
alter table public.profiles add column if not exists whatsapp_number text;
comment on column public.profiles.whatsapp_number is 'NOTIF-001: telefone p/ notificações via WhatsApp (E.164, ex.: +5511999999999). Envio depende de provedor.';
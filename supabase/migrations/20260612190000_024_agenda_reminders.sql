-- ============================================================
-- Migration 024 — Lembretes da Agenda (Fase 2)
-- ============================================================
-- Campos de controle de lembrete por e-mail em agenda_events.
-- O envio é feito por um worker (rota Next) acionado por pg_cron.
-- ============================================================

alter table public.agenda_events
  add column if not exists reminder_enabled boolean not null default true,
  add column if not exists reminder_sent_at timestamptz;

-- Índice para o worker buscar eventos elegíveis a lembrete de forma eficiente.
create index if not exists agenda_events_reminder_idx
  on public.agenda_events (event_date)
  where status = 'pending' and reminder_enabled = true and reminder_sent_at is null;

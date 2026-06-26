-- T2-C Consolidacao Fase 1 — health_events canonico cobre TODOS os casos da Agenda.
-- Traz os campos de agendamento/lembrete que so existiam em agenda_events.
-- ADITIVO e inerte (nullable/default); nenhum comportamento muda ate a camada de
-- servico/UI consumir. Status canonico (planejado/confirmado/realizado/cancelado/
-- reagendado/perdido) ja cobre o pending/done/cancelled de agenda_events (mapeado
-- no adaptador). event_time ja existe (migration 074).

alter table public.health_events
  add column if not exists duration_min integer,
  add column if not exists reminder_enabled boolean not null default true,
  add column if not exists reminder_sent_at timestamptz;

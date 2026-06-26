-- T2-C — prioridade do evento (Alta/Media/Baixa). ADITIVO e inerte.
-- Futuro: ordenar a Agenda, destacar exames importantes, priorizar lembretes.
alter table public.health_events
  add column if not exists priority text check (priority in ('alta', 'media', 'baixa'));

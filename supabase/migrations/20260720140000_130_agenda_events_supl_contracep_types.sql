-- NOTIF-001 / FB-017 — a Central de Notificações espelha os domínios da Sidebar. Para separar os lembretes de
-- Suplementos e de Ciclo/Contracepção (hoje todos como 'medicacao'), a ORIGEM passa a emitir tipos próprios.
-- agenda_events (legado, usado por Medicamentos/Suplementos/Ciclo) precisa aceitar esses tipos. Aditivo/seguro.
alter table public.agenda_events drop constraint if exists agenda_events_event_type_check;
alter table public.agenda_events
  add constraint agenda_events_event_type_check
  check (event_type in ('exame','consulta','retorno','medicacao','outro','suplemento','contracepcao'));

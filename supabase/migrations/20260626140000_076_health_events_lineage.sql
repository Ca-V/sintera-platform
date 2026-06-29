-- T2-C — vinculo de origem dos eventos DERIVADOS (cadeia da jornada).
-- exame -> recomendacao -> consulta -> retorno -> novo exame (navegavel).
-- ADITIVO e inerte; logica futura. Modelo apenas preparado.

alter table public.health_events
  add column if not exists parent_event_id uuid,
  add column if not exists root_event_id uuid;

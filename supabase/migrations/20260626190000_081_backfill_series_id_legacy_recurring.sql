-- 081: a recorrência pertence à SÉRIE (series_id + recurrence_rule). Eventos legados
-- com recurrence_rule preenchida mas series_id nulo ficavam "órfãos de série" (ex.: a
-- recompra de medicamento que não gerava ocorrências). Backfill: cada um ganha um
-- series_id próprio, deixando antigos e novos consistentes. Idempotente.
update public.health_events
set series_id = gen_random_uuid()
where coalesce(recurrence_rule, '') <> '' and series_id is null;

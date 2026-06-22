-- 045 — health_events: tipo 'atividade' (atividade física)
--
-- Permite registrar atividade física na jornada (caminhada, corrida,
-- musculação, yoga…), tanto realizada quanto planejada (data futura, com
-- lembrete). Autorrelato factual.

ALTER TABLE public.health_events DROP CONSTRAINT IF EXISTS health_events_event_type_check;

ALTER TABLE public.health_events ADD CONSTRAINT health_events_event_type_check
  CHECK (event_type IN ('consulta','vacina','procedimento','exame','outro','estetico','medicamento','atividade'));

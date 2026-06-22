-- 039 — health_events: novos tipos 'estetico' e 'medicamento'
--
-- Permite que a usuária registre na sua jornada, além de consultas/vacinas/
-- procedimentos/exames: procedimentos ESTÉTICOS e MEDICAMENTOS (em uso).
-- Continua sendo organização factual autorrelatada — sem juízo clínico.

ALTER TABLE public.health_events DROP CONSTRAINT IF EXISTS health_events_event_type_check;

ALTER TABLE public.health_events ADD CONSTRAINT health_events_event_type_check
  CHECK (event_type IN ('consulta','vacina','procedimento','exame','outro','estetico','medicamento'));

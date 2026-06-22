-- 042 — health_events.professional_kind (tipo de profissional de saúde)
--
-- Permite registrar, numa consulta, QUAL profissional: médico, psicólogo,
-- nutricionista, fisioterapeuta, dentista, outro. Amplia a jornada além do
-- médico. Autorrelato factual.

ALTER TABLE public.health_events
  ADD COLUMN IF NOT EXISTS professional_kind text;

COMMENT ON COLUMN public.health_events.professional_kind
  IS 'Tipo de profissional de saúde da consulta (medico, psicologo, nutricionista, fisioterapeuta, dentista, outro). Opcional.';

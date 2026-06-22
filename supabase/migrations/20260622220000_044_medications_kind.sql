-- 044 — medications.kind (medicamento × suplemento)
--
-- Permite registrar também SUPLEMENTOS (vitaminas, ômega-3, etc.) na mesma
-- seção, distinguindo de medicamentos. Autorrelato factual — sem prescrição.

ALTER TABLE public.medications
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'medicamento'
  CHECK (kind IN ('medicamento','suplemento'));

COMMENT ON COLUMN public.medications.kind IS 'medicamento | suplemento.';

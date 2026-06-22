-- 060 — Óculos: suportar também lentes de contato.
-- kind distingue óculos de lentes de contato; bc (curva base) e dia (diâmetro)
-- são específicos de lentes de contato. Registro factual autorrelatado.

ALTER TABLE public.eyeglass_prescriptions
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'oculos' CHECK (kind IN ('oculos','lentes_contato')),
  ADD COLUMN IF NOT EXISTS bc  text,
  ADD COLUMN IF NOT EXISTS dia text;

-- 049 — report_shares.sections (quais seções o link compartilhado mostra)
--
-- A usuária escolhe o que mostrar ao profissional. Array de chaves de seção
-- (ex.: ["medicamentos","exames"]). NULL = mostra todas.

ALTER TABLE public.report_shares
  ADD COLUMN IF NOT EXISTS sections jsonb;

COMMENT ON COLUMN public.report_shares.sections
  IS 'Seções incluídas no link (array de chaves). NULL = todas.';

-- 097 — report_shares.period (Contexto Temporal no link compartilhado · REL-001)
--
-- O período (Contexto Temporal da Camada de Comunicação) escolhido ao gerar o link
-- passa a ser persistido no compartilhamento, para que o relatório público
-- (/r/[token]) aplique o MESMO recorte temporal que o relatório exibido/PDF.
-- Aditivo e reversível. Null = sem recorte (todo o histórico), compatível com
-- links já existentes.

ALTER TABLE public.report_shares
  ADD COLUMN IF NOT EXISTS period jsonb;

COMMENT ON COLUMN public.report_shares.period IS
  'Contexto Temporal do compartilhamento (Period: {preset, from, to}). Null = todo o histórico.';

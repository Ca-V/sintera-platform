-- 040 — health_events: valor pago (gastos com saúde)
--
-- Permite registrar o valor pago (particular) de um evento da jornada e, com o
-- comprovante já anexável, organizar os gastos com saúde por ano (ex.: para
-- juntar documentos da declaração de imposto de renda). Apenas organização
-- financeira/factual — não é orientação tributária nem clínica.
--
-- Valor em CENTAVOS (inteiro) para evitar imprecisão de ponto flutuante.

ALTER TABLE public.health_events
  ADD COLUMN IF NOT EXISTS amount_cents integer;

COMMENT ON COLUMN public.health_events.amount_cents
  IS 'Valor pago pela usuária (particular), em centavos de BRL. Opcional.';

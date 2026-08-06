-- REL-002 — Link público do relatório respeita o filtro item-a-item (por seção).
-- Aditivo e retrocompatível: links antigos ficam com '{}' (nenhuma exclusão). O /r/[token] lê esta coluna e
-- aplica as mesmas exclusões do relatório que gerou o link (exames/eventos/medicamentos/suplementos).
-- Ex.: { "exames": ["Hemograma__2026-01-01"], "eventos": ["consulta"] }
ALTER TABLE public.report_shares
  ADD COLUMN IF NOT EXISTS excluded jsonb NOT NULL DEFAULT '{}'::jsonb;

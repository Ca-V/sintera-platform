-- ============================================================
-- SINTERA — Migração 030: onda e prioridade de curadoria no catálogo
-- ============================================================
-- ✅ Estrutura apenas (sem UPDATE/INSERT/backfill clínico/trigger/regra).
--
-- A governança é desenhada para ESCALAR (centenas/milhares de biomarcadores).
-- Os 83 atuais são o Sprint 0 / Onda 1. Estes campos orientam a ORDEM da
-- curadoria sem carregar juízo clínico:
--
--   curation_wave     — em qual onda o biomarcador entra (1 = catálogo atual).
--   curation_priority — prioridade dentro da onda (1 = mais alta), definida no
--                       planejamento da curadoria. NULL até ser planejada.
--
-- O DEFAULT 1 em curation_wave reflete a DEFINIÇÃO (catálogo atual = Onda 1),
-- não um backfill de decisão. Ver docs/clinical/GOVERNANCA-CIENTIFICA.md §3.4.
-- ============================================================

ALTER TABLE biomarker_catalog
  ADD COLUMN IF NOT EXISTS curation_wave smallint NOT NULL DEFAULT 1
    CHECK (curation_wave >= 1),
  ADD COLUMN IF NOT EXISTS curation_priority smallint
    CHECK (curation_priority BETWEEN 1 AND 5);

COMMENT ON COLUMN biomarker_catalog.curation_wave IS
  'Onda de curadoria em que o biomarcador entra (1 = catálogo atual / Sprint 0). Escala com o crescimento do catálogo.';
COMMENT ON COLUMN biomarker_catalog.curation_priority IS
  'Prioridade dentro da onda (1 = mais alta). NULL até o planejamento da curadoria definir. Não é juízo clínico.';

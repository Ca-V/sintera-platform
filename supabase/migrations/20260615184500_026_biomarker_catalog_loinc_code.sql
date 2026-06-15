-- ============================================================
-- SINTERA — Migração 026: loinc_code no biomarker_catalog
-- ============================================================
-- Adiciona o identificador LOINC a cada biomarcador do catálogo.
-- INTEROPERABILIDADE/desambiguação — NÃO é conteúdo clínico nem interpretação.
-- Ver docs/clinical/GOVERNANCA-CIENTIFICA.md §1.2.
--
-- A coluna nasce VAZIA (NULL). O preenchimento (mapear cada code -> código LOINC)
-- é trabalho de curadoria, validado pelo Responsável Clínico. Nada é inferido
-- automaticamente aqui.
-- ============================================================

ALTER TABLE biomarker_catalog
  ADD COLUMN IF NOT EXISTS loinc_code text;

COMMENT ON COLUMN biomarker_catalog.loinc_code IS
  'Código LOINC do exame (interoperabilidade). NULL até curadoria humana mapear. Não é interpretação clínica.';

-- Índice parcial: só indexa quando houver mapeamento (catálogo pequeno; barato).
CREATE INDEX IF NOT EXISTS biomarker_catalog_loinc_idx
  ON biomarker_catalog (loinc_code)
  WHERE loinc_code IS NOT NULL;


-- ============================================================
-- Migration 013 — Epic 1.3A: Transparência dos Resultados
-- Versão: 1.1 (Aprovada para implementação em 03/06/2026)
-- ============================================================

-- ------------------------------------------------------------
-- FASE 1: Adicionar novos campos (nullable, sem constraints)
-- ------------------------------------------------------------

ALTER TABLE biomarkers
  ADD COLUMN IF NOT EXISTS result_type TEXT,
  ADD COLUMN IF NOT EXISTS value_text  TEXT;

-- Remover default implícito de reference_source
-- (o pipeline deve preencher explicitamente a partir de agora)
ALTER TABLE biomarkers
  ALTER COLUMN reference_source DROP DEFAULT;

-- ------------------------------------------------------------
-- FASE 2: Migração heurística dos registros existentes
-- ------------------------------------------------------------

-- result_type: inferido a partir dos campos existentes
UPDATE biomarkers
SET result_type =
  CASE
    WHEN value IS NOT NULL                                    THEN 'numeric'
    WHEN value IS NULL AND raw_text IS NOT NULL AND raw_text <> '' THEN 'qualitative'
    ELSE 'missing'
  END;

-- reference_source: re-derivado dos campos de referência reais
-- (sobrescreve o valor default 'laudo' inserido automaticamente)
UPDATE biomarkers
SET reference_source =
  CASE
    WHEN reference_min IS NOT NULL OR reference_max IS NOT NULL THEN 'laudo'
    ELSE 'ausente'
  END;

-- ------------------------------------------------------------
-- FASE 3: Validação de cobertura pré-NOT NULL
-- Critério de aceite #7 da Epic 1.3A:
-- COUNT(numeric) + COUNT(qualitative) + COUNT(missing) + COUNT(extraction_failed) = COUNT(total)
-- ------------------------------------------------------------

DO $$
DECLARE
  total_count    INTEGER;
  covered_count  INTEGER;
  null_count     INTEGER;
BEGIN
  SELECT COUNT(*)                              INTO total_count   FROM biomarkers;
  SELECT COUNT(*)                              INTO covered_count FROM biomarkers WHERE result_type IN ('numeric','qualitative','missing','extraction_failed');
  SELECT COUNT(*)                              INTO null_count    FROM biomarkers WHERE result_type IS NULL OR reference_source IS NULL;

  IF null_count > 0 THEN
    RAISE EXCEPTION
      'Validação falhou: % registro(s) com result_type ou reference_source NULL após migração heurística.',
      null_count;
  END IF;

  IF covered_count <> total_count THEN
    RAISE EXCEPTION
      'Validação de cobertura falhou: total=%, cobertos=%. Diferença: %.',
      total_count, covered_count, (total_count - covered_count);
  END IF;

  RAISE NOTICE 'Validação OK: % registros migrados, cobertura 100%%.', total_count;
END $$;

-- ------------------------------------------------------------
-- FASE 4: Aplicar NOT NULL e constraints após validação
-- ------------------------------------------------------------

ALTER TABLE biomarkers
  ALTER COLUMN result_type      SET NOT NULL,
  ALTER COLUMN reference_source SET NOT NULL;

ALTER TABLE biomarkers
  ADD CONSTRAINT biomarkers_result_type_check
    CHECK (result_type IN ('numeric', 'qualitative', 'missing', 'extraction_failed')),
  ADD CONSTRAINT biomarkers_reference_source_check
    CHECK (reference_source IN ('laudo', 'ausente', 'documental'));

-- ------------------------------------------------------------
-- FASE 5: Campos de auditoria de reprocessamento
-- no ai_processing_log (substitui snapshot completo)
-- ------------------------------------------------------------

ALTER TABLE ai_processing_log
  ADD COLUMN IF NOT EXISTS reprocessed              BOOLEAN  NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS previous_biomarker_count INTEGER,
  ADD COLUMN IF NOT EXISTS previous_hash            TEXT;

-- ------------------------------------------------------------
-- FASE 6: Índice de suporte para consultas por result_type
-- (preparação para histórico longitudinal — Fase 2)
-- ------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_biomarkers_result_type
  ON biomarkers (result_type);

CREATE INDEX IF NOT EXISTS idx_biomarkers_reference_source
  ON biomarkers (reference_source);

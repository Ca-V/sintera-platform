-- ============================================================
-- SINTERA — Migração 027: snomed_ct_code no biomarker_catalog
-- ============================================================
-- Adiciona o identificador SNOMED CT a cada biomarcador do catálogo.
-- INTEROPERABILIDADE/semântica — NÃO é conteúdo clínico nem interpretação.
-- Ver docs/clinical/GOVERNANCA-CIENTIFICA.md §1.2.
--
-- Motivo de adicionar agora (mesmo sem uso imediato): quando houver integração
-- FHIR / prontuários / hospitais, o mapeamento semântico já estará no modelo,
-- evitando uma migração grande no futuro. Coluna nasce VAZIA (NULL); o
-- preenchimento é curadoria humana validada.
-- ============================================================

ALTER TABLE biomarker_catalog
  ADD COLUMN IF NOT EXISTS snomed_ct_code text;

COMMENT ON COLUMN biomarker_catalog.snomed_ct_code IS
  'SNOMED CT concept id (interoperabilidade semântica). NULL até curadoria humana mapear. Não é interpretação clínica.';

CREATE INDEX IF NOT EXISTS biomarker_catalog_snomed_idx
  ON biomarker_catalog (snomed_ct_code)
  WHERE snomed_ct_code IS NOT NULL;

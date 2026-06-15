-- ============================================================
-- SINTERA — Migração 029: estado 'rejeitado' no workflow do catálogo
-- ============================================================
-- ✅ Estrutura apenas (sem UPDATE/INSERT/backfill/trigger/default clínico).
--
-- Acrescenta o estado 'rejeitado' aos status do catálogo e um campo de motivo,
-- para preservar histórico quando um código LOINC/SNOMED candidato for
-- descartado na curadoria (ex.: "1234-5 corresponde a glicose sérica, não em
-- jejum"). Aumenta a auditabilidade. Ver docs/clinical/GOVERNANCA-CIENTIFICA.md §3.1.
-- ============================================================

ALTER TABLE biomarker_catalog DROP CONSTRAINT IF EXISTS biomarker_catalog_loinc_status_check;
ALTER TABLE biomarker_catalog DROP CONSTRAINT IF EXISTS biomarker_catalog_snomed_status_check;
ALTER TABLE biomarker_catalog DROP CONSTRAINT IF EXISTS biomarker_catalog_approval_status_check;

ALTER TABLE biomarker_catalog
  ADD CONSTRAINT biomarker_catalog_loinc_status_check
    CHECK (loinc_status IN ('draft','em_curadoria','verificado','aprovado','producao','rejeitado')),
  ADD CONSTRAINT biomarker_catalog_snomed_status_check
    CHECK (snomed_status IN ('draft','em_curadoria','verificado','aprovado','producao','rejeitado')),
  ADD CONSTRAINT biomarker_catalog_approval_status_check
    CHECK (approval_status IN ('draft','em_curadoria','verificado','aprovado','producao','rejeitado'));

-- Motivo da rejeição (auditoria). NULL exceto quando algum status = 'rejeitado'.
ALTER TABLE biomarker_catalog ADD COLUMN IF NOT EXISTS rejection_reason text;

COMMENT ON COLUMN biomarker_catalog.rejection_reason IS
  'Motivo da rejeição de um candidato LOINC/SNOMED na curadoria (auditoria). Preencher quando status = rejeitado.';

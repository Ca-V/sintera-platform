-- 101 — Nomenclatura documental (CAP-002 §Content Classifier).
-- Regra de domínio (fundadora, 12/07/2026): o nome do registro representa o DOCUMENTO,
-- nunca um resultado interno. Separa o "título" em:
--   • display_title  — nome de EXIBIÇÃO derivado deterministicamente da estrutura
--   • document_type  — tipo estrutural do documento (classificação factual)
-- Ambos nullable e aditivos (não quebra nada). `type` continua como nome legado/placeholder
-- até a análise preencher display_title; a UI passa a preferir display_title quando presente.

ALTER TABLE exams ADD COLUMN IF NOT EXISTS display_title text;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS document_type text;

COMMENT ON COLUMN exams.display_title IS
  'Nome de exibição do documento, derivado deterministicamente (deriveDisplayTitle). Ex.: "Exames laboratoriais", "TSH", "Ressonância magnética". Nunca um biomarcador isolado.';
COMMENT ON COLUMN exams.document_type IS
  'Tipo estrutural: laboratory_single | laboratory_panel | laboratory_urine | imaging | anatomopathology | medical_report | prescription | vaccination | attestation | unknown.';

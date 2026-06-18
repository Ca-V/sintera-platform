-- ============================================================
-- SINTERA — Migração 035: patient_name no exame (conferência de identidade)
-- ============================================================
-- Guarda o nome do PACIENTE extraído do laudo, para registrar e conferir contra
-- o nome da usuária (profiles.name) — evitando carregar exame de outra pessoa.
-- É dado FACTUAL (nome impresso no laudo), não conteúdo clínico. NULL até a
-- extração preencher.
-- ============================================================

ALTER TABLE exams ADD COLUMN IF NOT EXISTS patient_name text;

COMMENT ON COLUMN exams.patient_name IS
  'Nome do paciente extraído do laudo (para conferência com profiles.name). NULL se não extraído.';

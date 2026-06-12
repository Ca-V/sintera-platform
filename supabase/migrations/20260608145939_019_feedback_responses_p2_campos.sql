
-- Migration 019: novos campos P2 em feedback_responses
-- Adiciona métricas norteadoras (compreensão, confiança, ação)
-- Torna accuracy e most_useful nullable (compatibilidade retroativa)

ALTER TABLE feedback_responses
  ALTER COLUMN accuracy    DROP NOT NULL,
  ALTER COLUMN most_useful DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS comprehension  text,
  ADD COLUMN IF NOT EXISTS trust          text,
  ADD COLUMN IF NOT EXISTS action_taken   text,
  ADD COLUMN IF NOT EXISTS open_feedback  text;

COMMENT ON COLUMN feedback_responses.comprehension IS 'P2 Camada 1: sim / parcialmente / nao';
COMMENT ON COLUMN feedback_responses.trust          IS 'P2 Camada 1: sim_confio / algumas_duvidas / nao_tenho_certeza';
COMMENT ON COLUMN feedback_responses.action_taken   IS 'P2 Camada 1: sim / nao / ainda_nao_decidi';
COMMENT ON COLUMN feedback_responses.open_feedback  IS 'P2 Camada 1: campo aberto opcional';

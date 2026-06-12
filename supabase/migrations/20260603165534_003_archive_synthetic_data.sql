
-- =============================================
-- MIGRATION 003 — Arquivar dados sintéticos
-- =============================================
-- Os 89 biomarcadores, 13 ai_insights e 7 biological_scores
-- foram gerados pelo exam-processor.ts (pipeline sintético).
-- São arquivados com synthetic = true, não deletados,
-- para preservar auditabilidade.
-- =============================================

-- Tabela de log de operações de purge
CREATE TABLE IF NOT EXISTS public.audit_purge_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_count integer,
  action text NOT NULL,
  reason text,
  executed_at timestamptz DEFAULT now()
);

-- Adicionar coluna synthetic nas tabelas afetadas
ALTER TABLE public.biomarkers
  ADD COLUMN IF NOT EXISTS synthetic boolean NOT NULL DEFAULT false;

ALTER TABLE public.ai_insights
  ADD COLUMN IF NOT EXISTS synthetic boolean NOT NULL DEFAULT false;

ALTER TABLE public.biological_scores
  ADD COLUMN IF NOT EXISTS synthetic boolean NOT NULL DEFAULT false;

-- Marcar todos os dados existentes como sintéticos e registrar
DO $$
DECLARE
  v_bio integer;
  v_insights integer;
  v_scores integer;
  v_exams integer;
BEGIN
  UPDATE public.biomarkers SET synthetic = true WHERE synthetic = false;
  GET DIAGNOSTICS v_bio = ROW_COUNT;

  UPDATE public.ai_insights SET synthetic = true WHERE synthetic = false;
  GET DIAGNOSTICS v_insights = ROW_COUNT;

  UPDATE public.biological_scores SET synthetic = true WHERE synthetic = false;
  GET DIAGNOSTICS v_scores = ROW_COUNT;

  -- Resetar exames que foram "processados" pelo pipeline sintético
  UPDATE public.exams SET status = 'pending' WHERE status = 'processed';
  GET DIAGNOSTICS v_exams = ROW_COUNT;

  INSERT INTO public.audit_purge_log (table_name, record_count, action, reason) VALUES
    ('biomarkers',         v_bio,     'marked_synthetic', 'phase0_beta_synthetic_data_elimination'),
    ('ai_insights',        v_insights,'marked_synthetic', 'phase0_beta_synthetic_data_elimination'),
    ('biological_scores',  v_scores,  'marked_synthetic', 'phase0_beta_synthetic_data_elimination'),
    ('exams',              v_exams,   'status_reset_to_pending', 'phase0_beta_synthetic_data_elimination');
END $$;

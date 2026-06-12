
-- =============================================
-- MIGRATION 005 — Índices faltantes
-- =============================================
-- exams.user_id: FK sem índice (identificado na auditoria)
-- exams(status, created_at): usado na rota process-pending
-- biomarkers.exam_id: acesso frequente por exame
-- =============================================

CREATE INDEX IF NOT EXISTS exams_user_id_idx
  ON public.exams(user_id);

CREATE INDEX IF NOT EXISTS exams_status_created_at_idx
  ON public.exams(status, created_at);

CREATE INDEX IF NOT EXISTS biomarkers_exam_id_idx
  ON public.biomarkers(exam_id);

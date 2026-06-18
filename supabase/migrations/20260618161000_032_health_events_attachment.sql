-- ============================================================
-- SINTERA — Migração 032: anexo opcional em health_events
-- ============================================================
-- Permite anexar um arquivo (ex.: comprovante de vacina, encaminhamento) a um
-- evento da jornada. O arquivo é guardado no bucket de storage da usuária (mesma
-- pasta `${user_id}/...` dos exames, para a exclusão de conta cobrir — LGPD).
-- Guardamos apenas a URL assinada. Sem conteúdo clínico.
-- ============================================================

ALTER TABLE health_events ADD COLUMN IF NOT EXISTS attachment_url text;

COMMENT ON COLUMN health_events.attachment_url IS
  'URL assinada do arquivo anexado ao evento (storage bucket exams, pasta da usuária). NULL se sem anexo.';

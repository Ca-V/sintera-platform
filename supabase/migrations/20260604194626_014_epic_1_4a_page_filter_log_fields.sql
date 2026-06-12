
-- Migration 014 — Epic 1.4A: campos de auditoria do filtro de páginas
ALTER TABLE ai_processing_log
  ADD COLUMN IF NOT EXISTS pages_total     INTEGER,
  ADD COLUMN IF NOT EXISTS pages_relevant  INTEGER,
  ADD COLUMN IF NOT EXISTS pages_filtered  INTEGER,
  ADD COLUMN IF NOT EXISTS filter_applied  BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS filter_fallback BOOLEAN NOT NULL DEFAULT FALSE;


-- Epic F1-M2: PDF Quality Assessment + Dual Pipeline
ALTER TABLE public.exams
  ADD COLUMN IF NOT EXISTS pdf_quality text,
  ADD COLUMN IF NOT EXISTS page_count  integer;

ALTER TABLE public.ai_processing_log
  ADD COLUMN IF NOT EXISTS extraction_path      text,
  ADD COLUMN IF NOT EXISTS pdf_quality_detected text;

-- Também corrigir: ai_processing_log.status deve aceitar 'processing'
-- (já corrigido na migration 008 — confirmação apenas)

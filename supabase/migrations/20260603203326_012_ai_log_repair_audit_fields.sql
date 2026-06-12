
ALTER TABLE public.ai_processing_log
  ADD COLUMN IF NOT EXISTS parse_repaired       boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS parse_error_original text,
  ADD COLUMN IF NOT EXISTS repair_method        text,
  ADD COLUMN IF NOT EXISTS raw_response_hash    text,
  ADD COLUMN IF NOT EXISTS repaired_response_hash text;

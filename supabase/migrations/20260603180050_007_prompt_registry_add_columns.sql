
ALTER TABLE public.prompt_registry
  ADD COLUMN IF NOT EXISTS user_prompt_template text,
  ADD COLUMN IF NOT EXISTS content_hash text;

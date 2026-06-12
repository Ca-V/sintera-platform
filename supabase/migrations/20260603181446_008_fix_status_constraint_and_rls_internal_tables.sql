
-- 1. Adicionar 'processing' ao check constraint de ai_processing_log.status
ALTER TABLE public.ai_processing_log
  DROP CONSTRAINT IF EXISTS ai_processing_log_status_check;

ALTER TABLE public.ai_processing_log
  ADD CONSTRAINT ai_processing_log_status_check
  CHECK (status = ANY (ARRAY['processing'::text, 'success'::text, 'error'::text, 'timeout'::text]));

-- Corrigir o default que estava como 'success' — deve ser 'processing' (estado inicial)
ALTER TABLE public.ai_processing_log
  ALTER COLUMN status SET DEFAULT 'processing';

-- 2. Política UPDATE para ai_processing_log (gateway precisa atualizar o log)
CREATE POLICY "ai_log_update"
  ON public.ai_processing_log
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- 3. RLS nas tabelas internas

-- audit_purge_log: nenhum acesso via client (service role only)
ALTER TABLE public.audit_purge_log ENABLE ROW LEVEL SECURITY;

-- prompt_registry: autenticados podem SELECT (gateway lê prompts via server client)
ALTER TABLE public.prompt_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prompt_registry_select_authenticated"
  ON public.prompt_registry
  FOR SELECT
  TO authenticated
  USING (true);

-- ai_provider_config: autenticados podem SELECT
ALTER TABLE public.ai_provider_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_provider_config_select_authenticated"
  ON public.ai_provider_config
  FOR SELECT
  TO authenticated
  USING (true);

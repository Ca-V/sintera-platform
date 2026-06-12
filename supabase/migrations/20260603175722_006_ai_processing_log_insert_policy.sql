
-- Migration 006: permite que usuários autenticados insiram seus próprios
-- registros em ai_processing_log (gateway roda server-side com sessão do usuário)
CREATE POLICY "ai_log_insert" ON public.ai_processing_log
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

-- Constraint: apenas 1 prompt 'active' por operação (garante unicidade do prompt em uso)
CREATE UNIQUE INDEX IF NOT EXISTS prompt_registry_one_active_per_operation
  ON public.prompt_registry (operation)
  WHERE status = 'active';

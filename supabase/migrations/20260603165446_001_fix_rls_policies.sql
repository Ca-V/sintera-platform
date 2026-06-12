
-- =============================================
-- MIGRATION 001 — Correção completa de RLS
-- =============================================
-- Problema 1: Políticas UPDATE sem WITH CHECK
-- Problema 2: Duplicatas em exams (6 políticas → 3)
-- Problema 3: auth.uid() sem (select ...) em todas as políticas
-- =============================================

-- ── PROFILES ────────────────────────────────
DROP POLICY IF EXISTS "Usuários criam seu próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuários veem apenas seu próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuários atualizam seu próprio perfil" ON public.profiles;

CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING ((select auth.uid()) = id);

CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- ── EXAMS (consolidar 6 → 3) ────────────────
DROP POLICY IF EXISTS "Usuários criam seus exames" ON public.exams;
DROP POLICY IF EXISTS "exams_insert" ON public.exams;
DROP POLICY IF EXISTS "Usuários veem seus exames" ON public.exams;
DROP POLICY IF EXISTS "exams_select" ON public.exams;
DROP POLICY IF EXISTS "Usuários atualizam seus exames" ON public.exams;
DROP POLICY IF EXISTS "exams_update" ON public.exams;

CREATE POLICY "exams_insert" ON public.exams
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "exams_select" ON public.exams
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "exams_update" ON public.exams
  FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ── BIOMARKERS ───────────────────────────────
DROP POLICY IF EXISTS "Usuários criam seus biomarcadores" ON public.biomarkers;
DROP POLICY IF EXISTS "Usuários veem seus biomarcadores" ON public.biomarkers;

CREATE POLICY "biomarkers_insert" ON public.biomarkers
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "biomarkers_select" ON public.biomarkers
  FOR SELECT USING ((select auth.uid()) = user_id);

-- ── AI_INSIGHTS ──────────────────────────────
DROP POLICY IF EXISTS "Usuários criam seus insights" ON public.ai_insights;
DROP POLICY IF EXISTS "Usuários veem seus insights" ON public.ai_insights;
DROP POLICY IF EXISTS "Usuários atualizam seus insights" ON public.ai_insights;

CREATE POLICY "ai_insights_insert" ON public.ai_insights
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "ai_insights_select" ON public.ai_insights
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "ai_insights_update" ON public.ai_insights
  FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ── BIOLOGICAL_SCORES ────────────────────────
DROP POLICY IF EXISTS "Usuários criam seus scores" ON public.biological_scores;
DROP POLICY IF EXISTS "Usuários veem seus scores" ON public.biological_scores;

CREATE POLICY "biological_scores_insert" ON public.biological_scores
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "biological_scores_select" ON public.biological_scores
  FOR SELECT USING ((select auth.uid()) = user_id);

-- ── DAILY_LOGS ───────────────────────────────
DROP POLICY IF EXISTS "Users can insert own logs" ON public.daily_logs;
DROP POLICY IF EXISTS "Users can view own logs" ON public.daily_logs;
DROP POLICY IF EXISTS "Users can update own logs" ON public.daily_logs;
DROP POLICY IF EXISTS "Users can delete own logs" ON public.daily_logs;

CREATE POLICY "daily_logs_insert" ON public.daily_logs
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "daily_logs_select" ON public.daily_logs
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "daily_logs_update" ON public.daily_logs
  FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "daily_logs_delete" ON public.daily_logs
  FOR DELETE USING ((select auth.uid()) = user_id);

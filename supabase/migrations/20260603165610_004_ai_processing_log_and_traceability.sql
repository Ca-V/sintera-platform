
-- =============================================
-- MIGRATION 004 — Rastreabilidade de IA
-- =============================================
-- Cria ai_processing_log (obrigatório para toda chamada de IA)
-- Adiciona colunas de rastreabilidade nas tabelas afetadas
-- Cria prompt_registry e ai_provider_config
-- =============================================

-- ── AI_PROCESSING_LOG ────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_processing_log (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id             uuid REFERENCES public.exams(id) ON DELETE CASCADE,
  user_id             uuid REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Entrada
  provider            text NOT NULL DEFAULT 'anthropic',
  model               text NOT NULL,
  prompt_tokens       integer,
  completion_tokens   integer,
  input_chars         integer,
  full_text_chars     integer,
  truncated           boolean DEFAULT false,

  -- Saída
  raw_response        text,
  parsed_ok           boolean,
  parse_error         text,
  biomarkers_extracted integer,
  suspicious_output   boolean DEFAULT false,

  -- Timing
  started_at          timestamptz DEFAULT now(),
  completed_at        timestamptz,
  duration_ms         integer,

  -- Status
  status              text DEFAULT 'success'
    CHECK (status IN ('success', 'error', 'timeout'))
);

ALTER TABLE public.ai_processing_log ENABLE ROW LEVEL SECURITY;

-- Usuárias só leem seus próprios logs; sistema insere via service_role
CREATE POLICY "ai_log_select" ON public.ai_processing_log
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS ai_processing_log_exam_id_idx
  ON public.ai_processing_log(exam_id);

CREATE INDEX IF NOT EXISTS ai_processing_log_user_id_idx
  ON public.ai_processing_log(user_id);

CREATE INDEX IF NOT EXISTS ai_processing_log_status_idx
  ON public.ai_processing_log(status);

-- ── COLUNAS DE RASTREABILIDADE — BIOMARKERS ──
ALTER TABLE public.biomarkers
  ADD COLUMN IF NOT EXISTS source          text DEFAULT 'ai_extracted'
    CHECK (source IN ('ai_extracted', 'manual', 'wearable', 'lab_api')),
  ADD COLUMN IF NOT EXISTS confidence      numeric(4,3),
  ADD COLUMN IF NOT EXISTS raw_text        text,
  ADD COLUMN IF NOT EXISTS range_extracted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS reference_source text DEFAULT 'laudo',
  ADD COLUMN IF NOT EXISTS ai_log_id       uuid
    REFERENCES public.ai_processing_log(id) ON DELETE SET NULL;

-- ── COLUNAS DE RASTREABILIDADE — AI_INSIGHTS ─
ALTER TABLE public.ai_insights
  ADD COLUMN IF NOT EXISTS source         text DEFAULT 'ai_generated'
    CHECK (source IN ('ai_generated', 'rule_based', 'clinician')),
  ADD COLUMN IF NOT EXISTS ai_log_id      uuid
    REFERENCES public.ai_processing_log(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS model_version  text;

-- ── COLUNAS DE QUALIDADE — BIOLOGICAL_SCORES ─
ALTER TABLE public.biological_scores
  ADD COLUMN IF NOT EXISTS data_quality   text DEFAULT 'real'
    CHECK (data_quality IN ('real', 'partial', 'estimated')),
  ADD COLUMN IF NOT EXISTS biomarkers_used integer,
  ADD COLUMN IF NOT EXISTS coverage_pct   numeric(5,2);

-- ── PROMPT_REGISTRY ──────────────────────────
CREATE TABLE IF NOT EXISTS public.prompt_registry (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation     text NOT NULL
    CHECK (operation IN ('extraction', 'narrative', 'qa')),
  version       text NOT NULL,
  content_hash  text NOT NULL,
  system_prompt text NOT NULL,
  temperature   numeric(3,2) DEFAULT 0.0,
  max_tokens    integer DEFAULT 4096,
  created_by    text,
  approved_by   text,
  approved_at   timestamptz,
  deployed_at   timestamptz,
  deprecated_at timestamptz,
  status        text DEFAULT 'draft'
    CHECK (status IN ('draft', 'approved', 'active', 'deprecated')),
  UNIQUE (operation, version)
);

-- ── AI_PROVIDER_CONFIG ───────────────────────
CREATE TABLE IF NOT EXISTS public.ai_provider_config (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider   text NOT NULL,
  model      text NOT NULL,
  operation  text NOT NULL
    CHECK (operation IN ('extraction', 'narrative', 'qa')),
  is_active  boolean DEFAULT false,
  max_tokens integer,
  temperature numeric(3,2),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (operation, provider, model)
);

-- Inserir configuração inicial do provider (Anthropic, Haiku, extração)
INSERT INTO public.ai_provider_config
  (provider, model, operation, is_active, max_tokens, temperature)
VALUES
  ('anthropic', 'claude-haiku-4-5-20251001', 'extraction', true, 4096, 0.0)
ON CONFLICT (operation, provider, model) DO NOTHING;

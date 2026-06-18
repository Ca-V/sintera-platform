-- ============================================================
-- SINTERA — Migração 031: health_events (eventos da jornada)
-- ============================================================
-- Eventos factuais da jornada de saúde da usuária (consultas, vacinas,
-- procedimentos e outros), que alimentam a Health Timeline. NÃO contém juízo
-- clínico — é organização factual de eventos, com PROVENIÊNCIA e CONFIANÇA por
-- evento (autorrelato marcado como tal), alinhado ao princípio "compliance com
-- proveniência" (ver VALUE-PROPOSITION-NORTH-STAR §5 e MASTER-STRATEGY).
--
-- Exames já vivem na tabela `exams`; a Timeline mescla as duas fontes.
-- ============================================================

CREATE TABLE IF NOT EXISTS health_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type  text NOT NULL CHECK (event_type IN ('consulta','vacina','procedimento','exame','outro')),
  title       text NOT NULL,
  event_date  date NOT NULL,
  notes       text,
  -- Proveniência: de onde veio o dado, e quão confiável é.
  source      text NOT NULL DEFAULT 'autorrelato'
              CHECK (source IN ('autorrelato','upload','integracao')),
  confidence  text NOT NULL DEFAULT 'baixa'
              CHECK (confidence IN ('alta','media','baixa')),
  synthetic   boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON COLUMN health_events.source     IS 'Proveniência do evento: autorrelato | upload | integracao.';
COMMENT ON COLUMN health_events.confidence IS 'Confiança no dado: alta (integração/laudo) | media | baixa (autorrelato).';

ALTER TABLE health_events ENABLE ROW LEVEL SECURITY;

-- Cada usuária só acessa/gerencia os próprios eventos.
CREATE POLICY health_events_own ON health_events
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS health_events_user_date_idx
  ON health_events (user_id, event_date DESC);

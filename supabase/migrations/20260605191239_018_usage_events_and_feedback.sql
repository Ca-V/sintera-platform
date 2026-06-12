
-- 6C: Instrumentação de produto
CREATE TABLE usage_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_name  TEXT NOT NULL,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_usage_events_user_id    ON usage_events(user_id);
CREATE INDEX idx_usage_events_event_name ON usage_events(event_name);
CREATE INDEX idx_usage_events_created_at ON usage_events(created_at);

ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usage_events_insert_own"
  ON usage_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "usage_events_select_own"
  ON usage_events FOR SELECT
  USING (auth.uid() = user_id);

-- 6D: Feedback estruturado
CREATE TABLE feedback_responses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  accuracy        TEXT NOT NULL CHECK (accuracy IN ('sim', 'parcialmente', 'nao')),
  most_useful     TEXT NOT NULL CHECK (most_useful IN ('historico', 'organizacao', 'indice', 'outro')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)  -- uma resposta por usuária
);

ALTER TABLE feedback_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feedback_insert_own"
  ON feedback_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "feedback_select_own"
  ON feedback_responses FOR SELECT
  USING (auth.uid() = user_id);

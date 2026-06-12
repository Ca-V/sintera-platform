
-- Lista de espera para o Beta
CREATE TABLE IF NOT EXISTS waitlist (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  email      text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  invited_at timestamptz
);

-- Apenas a service role pode ler; insert é público (via API route)
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role full access" ON waitlist
  USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS waitlist_created_at_idx ON waitlist (created_at DESC);

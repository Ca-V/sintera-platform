
-- Epic Sprint Imediata — Fase 4B: Consentimento auditável
-- Spec v1.2 aprovada em 04/06/2026

CREATE TABLE consent_records (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  consent_type   TEXT NOT NULL CHECK (consent_type IN ('terms', 'health_data')),
  version        TEXT NOT NULL,
  document_hash  CHAR(64) NOT NULL,
  accepted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address     TEXT,
  user_agent     TEXT,

  UNIQUE (user_id, consent_type, version)
);

-- RLS: usuária vê apenas os próprios registros
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "consent_records_select_own"
  ON consent_records FOR SELECT
  USING (auth.uid() = user_id);

-- Inserção via service_role apenas (backend controla)
-- Nenhuma policy de INSERT para authenticated — o endpoint usa service_role key

-- Tabela de auditoria de exclusão de contas
CREATE TABLE account_deletion_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL,
  deleted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reason      TEXT NOT NULL DEFAULT 'user_requested',
  initiated_by TEXT NOT NULL DEFAULT 'user'
);

-- Sem RLS na tabela de auditoria — acesso apenas via service_role

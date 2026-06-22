-- 043 — report_shares (link de compartilhamento do relatório)
--
-- Link somente-leitura, com validade e revogável, para a usuária compartilhar
-- o relatório de saúde com um profissional, SEM dar login. O token é aleatório
-- e a leitura pública é feita server-side (service role) apenas para tokens
-- válidos (não revogados e não expirados). LGPD: consentimento explícito da
-- usuária ao gerar; ela pode revogar a qualquer momento.

CREATE TABLE IF NOT EXISTS public.report_shares (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token       text NOT NULL UNIQUE,
  expires_at  timestamptz NOT NULL,
  revoked     boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.report_shares ENABLE ROW LEVEL SECURITY;

-- A usuária gerencia os próprios links. A leitura pública (por token) NÃO usa
-- esta policy — é feita server-side com service role, validando token/validade.
CREATE POLICY report_shares_own ON public.report_shares
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS report_shares_token_idx ON public.report_shares (token);

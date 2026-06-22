-- 051 — health_conditions (condições próprias + histórico familiar)
--
-- Registro factual e autorrelatado de condições de saúde da usuária
-- (scope='propria') e de antecedentes familiares (scope='familiar', com o
-- parente). A SINTERA NUNCA identifica nem infere condições — apenas registra
-- o que a usuária informa.

CREATE TABLE IF NOT EXISTS public.health_conditions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scope        text NOT NULL DEFAULT 'propria' CHECK (scope IN ('propria','familiar')),
  name         text NOT NULL,          -- nome da condição
  relative     text,                   -- parente/grau (quando scope='familiar')
  since_label  text,                   -- "desde quando" (livre: ano, idade, etc.)
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.health_conditions ENABLE ROW LEVEL SECURITY;

CREATE POLICY health_conditions_own ON public.health_conditions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS health_conditions_user_scope_idx
  ON public.health_conditions (user_id, scope);

-- 041 — medications (medicamentos em uso)
--
-- Lista de medicamentos da usuária, modelada como ESTADO contínuo (em uso /
-- suspenso) — diferente dos eventos pontuais da jornada. Autorrelato factual,
-- sem juízo clínico: a plataforma organiza; quem prescreve é o médico.

CREATE TABLE IF NOT EXISTS public.medications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  dose        text,
  frequency   text,
  started_on  date,
  status      text NOT NULL DEFAULT 'em_uso' CHECK (status IN ('em_uso','suspenso')),
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY medications_own ON public.medications
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS medications_user_status_idx
  ON public.medications (user_id, status);

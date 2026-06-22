-- 061 — Ciclo menstrual e contracepção (dispositivos com vida útil/troca)
--
-- contraceptive_methods: método/dispositivo (DIU, Mirena, implante, anel,
-- adesivo, injeção, pílula…) com início, vida útil (duration_months), data de
-- troca (replace_on) e lembrete opcional (agenda_events, event_type medicacao).
-- menstrual_periods: datas de início da menstruação (ciclo derivado por cálculo).
-- Registro factual autorrelatado — a SINTERA não prescreve nem interpreta.

CREATE TABLE IF NOT EXISTS public.contraceptive_methods (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind             text NOT NULL,
  brand            text,
  started_on       date,
  duration_months  integer,
  replace_on       date,
  status           text NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo','encerrado')),
  reminder_enabled boolean NOT NULL DEFAULT false,
  reminder_event_id uuid,
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.contraceptive_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY contraceptive_methods_own ON public.contraceptive_methods
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS contraceptive_methods_user_idx ON public.contraceptive_methods (user_id, status);

CREATE TABLE IF NOT EXISTS public.menstrual_periods (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_on  date NOT NULL,
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, started_on)
);
ALTER TABLE public.menstrual_periods ENABLE ROW LEVEL SECURITY;
CREATE POLICY menstrual_periods_own ON public.menstrual_periods
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS menstrual_periods_user_idx ON public.menstrual_periods (user_id, started_on DESC);

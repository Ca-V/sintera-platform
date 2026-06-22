-- 046 — body_metrics (medidas corporais ao longo do tempo)
--
-- Registro factual e autorrelatado de medidas: peso, pressão arterial,
-- circunferência, etc. Série temporal para a própria pessoa acompanhar e
-- levar ao profissional. SEM juízo clínico — só organização.

CREATE TABLE IF NOT EXISTS public.body_metrics (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metric       text NOT NULL CHECK (metric IN ('peso','pressao_arterial','circunferencia_cintura','outro')),
  label        text,          -- usado quando metric = 'outro'
  value_text   text NOT NULL, -- ex.: '72,5' | '120/80'
  unit         text,          -- ex.: 'kg' | 'mmHg' | 'cm'
  measured_on  date NOT NULL,
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.body_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY body_metrics_own ON public.body_metrics
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS body_metrics_user_idx ON public.body_metrics (user_id, measured_on DESC);

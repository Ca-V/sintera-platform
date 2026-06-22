-- 052 — life_habits (hábitos de vida autorrelatados)
--
-- Registro factual e autorrelatado de fatores do dia a dia: atividade física,
-- sono, tabagismo, álcool, alimentação, hidratação e outros. A SINTERA NUNCA
-- avalia, pontua nem recomenda — apenas organiza o que a usuária informa.

CREATE TABLE IF NOT EXISTS public.life_habits (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category     text NOT NULL,          -- atividade_fisica | sono | tabagismo | alcool | alimentacao | hidratacao | outro
  description  text NOT NULL,          -- o que a usuária faz/relata
  frequency    text,                   -- frequência livre (ex.: "3x por semana", "diário")
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.life_habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY life_habits_own ON public.life_habits
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS life_habits_user_category_idx
  ON public.life_habits (user_id, category);

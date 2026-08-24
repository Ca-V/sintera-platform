ALTER TABLE public.life_habits
  ADD COLUMN IF NOT EXISTS goal_amount    numeric,
  ADD COLUMN IF NOT EXISTS goal_unit      text,
  ADD COLUMN IF NOT EXISTS goal_divisions integer,
  ADD COLUMN IF NOT EXISTS plan_url       text,
  ADD COLUMN IF NOT EXISTS plan_name      text;
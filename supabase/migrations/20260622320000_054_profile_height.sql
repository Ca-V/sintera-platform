-- 054 — altura da usuária no perfil
--
-- Altura é um dado relativamente estático; fica no perfil (e não em body_metrics)
-- para não precisar reinformar e para apoiar leituras de bioimpedância (ex.: IMC).
-- Em centímetros, numérico (aceita decimais).

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS height_cm numeric;

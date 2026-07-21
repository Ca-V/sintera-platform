-- 134 — life_habits: meta divisível + anexo de plano/dieta (ADITIVO, base única beta=produção)
--
-- Metas divisíveis (ex.: hidratação 2000 ml/dia em 8 partes de 250 ml). A SINTERA NÃO avalia nem
-- recomenda: apenas guarda a meta que a usuária definiu. Anexo = plano/dieta (arquivo no bucket privado).
ALTER TABLE public.life_habits
  ADD COLUMN IF NOT EXISTS goal_amount    numeric,   -- valor total da meta (ex.: 2000)
  ADD COLUMN IF NOT EXISTS goal_unit      text,      -- unidade (ex.: ml, L, min, passos)
  ADD COLUMN IF NOT EXISTS goal_divisions integer,   -- em quantas partes a meta se divide (ex.: 8)
  ADD COLUMN IF NOT EXISTS plan_url       text,      -- anexo de plano/dieta (URL assinada do bucket)
  ADD COLUMN IF NOT EXISTS plan_name      text;      -- nome do arquivo anexado

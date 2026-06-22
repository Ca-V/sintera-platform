-- 048 — body_metrics: novos tipos (altura + composição corporal / bioimpedância)
--
-- Amplia as medidas: altura, e resultados de bioimpedância (% de gordura,
-- massa muscular). 'outro' continua cobrindo qualquer outra (água corporal,
-- taxa metabólica basal, etc.). Registro factual — sem juízo clínico.

ALTER TABLE public.body_metrics DROP CONSTRAINT IF EXISTS body_metrics_metric_check;

ALTER TABLE public.body_metrics ADD CONSTRAINT body_metrics_metric_check
  CHECK (metric IN (
    'peso','altura','pressao_arterial','circunferencia_cintura',
    'gordura_corporal','massa_muscular','outro'
  ));

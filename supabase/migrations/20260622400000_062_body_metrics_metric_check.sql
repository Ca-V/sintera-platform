-- 062 — corrige body_metrics_metric_check para incluir as métricas novas.
-- A restrição original só permitia 7 métricas; as adicionadas depois
-- (bioimpedância e sinais vitais) violavam o CHECK ao salvar. Atualiza para o
-- conjunto completo usado pela plataforma.

ALTER TABLE public.body_metrics DROP CONSTRAINT IF EXISTS body_metrics_metric_check;
ALTER TABLE public.body_metrics ADD CONSTRAINT body_metrics_metric_check CHECK (metric IN (
  'peso','altura','circunferencia_cintura',
  'imc','gordura_corporal','massa_muscular','agua_corporal','gordura_visceral','massa_ossea','taxa_metabolica',
  'pressao_arterial','frequencia_cardiaca','glicemia','saturacao','temperatura','outro_sinal',
  'outro'
));

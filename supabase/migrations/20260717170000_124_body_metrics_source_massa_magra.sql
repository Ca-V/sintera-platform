-- FB-003: a Composição Corporal (BOD-001) é VISUALIZAÇÃO; os pontos vêm de uma ORIGEM rastreável.
-- (a) coluna `source` = de onde o indicador nasceu (bioimpedancia|dexa|manual|balanca|wearable|outro).
--     A rastreabilidade ao FATO já existe via body_metrics.exam_id; `source` rotula a modalidade de origem.
-- (b) amplia a constraint de `metric` para incluir 'massa_magra' (distinta de massa_muscular).
-- Aditivo/reversível; sem destruição. Default 'manual' preserva as linhas já existentes (entrada manual).
alter table public.body_metrics add column if not exists source text not null default 'manual';
comment on column public.body_metrics.source is 'FB-003/BOD-001: origem do indicador (bioimpedancia|dexa|manual|balanca|wearable|outro). Rastreável ao fato via exam_id.';

alter table public.body_metrics drop constraint if exists body_metrics_metric_check;
alter table public.body_metrics add constraint body_metrics_metric_check check (metric = any (array[
  'peso','altura','circunferencia_cintura','imc','gordura_corporal','massa_muscular','massa_magra',
  'agua_corporal','gordura_visceral','massa_ossea','taxa_metabolica','pressao_arterial','frequencia_cardiaca',
  'glicemia','saturacao','temperatura','outro_sinal','outro'
]));

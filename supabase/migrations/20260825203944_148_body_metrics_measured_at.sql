-- 148 — HIP-014 §8.1: hora da medição em body_metrics.
--
-- DDL ADITIVO e idempotente. Não remove nem renomeia nada; `measured_on` permanece e continua sendo escrito.
--
-- POR QUE: `measured_on` é `date`. Um diário de pressão arterial de manhã e à noite gera duas linhas na MESMA
-- data, indistinguíveis entre si e sem ordem possível. Isso quebra exatamente o caso de uso aprovado pela
-- fundadora em 25/08 (HIP-014 §2) — o diário que o médico pede em hipertensão, a condição crônica mais
-- prevalente do país. Não é contornável na interface: a informação não existe no banco.
--
-- POR QUE NULÁVEL, e não NOT NULL: as linhas existentes têm data mas não hora — o instante real é
-- desconhecido, e inventá-lo seria fabricar dado. O backfill abaixo usa meia-noite UTC como marcador do que se
-- sabe (o dia), NÃO como afirmação de que a medição ocorreu à meia-noite. Quem lê deve tratar
-- `measured_at = 00:00:00Z` de linha anterior a esta migração como "hora não registrada".
--
-- SEQUÊNCIA para apertar depois: (1) esta migração; (2) o código passa a gravar `measured_at` em toda escrita;
-- (3) só então `set not null`. Inverter a ordem quebraria as escritas em produção.

alter table public.body_metrics
  add column if not exists measured_at timestamptz;

-- Backfill determinístico (DATE-001: UTC, sem dependência de fuso do servidor).
update public.body_metrics
   set measured_at = (measured_on::timestamp at time zone 'UTC')
 where measured_at is null;

comment on column public.body_metrics.measured_at is
  'Instante da medição (UTC). Nulo = não informado. 00:00:00Z em linha anterior à migração 148 significa '
  '"hora não registrada", não "medido à meia-noite". A série longitudinal ordena por esta coluna quando '
  'presente, com fallback para measured_on.';

-- A série por métrica é sempre lida em ordem cronológica; o índice acompanha a leitura real.
create index if not exists idx_body_metrics_user_metric_at
  on public.body_metrics (user_id, metric, measured_at desc);

-- 149 — HIP-014 §3: sessões de atividade física.
--
-- DDL ADITIVO e idempotente. Tabela nova; não toca body_metrics, wearable_readings nem life_habits.
--
-- POR QUE TABELA PRÓPRIA, e não `wearable_readings`: aquela guarda UM NÚMERO (`value numeric`). Uma corrida tem
-- início, fim, tipo, distância, desnível e ritmo — não é escalar. Caber ali exigiria empurrar o essencial para
-- dentro de `raw` jsonb, e o que mora em jsonb não é consultável, não é comparável e não sustenta série
-- longitudinal. Apple e Google chegaram à mesma conclusão independentemente: `HKWorkout` e
-- `ExerciseSessionRecord` são tipos DISTINTOS de medida pontual em ambas as plataformas.
--
-- É o caso previsto pela ressalva da fundadora ao princípio de acomodar-antes-de-criar (25/08): algo estrutural
-- precisa ser criado para servir de base ao que deriva. Ver HIP-014 §3.
--
-- POR QUE NÃO É `life_habits`: aquela guarda a INTENÇÃO declarada ("correr 3x por semana"); esta guarda o FATO
-- observado. Ligar as duas é o valor ("você declarou 3x; neste mês foram 2") — mas são fatos de naturezas
-- diferentes, com donos diferentes (ADR-001).
--
-- PROVENIÊNCIA É PRIMEIRA CLASSE: `source` é NOT NULL, como em body_metrics e wearable_readings. A plataforma
-- nunca funde séries de fontes diferentes e nunca escolhe entre elas em silêncio (ADR-000 / RDC 657 / §4).
--
-- RLS por `auth.uid() = user_id`, igual ao resto da plataforma. Quando o IDENT-001 for aplicado, esta tabela
-- entra na mesma reescrita mecânica das demais (`can_access_subject(user_id)`).

create table if not exists public.activity_sessions (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null,

  -- proveniência (HIP-001) — de onde veio e por qual versão do conector
  source             text not null,
  external_id        text,
  connector_version  text,

  -- TIPO da atividade. `outro` é a válvula do Modelo Aberto: o desconhecido degrada, não quebra.
  -- Lista ABERTA de propósito — o catálogo de tipos do Health Connect é grande e muda; um CHECK fechado
  -- transformaria uma modalidade nova numa falha de ingestão em vez de num registro rotulado como "outro".
  activity_type      text not null default 'outro',
  title              text,

  -- janela (DATE-001: instantes em UTC)
  started_at         timestamptz not null,
  ended_at           timestamptz,
  duration_s         integer check (duration_s is null or duration_s >= 0),

  -- grandezas da sessão. Todas NULÁVEIS: cada fonte entrega um subconjunto diferente, e ausência de
  -- métrica é informação legítima — não se preenche com zero o que a fonte não mediu.
  distance_m         numeric check (distance_m is null or distance_m >= 0),
  elevation_gain_m   numeric,
  active_energy_kcal numeric check (active_energy_kcal is null or active_energy_kcal >= 0),
  avg_heart_rate     numeric check (avg_heart_rate is null or avg_heart_rate > 0),
  max_heart_rate     numeric check (max_heart_rate is null or max_heart_rate > 0),
  steps              integer check (steps is null or steps >= 0),

  notes              text,
  -- payload original da fonte, preservado para auditoria e reprocessamento (HIP-009: bruto imutável).
  raw                jsonb,

  created_at         timestamptz not null default now(),

  constraint activity_sessions_janela_coerente
    check (ended_at is null or ended_at >= started_at)
);

-- Idempotência do re-sync: mesma sessão da mesma fonte não duplica. Duas chaves porque nem toda fonte
-- fornece id externo — quando fornece, ele manda; quando não, o instante de início dentro da fonte serve.
create unique index if not exists uq_activity_sessions_external
  on public.activity_sessions (user_id, source, external_id)
  where external_id is not null;

create unique index if not exists uq_activity_sessions_inicio
  on public.activity_sessions (user_id, source, started_at)
  where external_id is null;

-- Leitura real: linha do tempo da pessoa, e recorte por tipo de atividade.
create index if not exists idx_activity_sessions_user_inicio
  on public.activity_sessions (user_id, started_at desc);
create index if not exists idx_activity_sessions_user_tipo
  on public.activity_sessions (user_id, activity_type, started_at desc);

comment on table public.activity_sessions is
  'Sessão de atividade física observada (HIP-014 §3). FATO — distinta de life_habits, que guarda a INTENÇÃO '
  'declarada. Proveniência obrigatória; fontes diferentes coexistem e nunca são fundidas.';

alter table public.activity_sessions enable row level security;

drop policy if exists activity_sessions_select_own on public.activity_sessions;
create policy activity_sessions_select_own on public.activity_sessions
  for select using (auth.uid() = user_id);

drop policy if exists activity_sessions_insert_own on public.activity_sessions;
create policy activity_sessions_insert_own on public.activity_sessions
  for insert with check (auth.uid() = user_id);

drop policy if exists activity_sessions_update_own on public.activity_sessions;
create policy activity_sessions_update_own on public.activity_sessions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists activity_sessions_delete_own on public.activity_sessions;
create policy activity_sessions_delete_own on public.activity_sessions
  for delete using (auth.uid() = user_id);

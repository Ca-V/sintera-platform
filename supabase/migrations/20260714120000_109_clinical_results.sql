-- Clinical Results — persistência dos resultados do Clinical Processing Engine que NÃO são biomarcadores.
-- Fundadora (14/07): o resultado de cada modalidade tem seu modelo próprio (parâmetro por região ≠ achado ≠
-- biomarcador). Esta é a persistência genérica da saída do CPE (ProcessorOutput), keyed por exame + MODELO
-- CLÍNICO + nome + região. NÃO reutiliza `biomarkers` (que é laboratorial e não tem região) — evita o
-- churn "Pentacam = N biomarcadores". Coerente com UCDA (a unidade é a evidência clínica, representável
-- universalmente) e com `ProcessedParameter { name, value, unit, region }`.
create table if not exists public.clinical_results (
  id               uuid primary key default gen_random_uuid(),
  exam_id          uuid not null references public.exams(id) on delete cascade,
  user_id          uuid not null,
  clinical_model   text not null,                      -- ex.: 'corneal-tomography'
  result_kind      text not null check (result_kind in ('parametric','narrative','structured')),
  name             text not null,                      -- ex.: 'K1'
  value_text       text,                               -- ex.: '43.2' (valor como transcrito; sem interpretação)
  unit             text,                               -- ex.: 'D'
  region           text,                               -- ex.: 'OD' | 'OE' (lateralidade/derivação), quando aplicável
  sort_order       int  not null default 0,
  source           text not null default 'cpe',        -- proveniência (processador do CPE)
  contract_version text,                               -- versão do modelo/processador
  raw_text         text,                               -- trecho-fonte (auditoria/rastreabilidade)
  created_at       timestamptz not null default now()
);

comment on table public.clinical_results is
  'Resultados estruturados do Clinical Processing Engine que não são biomarcadores (parametric/narrative). Saída do processador por MODELO CLÍNICO; keyed por exame+modelo+nome+região. Transcreve valores, não interpreta (RDC 657).';

create index if not exists idx_clinical_results_exam  on public.clinical_results(exam_id);
create index if not exists idx_clinical_results_model on public.clinical_results(exam_id, clinical_model);

alter table public.clinical_results enable row level security;
create policy "clinical_results_insert" on public.clinical_results
  for insert with check ((select auth.uid()) = user_id);
create policy "clinical_results_select" on public.clinical_results
  for select using ((select auth.uid()) = user_id);
create policy "clinical_results_delete" on public.clinical_results
  for delete using ((select auth.uid()) = user_id);

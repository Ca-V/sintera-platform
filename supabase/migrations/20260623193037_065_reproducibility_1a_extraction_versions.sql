-- ============================================================================
-- Migration 065 — Reprodutibilidade · Subfase 1a (PURAMENTE ADITIVA)
-- ============================================================================
-- GERADA PARA REVISÃO. NÃO aplicar via MCP até aprovação explícita.
-- Projeto: pxiglvrgxooawetboglb
--
-- ESCOPO: cria a estrutura do artefato de extração versionado (genérico p/
--   laboratorial, imagem e ômica). NÃO altera leituras, NÃO altera escritas,
--   NÃO toca replace_biomarkers. Tudo nullable/vazio → comportamento ZERO.
--
-- ESTADO-ALVO (documentado; NÃO imposto nesta fase):
--   - exams.document_sha256: OBRIGATÓRIO para todo NOVO documento (calculado no
--     upload); base de deduplicação, reuso e auditoria. Nullable aqui só p/ legado.
--   - extraction_versions.source_text: OBRIGATÓRIO para NOVAS versões de toda
--     modalidade (PDF textual, OCR de imagem, laudos clínicos). Nullable aqui só
--     p/ legado. Enforce (NOT NULL/CHECK validado) entra na 1e, após o backfill.
--   - modality: modelada como LOOKUP extensível (tabela `modalities`), não enum —
--     cresce por INSERT (pathology, wearable, questionnaire, clinical_document...).
--
-- ----------------------------------------------------------------------------
-- ROLLBACK (ver bloco "ROLLBACK" no fim). Ordem: remover referências → tabelas.
-- ----------------------------------------------------------------------------

-- 1) Lookup de modalidade (extensível; sem enum restritivo)
create table if not exists public.modalities (
  code          text primary key,            -- 'laboratory' | 'imaging' | 'omics' | ...
  label         text not null,
  domain        text,                         -- agrupamento opcional (clinical, omics, ...)
  active        boolean not null default true,
  display_order integer,
  created_at    timestamptz not null default now()
);

-- Taxonomia definitiva recomendada (7 modalidades de DOCUMENTO).
-- Fronteiras: imaging=radiologia/US · pathology=tecido/microscopia ·
-- functional=traçado fisiológico não-imagem (ECG/Holter/espirometria) ·
-- clinical_document=demais documentos clínicos · questionnaire=só se documento extraído.
-- 'wearable' NÃO entra aqui (é leitura de dispositivo via wearable_readings, não documento).
insert into public.modalities (code, label, domain, display_order) values
  ('laboratory',        'Exame laboratorial',    'clinical', 1),
  ('imaging',           'Exame de imagem',       'clinical', 2),
  ('pathology',         'Anatomia patológica',   'clinical', 3),
  ('functional',        'Exame funcional',       'clinical', 4),
  ('omics',             'Exame ômico',           'omics',    5),
  ('clinical_document', 'Documento clínico',     'clinical', 6),
  ('questionnaire',     'Questionário/escala',   'clinical', 7)
on conflict (code) do nothing;

alter table public.modalities enable row level security;
create policy "Modalidades visíveis a autenticados" on public.modalities
  for select using (true);

-- 2) exams: identidade do documento + modalidade (ponteiro canônico vem após a tabela de versões)
alter table public.exams add column if not exists document_sha256 text;
alter table public.exams add column if not exists modality_code text
  references public.modalities (code);   -- soft FK ao lookup (nullable; cresce por INSERT)

-- 3) extraction_versions — artefato central, genérico de modalidade
create table if not exists public.extraction_versions (
  id                     uuid primary key default gen_random_uuid(),
  exam_id                uuid    not null references public.exams (id)            on delete cascade,
  user_id                uuid    not null references auth.users (id)              on delete cascade,
  version_number         integer not null,
  document_sha256        text,            -- nullable na 1a; obrigatório p/ novas versões (1e)
  source_text            text,            -- texto OCR/PDF/transcrição CONGELADO (obrigatório p/ novas versões, 1e)
  extractor_version      text,            -- versão do pipeline de extração (semver do código)
  prompt_version         text,            -- versão do prompt (null se a modalidade não usa LLM)
  model_version          text,            -- modelo (ex.: claude-haiku-4-5-20251001)
  ai_log_id              uuid    references public.ai_processing_log (id)         on delete set null,
  origin                 text    not null default 'fresh',  -- fresh | reused | reprocess
  reused_from_version_id uuid    references public.extraction_versions (id)       on delete set null,
  reason                 text,            -- motivo do reprocessamento (auditoria)
  created_by             uuid    references auth.users (id)                       on delete set null,
  created_at             timestamptz not null default now(),
  promoted_by            uuid    references auth.users (id)                       on delete set null,
  promoted_at            timestamptz,
  promotion_reason       text,
  constraint extraction_versions_origin_chk    check (origin in ('fresh','reused','reprocess')),
  constraint extraction_versions_exam_ver_uk   unique (exam_id, version_number)
);

alter table public.extraction_versions enable row level security;
create policy "Usuária vê suas versões" on public.extraction_versions
  for select using (auth.uid() = user_id);
-- (policies de INSERT/UPDATE entram na 1d, com o novo caminho de escrita)

-- 4) exams: ponteiro canônico (fecha a FK circular; nullable → ordem segura)
alter table public.exams add column if not exists current_extraction_version_id uuid
  references public.extraction_versions (id) on delete set null;

-- 5) Resultados por versão (genérico): lab + ômica agora; imagem nasce com a coluna
alter table public.biomarkers    add column if not exists extraction_version_id uuid
  references public.extraction_versions (id) on delete cascade;
alter table public.omics_results add column if not exists extraction_version_id uuid
  references public.extraction_versions (id) on delete cascade;

-- 6) Índices
--    (escala: em base grande, usar CREATE INDEX CONCURRENTLY fora de transação;
--     aqui a base é pequena e a migration é transacional, então índices normais.)
-- SEMÂNTICA DE REUSO (implementada na 1b/2): só reutiliza um resultado quando a
-- chave INTEIRA coincide. Mesmo documento/hash com NOVO modelo OU NOVO prompt
-- difere a chave → NÃO reusa → gera nova versão (origin='fresh'). Modelo e prompt
-- fazem parte da identidade da extração.
create index if not exists idx_extraction_reuse
  on public.extraction_versions (user_id, document_sha256, extractor_version, prompt_version, model_version);
create index if not exists idx_extraction_versions_exam on public.extraction_versions (exam_id);
create index if not exists idx_exams_doc_sha            on public.exams (user_id, document_sha256);
create index if not exists idx_biomarkers_version       on public.biomarkers (extraction_version_id);
create index if not exists idx_omics_results_version    on public.omics_results (extraction_version_id);

-- ============================================================================
-- ROLLBACK (executar nesta ordem) — remove referências antes das tabelas.
-- Impacto: nenhum (estruturas vazias até a 1b; nada lê/escreve). Sem perda de dado.
-- Objetos removidos: 5 índices, 4 colunas (exams ×3, biomarkers ×1, omics_results ×1),
--   2 tabelas (extraction_versions, modalities) e suas policies/constraints.
-- Dependências afetadas: nenhuma de código (recurso ainda não consumido).
-- ----------------------------------------------------------------------------
-- drop index if exists idx_biomarkers_version;
-- drop index if exists idx_omics_results_version;
-- drop index if exists idx_extraction_reuse;
-- drop index if exists idx_extraction_versions_exam;
-- alter table public.biomarkers    drop column if exists extraction_version_id;
-- alter table public.omics_results drop column if exists extraction_version_id;
-- alter table public.exams         drop column if exists current_extraction_version_id;
-- drop table  if exists public.extraction_versions;   -- remove policy/constraints/uk junto
-- alter table public.exams         drop column if exists modality_code;
-- drop index if exists idx_exams_doc_sha;
-- alter table public.exams         drop column if exists document_sha256;
-- drop table  if exists public.modalities;            -- remove policy junto
-- ============================================================================

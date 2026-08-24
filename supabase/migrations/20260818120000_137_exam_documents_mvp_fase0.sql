-- 137 — exam_documents MVP (EXDOC-002 / Fase 0) — DDL ADITIVO, retrocompatível, reversível.
-- NÃO modifica nenhuma linha existente (puramente estrutural). O backfill (mutação de dados) é um
-- passo SEPARADO e GATED: docs/fase0/backfill_137_exam_documents.sql (aplicar só após validação em preview).
-- Rollback: docs/fase0/rollback_137_exam_documents.sql. Plano: docs/EXDOC-003_PLANO_FASE0.md.
-- Idempotente (IF NOT EXISTS / guards). Escopo travado ao MVP aprovado (EXDOC-002) — nada além.

-- 1) RECONCILIAÇÃO repo<->prod: exams.fulfills_order_id / order_status JÁ EXISTEM no banco
--    (usados no código/DTO, sem DDL no repo — RNDS-001 §2). Aqui apenas os formalizamos + a FK do vínculo.
alter table public.exams add column if not exists fulfills_order_id uuid;
alter table public.exams add column if not exists order_status text;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'exams_fulfills_order_id_fkey') then
    alter table public.exams
      add constraint exams_fulfills_order_id_fkey
      foreign key (fulfills_order_id) references public.exams(id) on delete set null;
  end if;
end $$;
create index if not exists idx_exams_fulfills_order_id on public.exams(fulfills_order_id);

-- 2) exam_documents — cada ARTEFATO do evento clínico (→ FHIR DocumentReference/Binary)
create table if not exists public.exam_documents (
  id                             uuid primary key default gen_random_uuid(),
  exam_id                        uuid not null references public.exams(id) on delete cascade,
  user_id                        uuid not null,
  -- artefato
  file_url                       text not null,
  document_sha256                text,                 -- base de dedup (coluna só; SEM lógica de merge no MVP)
  -- papel MÍNIMO (distinguir preliminar × final) → FHIR DiagnosticReport.status
  document_role                  text not null default 'outro'
                                   check (document_role in ('laudo_preliminar','laudo_final','complementar','outro')),
  -- proveniência POR documento (→ FHIR Provenance)
  source                         text not null default 'upload_usuario',
  uploaded_at                    timestamptz not null default now(),
  current_extraction_version_id  uuid references public.extraction_versions(id),
  -- fatos documentais (transcrição, não inferência)
  exam_date                      date,
  issuer                         text,
  -- apresentação / ciclo
  is_primary                     boolean not null default false,
  status                         text not null default 'pending',
  created_at                     timestamptz not null default now()
);
create index if not exists idx_exam_documents_exam_id on public.exam_documents(exam_id);
create index if not exists idx_exam_documents_sha256   on public.exam_documents(document_sha256);
-- no máximo 1 documento primário por exame
create unique index if not exists uq_exam_documents_primary
  on public.exam_documents(exam_id) where is_primary;

-- RLS (user-scoped, espelhando o padrão das demais tabelas). Idempotente.
alter table public.exam_documents enable row level security;
drop policy if exists exam_documents_select on public.exam_documents;
create policy exam_documents_select on public.exam_documents for select using (auth.uid() = user_id);
drop policy if exists exam_documents_insert on public.exam_documents;
create policy exam_documents_insert on public.exam_documents for insert with check (auth.uid() = user_id);
drop policy if exists exam_documents_update on public.exam_documents;
create policy exam_documents_update on public.exam_documents for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists exam_documents_delete on public.exam_documents;
create policy exam_documents_delete on public.exam_documents for delete using (auth.uid() = user_id);

-- 3) ponteiro do documento primário no agregado (→ documento de apresentação/derivação)
alter table public.exams add column if not exists primary_document_id uuid
  references public.exam_documents(id) on delete set null;

-- 4) dimensão de documento nas tabelas de resultado (NULLABLE na transição) → resultados por documento
alter table public.extraction_versions add column if not exists exam_document_id uuid
  references public.exam_documents(id) on delete set null;
alter table public.biomarkers         add column if not exists exam_document_id uuid
  references public.exam_documents(id) on delete set null;
alter table public.clinical_results   add column if not exists exam_document_id uuid
  references public.exam_documents(id) on delete set null;
create index if not exists idx_extraction_versions_exam_document_id on public.extraction_versions(exam_document_id);
create index if not exists idx_biomarkers_exam_document_id          on public.biomarkers(exam_document_id);
create index if not exists idx_clinical_results_exam_document_id    on public.clinical_results(exam_document_id);

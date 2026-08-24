-- ============================================================================
-- Fase 0 — ROLLBACK (reverte DDL 137 + backfill). Aditivo ⇒ drop reverte sem perda.
-- NÃO dropa fulfills_order_id/order_status: já existiam em prod ANTES da Fase 0.
-- ============================================================================
begin;

-- 1) remover a dimensão de documento das tabelas de resultado
alter table public.extraction_versions drop column if exists exam_document_id;
alter table public.biomarkers           drop column if exists exam_document_id;
alter table public.clinical_results     drop column if exists exam_document_id;

-- 2) remover o ponteiro do agregado (FK primeiro, via drop column)
alter table public.exams drop column if exists primary_document_id;

-- 3) remover a tabela de documentos (cascade nas policies/índices)
drop table if exists public.exam_documents cascade;

-- 4) fulfills_order_id / order_status: PRESERVADOS (pré-existiam). NÃO remover.
--    Se desejar reverter APENAS a FK adicionada em 137 (mantendo as colunas):
-- alter table public.exams drop constraint if exists exams_fulfills_order_id_fkey;
-- drop index if exists idx_exams_fulfills_order_id;

commit;

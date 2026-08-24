-- ============================================================================
-- Fase 0 — HARNESS de validação LOCAL (reprodutível). Read-only quanto ao repo.
-- Uso (a partir da RAIZ do repo, contra um Postgres SCRATCH — NUNCA produção):
--   initdb -D /tmp/pg && pg_ctl -D /tmp/pg -o "-p 55432 -k /tmp" -l /tmp/pg/log start
--   psql -h /tmp -p 55432 -U postgres -d postgres -v ON_ERROR_STOP=1 -f docs/fase0/local_validation_harness.sql
-- Aplica: DDL 137 → dados sintéticos (incl. 2 congelados) → backfill → validação → teste de rollback.
-- Resultado esperado: todos os checks verdes; congelados intactos; rollback preserva fulfills_order_id.
-- ============================================================================
\set ON_ERROR_STOP on

-- stubs mínimos (Supabase auth + tabelas pré-existentes, só as colunas tocadas)
create schema if not exists auth;
create or replace function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
create table public.extraction_versions(id uuid primary key default gen_random_uuid(), exam_id uuid);
create table public.exams(id uuid primary key default gen_random_uuid(), user_id uuid not null, file_url text,
  document_sha256 text, document_type text, exam_date date, issuer text, status text,
  created_at timestamptz default now(), current_extraction_version_id uuid references public.extraction_versions(id));
create table public.biomarkers(id uuid primary key default gen_random_uuid(), exam_id uuid references public.exams(id));
create table public.clinical_results(id uuid primary key default gen_random_uuid(), exam_id uuid references public.exams(id));

\echo '== DDL 137 =='
\i supabase/migrations/20260818120000_137_exam_documents_mvp_fase0.sql

\echo '== dados sintéticos (2 normais + 2 congelados) =='
insert into public.extraction_versions(id) values ('11111111-1111-1111-1111-111111111111');
insert into public.exams(id,user_id,file_url,document_sha256,document_type,exam_date,issuer,status,current_extraction_version_id) values
 ('a0000000-0000-0000-0000-000000000001','99999999-9999-9999-9999-999999999999','https://x/lab.pdf','sha-lab','laboratory','2026-01-01','Fleury','processed','11111111-1111-1111-1111-111111111111'),
 ('a0000000-0000-0000-0000-000000000002','99999999-9999-9999-9999-999999999999','https://x/pedido.jpg','sha-ped','medical_order',null,'Unimed','processed',null),
 ('ab5b5816-14de-4d1f-af00-0adee674841d','99999999-9999-9999-9999-999999999999','https://x/frozen1.jpg','sha-f1','medical_order',null,'Unimed','processed',null),
 ('0f5ec205-9bdc-4403-b5d6-b2e287a9ebc1','99999999-9999-9999-9999-999999999999','https://x/frozen2.jpg','sha-f2','imaging',null,null,'processed',null);
update public.extraction_versions set exam_id='a0000000-0000-0000-0000-000000000001' where id='11111111-1111-1111-1111-111111111111';
insert into public.biomarkers(exam_id) values ('a0000000-0000-0000-0000-000000000001');
insert into public.clinical_results(exam_id) values ('a0000000-0000-0000-0000-000000000001');

\echo '== backfill (gated) =='
\i docs/fase0/backfill_137_exam_documents.sql
\echo '== validação =='
\i docs/fase0/validation_137.sql
\echo '== asserts extra (esperado: 2 docs; congelados=2 sem primary; 0 divergências) =='
select 'total exam_documents' as check, count(*) as v from public.exam_documents;
select 'congelados sem primary' as check, count(*) as v from public.exams where id in ('ab5b5816-14de-4d1f-af00-0adee674841d','0f5ec205-9bdc-4403-b5d6-b2e287a9ebc1') and primary_document_id is null;
select 'file_url==primario (0)' as check, count(*) as v from public.exams e join public.exam_documents d on d.id=e.primary_document_id where coalesce(e.file_url,'')<>coalesce(d.file_url,'');
\echo '== rollback (esperado: tabela removida; fulfills_order_id preservado) =='
\i docs/fase0/rollback_137_exam_documents.sql
select 'exam_documents removida' as check, to_regclass('public.exam_documents') is null as ok;
select 'fulfills_order_id preservado' as check, count(*)=1 as ok from information_schema.columns where table_name='exams' and column_name='fulfills_order_id';

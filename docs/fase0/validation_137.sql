-- ============================================================================
-- Fase 0 — VALIDAÇÃO (read-only). Rodar após DDL + backfill (preview primeiro).
-- Cada checagem tem o resultado ESPERADO ao lado. Tudo deve passar antes de produção.
-- ============================================================================

-- [ESTRUTURAL] tabela e colunas existem
select 'exam_documents existe' as check,
       to_regclass('public.exam_documents') is not null as ok;                       -- ok = true
select 'colunas novas em exams' as check,
       count(*) = 2 as ok
from information_schema.columns
where table_schema='public' and table_name='exams'
  and column_name in ('primary_document_id','fulfills_order_id');                     -- ok = true
select 'exam_document_id nas 3 tabelas de resultado' as check,
       count(*) = 3 as ok
from information_schema.columns
where table_schema='public' and column_name='exam_document_id'
  and table_name in ('extraction_versions','biomarkers','clinical_results');          -- ok = true

-- [RLS] habilitado
select 'RLS on exam_documents' as check, relrowsecurity as ok
from pg_class where oid = 'public.exam_documents'::regclass;                           -- ok = true

-- [INTEGRIDADE] 1 documento primário por exame backfillado; sem exame (não-congelado) sem primário
select 'exames com file_url sem documento (excl. congelados)' as check, count(*) as deve_ser_zero
from public.exams e
where e.file_url is not null
  and e.id not in ('ab5b5816-14de-4d1f-af00-0adee674841d','0f5ec205-9bdc-4403-b5d6-b2e287a9ebc1')
  and not exists (select 1 from public.exam_documents d where d.exam_id = e.id);       -- deve_ser_zero = 0

select 'exames com >1 documento primário' as check, count(*) as deve_ser_zero
from (select exam_id from public.exam_documents where is_primary group by exam_id having count(*) > 1) x; -- 0

-- [FILE_URL → PRIMÁRIO] o espelho: file_url do exame == file_url do documento primário
select 'file_url do exame difere do primário' as check, count(*) as deve_ser_zero
from public.exams e
join public.exam_documents d on d.id = e.primary_document_id
where coalesce(e.file_url,'') <> coalesce(d.file_url,'');                              -- deve_ser_zero = 0

-- [VÍNCULO PEDIDO↔RESULTADO] FK válida
select 'fulfills_order_id órfão' as check, count(*) as deve_ser_zero
from public.exams e
where e.fulfills_order_id is not null
  and not exists (select 1 from public.exams o where o.id = e.fulfills_order_id);      -- deve_ser_zero = 0

-- [PROVENIÊNCIA] resultados backfillados apontam para o documento primário do seu exame
select 'biomarkers com exam_document_id inconsistente' as check, count(*) as deve_ser_zero
from public.biomarkers b
join public.exams e on e.id = b.exam_id
where b.exam_document_id is not null and b.exam_document_id <> e.primary_document_id;  -- deve_ser_zero = 0

-- [CONGELADOS INTOCADOS] ab5b5816 e 0f5ec205 sem documentos e sem primary_document_id
select 'congelados sem exam_documents' as check,
       (select count(*) from public.exam_documents
         where exam_id in ('ab5b5816-14de-4d1f-af00-0adee674841d','0f5ec205-9bdc-4403-b5d6-b2e287a9ebc1')) as deve_ser_zero; -- 0
select 'congelados com primary_document_id preenchido' as check,
       count(*) as deve_ser_zero
from public.exams
where id in ('ab5b5816-14de-4d1f-af00-0adee674841d','0f5ec205-9bdc-4403-b5d6-b2e287a9ebc1')
  and primary_document_id is not null;                                                 -- deve_ser_zero = 0

-- ============================================================================
-- Fase 0 — BACKFILL (MUTAÇÃO DE DADOS) — GATED. NÃO auto-aplicar.
-- Aplicar SOMENTE após o DDL (migração 137) e após validação em PREVIEW,
-- seguindo docs/EXDOC-003_PLANO_FASE0.md (snapshot → preview → validação → rollback test → prod).
-- ----------------------------------------------------------------------------
-- Additivo e retrocompatível: NÃO altera dados clínicos (nome/resultados/file_url).
-- Apenas cria 1 exam_document por exame + ponteiro primário + propaga exam_document_id.
-- CONGELADOS: ab5b5816 e 0f5ec205 são EXCLUÍDOS deste backfill (freeze). Poderão ser
-- backfillados depois, em passo próprio revisado.
-- ============================================================================
begin;

-- Congelados a excluir (freeze H-10 pedido + laudo em trilha separada)
-- ab5b5816-14de-4d1f-af00-0adee674841d  (pedido Doppler — H-10 validado)
-- 0f5ec205-9bdc-4403-b5d6-b2e287a9ebc1  (laudo "Ultrassom" — trilha de extração)

-- 1) 1 documento PRIMÁRIO por exame (papel inferido conservador; pedido→'outro', demais→'laudo_final')
insert into public.exam_documents
  (id, exam_id, user_id, file_url, document_sha256, document_role, source, uploaded_at,
   current_extraction_version_id, exam_date, issuer, is_primary, status, created_at)
select gen_random_uuid(), e.id, e.user_id, e.file_url, e.document_sha256,
       case when e.document_type in ('medical_order','insurance_guide') then 'outro'
            else 'laudo_final' end,
       'backfill', e.created_at, e.current_extraction_version_id, e.exam_date, e.issuer, true,
       case when e.status = 'processed' then 'processed' else coalesce(e.status,'pending') end,
       e.created_at
from public.exams e
where e.file_url is not null
  and e.id not in ('ab5b5816-14de-4d1f-af00-0adee674841d',
                   '0f5ec205-9bdc-4403-b5d6-b2e287a9ebc1')          -- congelados
  and not exists (select 1 from public.exam_documents d where d.exam_id = e.id);

-- 2) primary_document_id no agregado (só onde ainda nulo; congelados não têm doc → não afetados)
update public.exams e
set primary_document_id = d.id
from public.exam_documents d
where d.exam_id = e.id and d.is_primary and e.primary_document_id is null;

-- 3) propagar exam_document_id para os resultados (apontando o documento primário)
update public.extraction_versions v set exam_document_id = e.primary_document_id
from public.exams e
where v.exam_id = e.id and v.exam_document_id is null and e.primary_document_id is not null;

update public.biomarkers b set exam_document_id = e.primary_document_id
from public.exams e
where b.exam_id = e.id and b.exam_document_id is null and e.primary_document_id is not null;

update public.clinical_results c set exam_document_id = e.primary_document_id
from public.exams e
where c.exam_id = e.id and c.exam_document_id is null and e.primary_document_id is not null;

-- NOTA: exams.file_url permanece INALTERADO — ele JÁ é o file_url do documento primário
-- (o backfill copiou dele). O "espelho" é essa igualdade, verificada em validation_137.sql.

commit;

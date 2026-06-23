-- ============================================================================
-- Migration 066 — Reprodutibilidade · Subfase 1b (BACKFILL do legado LAB)
-- ============================================================================
-- GERADA PARA REVISÃO. NÃO aplicar via MCP até aprovação explícita.
-- Projeto: pxiglvrgxooawetboglb · Requer a 065 (já aplicada em produção).
--
-- ESCOPO: vincula o legado LABORATORIAL ao modelo versionado — cria v1 por exame
--   com biomarcadores, liga os biomarcadores à v1 e seta o ponteiro canônico.
--   ÔMICA NÃO INCLUÍDA (painel sem exam_id; convergência em fase dedicada — ver
--   docs/REPRODUCIBILIDADE-CONVERGENCIA-OMICA.md).
--
-- COMPORTAMENTO DO USUÁRIO: ZERO — nada lê/escreve extraction_version_id antes da
--   1c/1d. Apenas preenche FKs e ponteiros.
--
-- IDEMPOTÊNCIA: re-execução = no-op (condições WHERE … is null + ON CONFLICT).
--   Versões criadas aqui são marcadas com reason='backfill_legacy' (rollback preciso).
-- ----------------------------------------------------------------------------

-- Passo 1: criar v1 para exames COM biomarcadores e AINDA sem versão canônica.
--   Metadados best-effort: source_text=exam_text (null em imagem); model/ai_log_id
--   do último log 'success'; sha256/prompt/extractor = null (legado).
insert into public.extraction_versions
  (exam_id, user_id, version_number, document_sha256, source_text,
   model_version, ai_log_id, origin, reason, created_at)
select
  e.id, e.user_id, 1, e.document_sha256, e.exam_text,
  (select l.model from public.ai_processing_log l
     where l.exam_id = e.id and l.status = 'success'
     order by l.started_at desc limit 1),
  (select l.id from public.ai_processing_log l
     where l.exam_id = e.id and l.status = 'success'
     order by l.started_at desc limit 1),
  'fresh', 'backfill_legacy', e.created_at
from public.exams e
where e.current_extraction_version_id is null
  and exists (select 1 from public.biomarkers b where b.exam_id = e.id)
on conflict (exam_id, version_number) do nothing;

-- Passo 2: vincular biomarcadores à v1 do próprio exame (apenas os não vinculados).
update public.biomarkers b
set extraction_version_id = v.id
from public.extraction_versions v
where v.exam_id = b.exam_id
  and v.version_number = 1
  and v.reason = 'backfill_legacy'
  and b.extraction_version_id is null;

-- Passo 3: apontar a versão canônica no exame (apenas os ainda sem ponteiro).
update public.exams e
set current_extraction_version_id = v.id
from public.extraction_versions v
where v.exam_id = e.id
  and v.version_number = 1
  and v.reason = 'backfill_legacy'
  and e.current_extraction_version_id is null;

-- ============================================================================
-- VALIDAÇÕES PÓS-EXECUÇÃO (rodar SEPARADAMENTE após aplicar; não fazem parte da
-- transação). Critério de sucesso: a=0, b=0, c=6, d=0 e contagem de biomarcadores
-- inalterada (o backfill não cria/apaga biomarcador, só preenche a FK).
-- ----------------------------------------------------------------------------
-- select
--   (select count(*) from public.exams e
--      where exists (select 1 from public.biomarkers b where b.exam_id=e.id)
--        and e.current_extraction_version_id is null)                              as a_exames_lab_sem_canonica, -- 0
--   (select count(*) from public.biomarkers b
--      join public.exams e on e.id=b.exam_id
--      where b.extraction_version_id is null)                                      as b_biomarkers_sem_versao,   -- 0
--   (select count(*) from public.extraction_versions where reason='backfill_legacy') as c_versoes_backfill,      -- 6
--   (select count(*) from public.biomarkers b
--      join public.extraction_versions v on v.id=b.extraction_version_id
--      where v.exam_id <> b.exam_id)                                               as d_vinculos_cruzados;       -- 0

-- ============================================================================
-- ROLLBACK (executar nesta ordem). Reversível e sem perda: as linhas de
-- biomarkers permanecem intactas (só a FK é zerada); só as versões criadas pelo
-- backfill (reason='backfill_legacy') são removidas.
-- ----------------------------------------------------------------------------
-- update public.exams set current_extraction_version_id = null
--   where current_extraction_version_id in
--     (select id from public.extraction_versions where reason='backfill_legacy');
-- update public.biomarkers set extraction_version_id = null
--   where extraction_version_id in
--     (select id from public.extraction_versions where reason='backfill_legacy');
-- delete from public.extraction_versions where reason='backfill_legacy';
-- ============================================================================

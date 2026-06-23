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
-- INVARIANTES PERMANENTES (verdadeiros após a execução E após rollback)
--   Rodar SEPARADAMENTE; não fazem parte da transação. Todos devem dar 0.
--   I5 (antes=depois) exige capturar o total de biomarcadores ANTES (baseline=54).
-- ----------------------------------------------------------------------------
-- select
--   -- I1: todo biomarker tem extraction_version_id
--   (select count(*) from public.biomarkers where extraction_version_id is null)                       as i1_biomarkers_sem_versao,    -- 0
--   -- I2: todo exame com biomarcadores tem current_extraction_version_id
--   (select count(*) from public.exams e where exists(select 1 from public.biomarkers b where b.exam_id=e.id)
--      and e.current_extraction_version_id is null)                                                    as i2_exames_lab_sem_canonica,  -- 0
--   -- I3: toda extraction_version pertence a exatamente um exam_id
--   (select count(*) from public.extraction_versions where exam_id is null)                            as i3_versoes_sem_exame,        -- 0
--   -- I4: nenhum biomarker vinculado a versão de OUTRO exame
--   (select count(*) from public.biomarkers b join public.extraction_versions v on v.id=b.extraction_version_id
--      where v.exam_id <> b.exam_id)                                                                   as i4_vinculos_cruzados,        -- 0
--   -- I6: nenhuma linha órfã (FK aponta p/ versão inexistente)
--   (select count(*) from public.biomarkers b where b.extraction_version_id is not null
--      and not exists(select 1 from public.extraction_versions v where v.id=b.extraction_version_id))  as i6_orfaos;                   -- 0
-- I5: conferir (select count(*) from public.biomarkers) == baseline ANTES (54). Igual = ok.

-- ============================================================================
-- RELATÓRIO DE AUDITORIA PÓS-EXECUÇÃO (quantitativo; integridade/auditoria futura)
-- ----------------------------------------------------------------------------
-- select
--   (select count(distinct exam_id) from public.extraction_versions where reason='backfill_legacy')   as exames_processados,
--   (select count(*) from public.extraction_versions where reason='backfill_legacy')                  as versoes_criadas,
--   (select count(*) from public.biomarkers b join public.extraction_versions v on v.id=b.extraction_version_id
--      where v.reason='backfill_legacy')                                                              as biomarkers_vinculados,
--   (select count(*) from public.exams e where not exists(select 1 from public.biomarkers b where b.exam_id=e.id)) as exames_sem_biomarkers,
--   (select count(*) from public.exams e where exists(select 1 from public.biomarkers b where b.exam_id=e.id)
--      and e.current_extraction_version_id is not null
--      and e.current_extraction_version_id not in (select id from public.extraction_versions where reason='backfill_legacy')) as exames_ja_canonicos_ignorados,
--   (select count(*) from public.biomarkers b where b.extraction_version_id is not null
--      and not exists(select 1 from public.extraction_versions v where v.id=b.extraction_version_id))  as registros_orfaos,
--   (select count(*) from public.biomarkers)          as biomarkers_total_depois,    -- comparar com 54 (antes)
--   (select count(*) from public.extraction_versions) as versoes_total_depois;       -- comparar com 0  (antes)

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

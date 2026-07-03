-- 094 — Fidelidade da Ingestão: a view canônica current_biomarkers passa a expor
-- source_material e source_exam_name (contexto do laudo) para a página de Exames.
-- create or replace com as colunas novas ao FINAL (compatível; consumidores atuais
-- inalterados). Mesma projeção da versão canônica corrente por exame.
create or replace view public.current_biomarkers as
 select b.id,
    b.exam_id,
    b.user_id,
    b.name,
    b.value,
    b.unit,
    b.reference_min,
    b.reference_max,
    b.interpretation,
    b.ai_insight,
    b.created_at,
    b.synthetic,
    b.source,
    b.confidence,
    b.raw_text,
    b.range_extracted,
    b.reference_source,
    b.ai_log_id,
    b.result_type,
    b.value_text,
    b.catalog_id,
    b.extraction_version_id,
    b.source_material,
    b.source_exam_name
   from biomarkers b
     join exams e on e.id = b.exam_id
  where b.extraction_version_id = e.current_extraction_version_id;

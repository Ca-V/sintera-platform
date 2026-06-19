-- 038 — replace_biomarkers: cobertura completa de colunas + search_path travado
--
-- Motivo:
--   A reanálise de exame ("Extrair novamente") fazia DELETE + INSERT por fora da
--   função, em duas chamadas não atômicas e sem checagem de erro: se o INSERT
--   falhasse, o exame ficava marcado como 'processed' com ZERO biomarcadores.
--   A função replace_biomarkers já existia, mas não inseria value_text,
--   result_type e catalog_id — por isso não era usada. Aqui ela passa a cobrir
--   todas as colunas que a rota grava, tornando a substituição atômica
--   (DELETE + INSERT numa única transação plpgsql).
--
-- Segurança:
--   SECURITY DEFINER + `SET search_path = ''` (resolve o aviso
--   function_search_path_mutable). Todas as referências são qualificadas.
--   Sem juízo clínico: apenas persistência dos dados já extraídos/normalizados.

CREATE OR REPLACE FUNCTION public.replace_biomarkers(
  p_exam_id uuid,
  p_user_id uuid,
  p_biomarkers jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  DELETE FROM public.biomarkers WHERE exam_id = p_exam_id;

  INSERT INTO public.biomarkers (
    exam_id, user_id, name, value, value_text, unit,
    reference_min, reference_max, result_type, interpretation,
    source, confidence, raw_text, range_extracted,
    reference_source, ai_log_id, catalog_id, synthetic
  )
  SELECT
    p_exam_id,
    p_user_id,
    (bm->>'name'),
    (bm->>'value')::numeric,
    (bm->>'value_text'),
    (bm->>'unit'),
    (bm->>'reference_min')::numeric,
    (bm->>'reference_max')::numeric,
    (bm->>'result_type'),
    (bm->>'interpretation'),
    (bm->>'source'),
    (bm->>'confidence')::numeric,
    (bm->>'raw_text'),
    (bm->>'range_extracted')::boolean,
    (bm->>'reference_source'),
    (bm->>'ai_log_id')::uuid,
    (bm->>'catalog_id')::uuid,
    false
  FROM jsonb_array_elements(p_biomarkers) AS bm;
END;
$function$;

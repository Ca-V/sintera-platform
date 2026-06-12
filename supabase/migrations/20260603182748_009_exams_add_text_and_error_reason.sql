
-- Campos para suportar extração de texto no backend (Epic 1.1)
ALTER TABLE public.exams
  ADD COLUMN IF NOT EXISTS exam_text text,
  ADD COLUMN IF NOT EXISTS error_reason text;

-- Ampliar valores permitidos de status para incluir 'error' explícito
-- (o check constraint original já inclui 'error', confirmando)
-- Apenas documentação: status = pending | processing | processed | error

-- RPC: substitui biomarcadores de forma atômica (reprocessamento sem janela de estado vazio)
CREATE OR REPLACE FUNCTION public.replace_biomarkers(
  p_exam_id uuid,
  p_user_id uuid,
  p_biomarkers jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.biomarkers WHERE exam_id = p_exam_id;

  INSERT INTO public.biomarkers (
    exam_id, user_id, name, value, unit,
    reference_min, reference_max, interpretation,
    source, confidence, raw_text, range_extracted,
    reference_source, ai_log_id, synthetic
  )
  SELECT
    p_exam_id,
    p_user_id,
    (bm->>'name'),
    (bm->>'value')::numeric,
    (bm->>'unit'),
    (bm->>'reference_min')::numeric,
    (bm->>'reference_max')::numeric,
    (bm->>'interpretation'),
    (bm->>'source'),
    (bm->>'confidence')::numeric,
    (bm->>'raw_text'),
    (bm->>'range_extracted')::boolean,
    (bm->>'reference_source'),
    (bm->>'ai_log_id')::uuid,
    false
  FROM jsonb_array_elements(p_biomarkers) AS bm;
END;
$$;

-- Garantir que authenticated pode executar a RPC (service definer já bypassa RLS)
GRANT EXECUTE ON FUNCTION public.replace_biomarkers(uuid, uuid, jsonb) TO authenticated;

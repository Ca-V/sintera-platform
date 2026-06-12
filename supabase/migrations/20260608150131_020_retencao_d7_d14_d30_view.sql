
-- Migration 020: view de retenção D7/D14/D30 (P2 Camada 1)
CREATE OR REPLACE VIEW retencao_usuarios AS
WITH primeiro_upload AS (
  SELECT
    user_id,
    MIN(created_at) AS primeiro_em
  FROM exams
  GROUP BY user_id
),
retornos AS (
  SELECT DISTINCT
    e.user_id,
    DATE(e.created_at) AS dia_retorno
  FROM usage_events e
  WHERE e.event_name IN ('exam_detail_viewed', 'exam_analyzed_success', 'historico_viewed')
)
SELECT
  p.user_id,
  p.primeiro_em,
  MAX(CASE WHEN r.dia_retorno BETWEEN (p.primeiro_em::date + 6) AND (p.primeiro_em::date + 8)  THEN 1 ELSE 0 END) AS retornou_d7,
  MAX(CASE WHEN r.dia_retorno BETWEEN (p.primeiro_em::date + 13) AND (p.primeiro_em::date + 15) THEN 1 ELSE 0 END) AS retornou_d14,
  MAX(CASE WHEN r.dia_retorno BETWEEN (p.primeiro_em::date + 29) AND (p.primeiro_em::date + 31) THEN 1 ELSE 0 END) AS retornou_d30
FROM primeiro_upload p
LEFT JOIN retornos r ON r.user_id = p.user_id
GROUP BY p.user_id, p.primeiro_em;

COMMENT ON VIEW retencao_usuarios IS 'P2 Camada 1 — Retenção D7/D14/D30 por usuária. Janela de ±1 dia ao redor do marco.';

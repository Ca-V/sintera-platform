
-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 5B: Verificar exames travados a cada 5 minutos
-- Chama a Edge Function pipeline-alert via pg_net
SELECT cron.schedule(
  'pipeline-stuck-exam-alert',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url    := 'https://pxiglvrgxooawetboglb.supabase.co/functions/v1/pipeline-alert',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body   := '{}'::jsonb
  );
  $$
);

-- 5A: Query diária de erros do pipeline às 08:00 UTC
-- Gera log no Postgres com contagem de erros das últimas 24h
SELECT cron.schedule(
  'pipeline-daily-error-digest',
  '0 8 * * *',
  $$
  INSERT INTO ai_processing_log (
    exam_id,
    status,
    parse_error,
    created_at
  )
  SELECT
    NULL::uuid,
    'cron_digest',
    format(
      'Digest 24h: %s erros | %s reparados | %s sucesso',
      COUNT(*) FILTER (WHERE status = 'error'),
      COUNT(*) FILTER (WHERE parse_repaired = true),
      COUNT(*) FILTER (WHERE status = 'completed')
    ),
    NOW()
  FROM ai_processing_log
  WHERE created_at >= NOW() - INTERVAL '24 hours'
    AND status != 'cron_digest';
  $$
);

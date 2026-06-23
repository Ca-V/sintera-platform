-- PR1 (resiliência IA): observabilidade de erro do provider + stop_reason.
-- 'truncated' já existe em ai_processing_log (migration anterior) e NÃO é recriada aqui.
-- Aditiva, idempotente. ai_processing_log.status é text livre (novos valores não exigem mudança de constraint).
--
-- NOTA: estas colunas já foram aplicadas em produção (pxiglvrgxooawetboglb) via MCP em 23/06/2026.
-- Este arquivo documenta a mudança para reprodutibilidade em novos ambientes. Como usa
-- ADD COLUMN IF NOT EXISTS, reaplicar é um no-op seguro.

alter table public.ai_processing_log
  add column if not exists provider_http_status int;

alter table public.ai_processing_log
  add column if not exists stop_reason text;

comment on column public.ai_processing_log.provider_http_status is
  'Status HTTP retornado pela API Anthropic em erro (429, 529, 500...). NULL em sucesso ou erro de conexao sem status.';
comment on column public.ai_processing_log.stop_reason is
  'stop_reason da resposta do modelo (end_turn, max_tokens, stop_sequence, tool_use). NULL quando a chamada falhou antes de responder.';

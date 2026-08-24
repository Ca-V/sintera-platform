-- 144 — Remove o job `pipeline-daily-error-digest` do pg_cron.
--
-- MOTIVO: o job NUNCA funcionou. Foi criado pela migration 016 (04/06/2026) com três
-- incompatibilidades independentes contra `public.ai_processing_log`:
--   1. insere em `created_at` — coluna que nunca existiu (os timestamps são
--      `started_at` e `completed_at`);
--   2. omite `model`, que é NOT NULL sem default;
--   3. insere `status = 'cron_digest'`, fora do CHECK original
--      (`success` | `error` | `timeout`).
-- Resultado: 81 execuções, 100% falhas, por ~2,5 meses, sem que a ausência do digest
-- fosse notada por ninguém. Ausência de impacto comprovada empiricamente.
--
-- DECISÃO: remover em vez de corrigir. Consertar código morto adiciona superfície de
-- manutenção sem benefício demonstrado. Se o digest voltar a ser requisito, deve ser
-- reescrito contra o modelo atual da tabela, com consumidor definido.
--
-- Idempotente: `cron.unschedule` por nome falha se o job não existir, então o DO block
-- verifica antes. Reaplicar esta migration num banco reconstruído é seguro.

do $$
begin
  if exists (select 1 from cron.job where jobname = 'pipeline-daily-error-digest') then
    perform cron.unschedule('pipeline-daily-error-digest');
    raise notice '144: job pipeline-daily-error-digest removido.';
  else
    raise notice '144: job pipeline-daily-error-digest ausente — nada a fazer.';
  end if;
end $$;

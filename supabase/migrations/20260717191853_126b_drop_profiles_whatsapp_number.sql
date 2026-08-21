-- PROVENIÊNCIA (reconciliação Gate 1): esta operação foi aplicada em produção em
-- 2026-07-17T19:18:53.544Z via `POST /mcp` (user oauth:35e5b3af-531d-41a5-bd19-4b7194647cce),
-- FORA do ledger `supabase_migrations.schema_migrations` — por isso não possui `version` registrada.
-- Recuperada literalmente de `postgres_logs` de produção (log_statement='ddl').
--
-- Motivo (documentado em docs/SOLICITACOES_FUNDADORA.md, FB-011): a coluna `whatsapp_number` foi
-- criada 5m44s antes pela migration 126; constatou-se em seguida que já existiam `profiles.phone` e
-- `profiles.pref_whatsapp_reminder`, e a coluna foi removida para não duplicar (ADR-001).
-- É esta operação que explica o `attnum` 18 dropado em `public.profiles` em produção.
--
-- O `version` 20260717191853 corresponde ao timestamp real da operação e a posiciona
-- cronologicamente entre a 126 (20260717191309) e a seguinte (20260718214559).
-- ATENÇÃO: este `version` NÃO existe no ledger de produção.

alter table public.profiles drop column if exists whatsapp_number;

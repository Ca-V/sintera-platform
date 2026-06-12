# SINTERA — Banco de dados (Supabase)

Projeto de produção: `pxiglvrgxooawetboglb` (us-east-2).

## Layout

| Caminho | O que é |
|---|---|
| `migrations/` | **Fonte de verdade do schema.** As 23 migrações (001–022b) aplicadas ao banco de produção, recuperadas integralmente de `supabase_migrations.schema_migrations` em 2026-06-12. Os nomes seguem a convenção do Supabase CLI: `<timestamp>_<nome>.sql`. |
| `functions/pipeline-alert/` | Fonte da Edge Function `pipeline-alert` (v4, ativa, `verify_jwt=false`), chamada a cada 5 min via pg_cron (migração 016). Alerta por e-mail (Resend) sobre exames travados em `processing`. |
| `seed/prompt_registry_seed.sql` | Conteúdo exato dos 4 prompts do `prompt_registry` (extraction 1.0.0/1.1.0, narrative 1.0.0, qa 1.0.0) com metadados de governança. Os prompts NÃO estão em nenhuma migração — foram inseridos diretamente no banco; este seed os preserva. |
| `schema.sql` | **HISTÓRICO — não reflete o banco real.** Schema inicial de 27/05/2026 (5 tabelas). Mantido apenas como registro; o banco atual tem 18 tabelas. Use `migrations/` como referência. |

## Regras de governança

1. **Toda mudança de schema entra primeiro como arquivo em `migrations/`**, depois é aplicada ao banco (via Supabase CLI `supabase db push`, MCP `apply_migration` ou SQL Editor). Nunca o contrário.
2. Mudanças na Edge Function devem ser feitas em `functions/pipeline-alert/index.ts` e então deployadas — manter o repo como fonte.
3. Novas versões de prompt entram no `prompt_registry` via migração ou seed versionado, nunca apenas pelo dashboard.

## Estado em 2026-06-12 (resumo)

- 18 tabelas em `public`, todas com RLS.
- Prompts: `extraction 1.1.0` ativo; `narrative 1.0.0` e `qa 1.0.0` em **draft, não aprovados** — o motor de insights (resolver/assembler/determinístico/QA/narrativa) ainda não tem código na aplicação.
- Auditoria completa: `docs/AUDITORIA-ESTADO-2026-06-12.md`.

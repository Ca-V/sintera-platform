# Diagnóstico — `MIGRATIONS_FAILED` (pré-requisito do Preview da Fase 0)

Read-only (MCP Supabase). **Nada foi aplicado.** Objetivo: entender o `MIGRATIONS_FAILED` antes de qualquer Preview da Fase 0 (#117).

## 1. Estado real
| Item | Achado |
|---|---|
| Projeto Supabase | **único: `SINTERA` (produção)**, `ACTIVE_HEALTHY`, Postgres 17.6 |
| Migrações de produção | completas até **`136_medications_prescription_url`** (2026-08-17) |
| Fase 0 (#117, `137_exam_documents`) | **NÃO aplicada** em produção (é aditiva → não colide) |
| Branch Supabase `main` (integração ↔ GitHub) | **`MIGRATIONS_FAILED`**, `persistent:false`, criado em **2026-06-12** |

## 2. Interpretação
O `MIGRATIONS_FAILED` **não é falha de produção**: o projeto pai está saudável e com todas as migrações até 136
aplicadas **direto**. O objeto em falha é um **branch de Preview antigo (junho)** da integração Supabase↔GitHub —
provavelmente **órfão/desatualizado** (falhou cedo e nunca foi limpo). Ele **não afeta produção**, mas **impede confiar
num Preview automático** enquanto estiver nesse estado.

## 3. Recomendação (antes da Fase 0 no Preview)
1. **Resetar/recriar o branch de Preview** do Supabase (delete/recreate ou reset) para refletir o schema atual de produção — **ação de infra, requer sua autorização** (branch é pago).
2. Com o Preview limpo, aplicar a **Fase 0 (#117)** ali (via pipeline no merge, ou eu aplico no branch) e validar.
3. Só então rodar a **validação funcional do multi-documento** (#121/#124).

## 4. Advisors de produção (colhidos junto — NÃO bloqueiam a Fase 0; backlog de hardening)
### Segurança (2 ERROR + WARNs) — pré-existentes (máquina de biomarcadores/canonical)
- **ERROR** `security_definer_view`: views `public.current_biomarkers`, `public.current_catalog`.
- **WARN** `authenticated_security_definer_function_executable`: `canonical_route`, `replace_biomarkers`, `should_write_canonical`, `write_canonical_extraction` (executáveis pelo role `authenticated`).
- **WARN** `function_search_path_mutable` (`next_resolution_id`); `extension_in_public` (`pg_net`); `auth_leaked_password_protection` desabilitado.
- **INFO** `rls_enabled_no_policy`: `account_deletion_log`, `ai_insights_archive`, `audit_purge_log` (tabelas de log → deny-all, provavelmente intencional).

### Performance — 200 lints, todos **otimização** (não bloqueiam)
`auth_rls_initplan` (35 · `auth.uid()` reavaliado por linha), `notification_preferences` (28), `unindexed_foreign_keys` (23), `unused_index` (21), `multiple_permissive_policies` (20), 1 `no_primary_key`.

> Os itens de §4 são um **backlog de hardening de banco** (fora da homologação atual). Nada aqui foi alterado.

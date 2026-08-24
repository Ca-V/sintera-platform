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

## Migrations 137→143 — NÃO aplicar sem decidir o backfill

As migrations **137→143** (`exam_documents`, `service_requests`, identidade FHIR,
wiring de atores, `terminology_bindings`, `Consent`/`AuditEvent`, `Procedure`) estão
versionadas mas **não foram aplicadas em produção**. Isso é deliberado, e é a direção
saudável: o repositório declara a intenção antes de o banco executá-la.

**Por que ainda não foram aplicadas.** Nenhuma delas faz backfill do histórico — só a
137 tem um script, em `docs/fase0/backfill_137_exam_documents.sql`. Aplicá-las cria as
tabelas vazias sobre os dados que já existem. O projetor FHIR omite o `subject` quando
não encontra o `Patient` (`canonical/projector.ts`), e o validador não reclama de campo
ausente — então a projeção sai **válida porém sem sujeito**. Falha silenciosa.

**Hoje isso não tem consequência:** a camada FHIR não é consumida por nenhuma rota nem
página — só pelos próprios testes. O risco se materializa quando a Fase C ligar a camada
a uma funcionalidade real.

**Antes de aplicar, decidir o backfill de, no mínimo:**

| Tabela | Origem candidata |
|---|---|
| `patients` | `profiles` |
| `organizations` | emissores/laboratórios registrados em `exams` |
| `service_requests` | exames de natureza `medical_order` |
| `procedures` | procedimentos derivados de exames/eventos |

Ou assumir **explicitamente** que o modelo FHIR nasce vazio e só se popula dali para
frente — decisão legítima, desde que registrada e não descoberta depois.

Ver `docs/EXDOC-015_INTEGRACAO_ESTRUTURAL_138_143.md` e `docs/c2/` (harness, validação e
rollback de cada migration).

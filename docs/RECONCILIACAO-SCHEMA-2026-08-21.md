# Reconciliação do schema — 2026-08-21

Registro da reconciliação entre o histórico versionado (`supabase/migrations/`) e o estado
efetivamente aplicado ao projeto de produção `pxiglvrgxooawetboglb`.

Toda a investigação foi **read-only** sobre produção. Nenhuma escrita remota foi realizada.

## 1. O problema

A cadeia versionada não era reconstruível: aplicada do zero, falhava no primeiro statement da
primeira migration (`001_fix_rls_policies`, linha 11, `SQLSTATE 42P01`, `public.profiles` inexistente).
O repositório não continha o estado inicial nem 15 alterações posteriores aplicadas em produção.

## 2. Estado inicial reconstruído

O banco foi criado por **execuções manuais no SQL Editor**, não por migrations. Sete eventos entre
27/05 e 03/06; **três falharam** (rollback total, comprovado pela ausência de `NOTIFY pgrst` —
o Supabase emite `NOTIFY` em event trigger de DDL, e `NOTIFY` só é entregue no COMMIT).

| Evento | Timestamp (UTC) | Resultado |
|---|---|---|
| E1 | 2026-05-28 16:43:06 | ✅ schema inicial (profiles, exams, biomarkers, ai_insights, biological_scores, 2 funções, 2 triggers) |
| E2 / E3 | 2026-05-28 16:43:45 / 16:43:53 | ❌ rollback (`policy ... already exists`) |
| E4 | 2026-05-29 14:35:27 | ❌ rollback — os ALTERs que trazia (`timezone`, `average_cycle_length`, `menstrual_regularity`) **nunca existiram** |
| E5 | 2026-05-29 17:24:03 | ✅ bucket `exams` + policies de storage + policies `exams_*` |
| E6 | 2026-05-30 14:59:43 | ✅ `exam_id` em ai_insights/biological_scores + 6 índices + `exams_status_check` |
| E7 | 2026-06-01 19:25:01 | ✅ `daily_logs` |

`supabase/migrations/00000000000000_baseline_estado_inicial.sql` é a concatenação byte a byte de
E1+E5+E6+E7, SHA-256 `33718FF3C67A75E2A7D7B08C26249F3A96FFBCD4DA2EE79017118568A11A8A9A` (9101 bytes),
recuperada de `postgres_logs` e validada por hash contra o original.

**`supabase/schema.sql` NÃO é o baseline.** Ele contém uma seção de Storage que nunca foi executada
(as policies reais chamam-se `storage_exams_*`, não `"Usuária faz upload…"`). Mantenha-o como
documento histórico impreciso.

## 3. Migrations órfãs incorporadas

13 migrations existiam no ledger de produção e **não** no Git. Foram materializadas a partir de
`supabase_migrations.schema_migrations`, com o **`version` exato de produção** — de modo que
produção já as reconhece como aplicadas e nenhuma reaplicação ocorre. Todas validadas por md5.

`20260704154027` · `20260704161102` · `20260704185108` · `20260717165401` · `20260717191309`
`20260718214559` · `20260718224009` · `20260803223329` · `20260809185107` · `20260813154335`
`20260813164341` · `20260813181008` · `20260817133133`

Além delas, `20260717191853_126b_drop_profiles_whatsapp_number.sql` reconstitui uma operação
aplicada via `POST /mcp` **fora do ledger** — sem `version` registrada em produção.

## 4. Correções históricas

- **`121_seed_demo_function`**: o arquivo no Git foi commitado 2m16s **depois** da aplicação em
  produção, com uma string de `return` expandida que nunca foi aplicada (logs de 17/07 confirmam).
  Decisão: produção prevalece como histórico canônico. O arquivo foi alinhado.
- **11 comentários de coluna** (9 em `exams`, 2 em `health_events`): o texto no Git divergia do
  aplicado. Decisão: alinhar ao texto comprovado em produção. Nenhum SQL funcional foi alterado.

## 5. `ai_insights_archive` — legado não versionado

Objeto observado em produção, **sem procedência demonstrada** (Classe C), associado a dados
sintéticos da Fase 0. **Deliberadamente excluído do baseline reconstruído.**

- Nenhuma migration registrada a cria; não existe no Git; nenhum consumo no código.
- Janela de criação delimitada: após 2026-06-12 18:00 e antes de 2026-07-21.
- Conteúdo (13 registros sintéticos) removido em 21/07 (FB-022).
- 23 colunas, RLS habilitada, sem PK, sem índice, sem policy, 0 linhas.

**Excluir do baseline NÃO é autorização para remover de produção.** São decisões distintas: a
primeira é sobre reconstrutibilidade; a segunda é alteração de produção e exige gate próprio.

## 6. Diferenças de ambiente (não são lacuna do histórico)

`DEFAULT PRIVILEGES` divergem entre a plataforma de produção e a imagem local da CLI. Comprovado
por experimento de controle: um stack local com **zero migrations e zero tabelas** já apresenta o
default reduzido. Nenhuma migration do projeto configura default privileges.

**PRÉ-CONDIÇÃO DE AMBIENTE:** num stack Supabase local, o banco reconstruído deste repositório
**não concede DML a `authenticated`** — a aplicação não responde via PostgREST até que os default
privileges da plataforma sejam aplicados. Isso não é defeito do histórico; é configuração de ambiente.

## 7. Duas migrations do ledger sem arquivo — materializadas

Após a reconciliação do ledger (`migration repair --status applied` de 104 versions, 2026-08-21),
o ledger passou de 109 para 213 registros. Restavam **2 registros sem arquivo correspondente**:

| Version | Nome no ledger | Arquivo de mesmo efeito já no Git |
|---|---|---|
| `20260711221715` | `shield_p0_pin_search_path_omics` | `20260710240000_shield_p0_pin_search_path.sql` |
| `20260721215043` | `life_habits_goal_plan_134` | `20260721180000_134_life_habits_goal_plan.sql` |

**Decisão tomada: materialização** (commit `9cd00342`), não allowlist no check. O conteúdo foi
recuperado literalmente de `supabase_migrations.schema_migrations` e validado por **md5 contra
produção antes da escrita** — version, nome, nº de caracteres, bytes e hash conferem:

- `20260711221715_shield_p0_pin_search_path_omics.sql` — 572 chars / 577 bytes / md5 `241d67d8bc03fe3c16878fbda5709d44`
- `20260721215043_life_habits_goal_plan_134.sql` — 276 chars / 276 bytes / md5 `d1b4d9bb390b3e26d5e358574015eef5`

Ambos os `version` já constavam do ledger desde a aplicação original (11/07 e 21/07), portanto
**nenhum `repair` foi necessário e nenhuma escrita em produção foi feita**.

A redundância de efeito é deliberada e idempotente (`ALTER FUNCTION … SET search_path` e
`ADD COLUMN IF NOT EXISTS`), pelo mesmo critério adotado no par `136`. A causa é estrutural: o
`version` é carimbado no momento da aplicação, não derivado do nome do arquivo — o mesmo DDL
entrou na história sob dois nomes.

**Não há decisão pendente sobre estas duas entradas.** O check `scripts/check-migration-drift.mjs`
reporta **zero registros bloqueantes** (exit 0), sem allowlist e sem alteração da sua lógica,
verificado contra produção em container equivalente ao runner do CI.

## 8. Estado da reconciliação e pendências

**Concluído em 2026-08-21:**

- `migration repair --status applied` para **104 versions** em 5 lotes, exclusivamente pelo comando
  oficial da CLI. Ledger: **109 → 213**. Nenhum SQL das migrations foi executado — comprovado por
  impressão digital estrutural idêntica antes e depois (`80091f5b…`, 1541 objetos) e por sentinelas
  de dados.
- As 2 migrations residuais do ledger foram materializadas (seção 7).
- Anti-drift validado contra produção com o script real: **exit 0**, zero drift.

**Pendente, em frente separada:**

- **`ai_insights_archive`** — remoção de produção **não autorizada**. Excluir do baseline (seção 5)
  não é autorização para remover: são decisões distintas, e a segunda exige gate próprio.
- **`SUPABASE_DB_URL`** — o workflow `migration-drift.yml` dispara apenas em `push` para `main`,
  agendado e manual; o gatilho `pull_request` foi removido por segurança (rodaria código da PR com
  credencial de produção). Requer secret com credencial de **leitura restrita** — o check precisa
  apenas de `SELECT` em `supabase_migrations.schema_migrations`.

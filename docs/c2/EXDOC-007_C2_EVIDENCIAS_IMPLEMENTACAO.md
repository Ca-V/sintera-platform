# EXDOC-007 — C-2: Evidências de implementação da migração 138 (PostgreSQL isolado)

> **Entregável de gate.** A migração 138 foi **implementada** (arquivo criado) e **executada apenas em PostgreSQL
> isolado descartável** (pg16, socket-only, usuário `postgres`, banco `c2test`). **NÃO** aplicada em preview/produção,
> **NÃO** mesclada. **#117 não executada.** `exams`/`biomarkers`/`exam_documents` **não** alterados. Sem backfill,
> sem wiring/UI, sem popular códigos. **Data:** 2026-08-19 · **Gate de implementação: FECHADO** (aguarda aprovação).

## 1. Migração executada em PostgreSQL isolado
- **Arquivo:** `supabase/migrations/20260819120000_138_service_requests_c2.sql`.
- **Ambiente:** PostgreSQL 16.13 efêmero (cluster próprio, `listen_addresses=127.0.0.1`, socket em dir isolado, encerrado ao fim). **Nunca** tocou banco real.
- **Harness** (`docs/c2/test_harness_138.sql`): stub `auth.uid()` (lê GUC `test.uid`) + `public.exams` mínima + **2 linhas legadas** com IDs fixos (marcadores de "não perder").

## 2. Resultado dos testes (`docs/c2/validation_138.sql` + `rls_138.sql`) — TODOS OK
| Seção | Cenário | Resultado |
|---|---|---|
| A | Estrutura: 2 tabelas, RLS habilitada, **4+4 policies**, FKs, `chk_confirmation_provenance`, `unique(sr,result)`, índices | ✅ |
| B | **Bilateral**: 2 `ServiceRequest`, **mesmo `requisition_id`**, lateralidade distinta; **coding NULL** (não inventado), `code_text` preservado | ✅ |
| C | **Resultado parcial**: lado esquerdo vinculado; **direito pendente** (sem vínculo) | ✅ |
| D | **Auto-sugestão** nasce `confirmed=false` (não vira vínculo confirmado sozinha) | ✅ |
| E1 | Proveniência: vínculo **sem `linked_by` FALHA** (NOT NULL) | ✅ |
| E2 | Confirmação: `confirmed=true` **sem `confirmed_by`/`confirmed_at` FALHA** (`chk_confirmation_provenance`) | ✅ |
| F | **RLS (dois sentidos)**: usuário A vê as próprias 2 solicitações; usuário B vê **0** (role não-owner, em transação) | ✅ |

## 3. Idempotência
2ª aplicação da 138 **sem erro**: 7 objetos reportam `already exists, skipping` (tabelas/índices), enums e policies via guardas `DO`/`drop policy if exists`. **Reaplicável com segurança.**

## 4. Reversibilidade / rollback (`docs/c2/rollback_138_service_requests.sql`)
- Rollback executado após a validação: **todas** as estruturas da 138 removidas (tabelas + 3 enums).
- **Legado 100% intacto** (`docs/c2/assert_legacy_intact_138.sql`): as 2 linhas de `exams` permanecem com valores idênticos; nº de linhas inalterado; nenhum objeto da 138 remanescente. `LEGACY_INTACT_OK`.
- **Zero mutação** de tabelas existentes na DDL (só `CREATE`/`ADD`), portanto rollback = `DROP` sem perda.

## 5. DDL efetivamente aplicada × DDL proposta (PR #136) — DIFF
A DDL aplicada corresponde ao arquivo da migração. **Uma divergência intencional** em relação à spec do PR #136:

| Proposta (EXDOC-006 §4) | Executada (138) | Motivo |
|---|---|---|
| `constraint chk_no_silent_autolink check (not (link_method='auto_suggested' and confirmed=true and linked_by is null))` | **removido** | **Era vacuoso**: como `linked_by` é `NOT NULL`, `linked_by is null` nunca é verdadeiro ⇒ o CHECK jamais dispararia. |
| — | **+`confirmed_by uuid`, `confirmed_at timestamptz`** e `constraint chk_confirmation_provenance check (confirmed=false or (confirmed_by is not null and confirmed_at is not null))` | Invariante **com dentes**: nenhum vínculo é marcado `confirmed=true` sem registrar **quem** confirmou e **quando** — realiza melhor o requisito "confirmação da usuária" e "sem vínculo silencioso" (Protocolo §6). |

Nenhuma outra divergência: colunas, tipos, defaults, FKs (`source_exam_id`→exams `set null`; `service_request_id`→service_requests `cascade`; `result_exam_id`→exams `cascade`), `unique(service_request_id, result_exam_id)`, índices, RLS e as 8 policies conferem com o `pg_dump -s`.

## 6. tsc / lint / testes pertinentes
- **tsc (root):** `0 erros`.
- **Testes de regressão do Ciclo 1:** `tests/exams/FUNC-order-title.test.ts` + `tests/mobile/upload-controller.test.ts` → **32/32 verdes**.
- **Lint:** **N/A** para SQL; **nenhum arquivo `.ts/.tsx` foi tocado** ⇒ estado de lint inalterado (baseline 0 erros).

## 7. Divergências encontradas
- Apenas a do §5 (CHECK vacuoso → invariante de proveniência de confirmação). Corrigida na migração e documentada. Nenhuma outra.

## 8. Confirmação — Ciclo 1 intacto
- **Nenhum** arquivo de aplicação (`src/`, `apps/`, `packages/`) foi modificado — apenas `supabase/migrations/20260819120000_138_*.sql` (novo) e `docs/c2/*`.
- `exams`/`biomarkers`/`exam_documents` **não** alterados pela migração.
- Navegação, nomenclatura e comportamento homologados **inalterados**; testes do Ciclo 1 verdes.

## 9. Estado do gate
Implementação e validação **concluídas em ambiente isolado**. **Sem merge.** Próximo passo depende da **sua aprovação destas evidências**. Só então avançamos (ex.: aplicação em preview/staging com dados sintéticos, ou a próxima migração — ajustes menores da #117 / identidade / terminologia), sempre sob a regra de mudança (Protocolo §17) e sem tocar o baseline do Ciclo 1.

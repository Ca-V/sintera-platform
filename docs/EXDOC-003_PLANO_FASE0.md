# EXDOC-003 — Plano de execução da Fase 0 (`exam_documents` MVP)

**Status:** artefatos de migração **PRONTOS** (DDL como migração 137; backfill/rollback/validação gated). **Execução em banco real = GATE SEPARADO** (preview → validação → produção). Nada foi executado em produção.

## Artefatos
- **DDL (aditivo, estrutural):** `supabase/migrations/20260818120000_137_exam_documents_mvp_fase0.sql` — cria `exam_documents`, `exams.primary_document_id`, `exam_document_id` nas tabelas de resultado, formaliza `fulfills_order_id`/`order_status`. Idempotente; **não muta linhas**.
- **Backfill (mutação, gated):** `docs/fase0/backfill_137_exam_documents.sql` — 1 documento primário por exame + espelho + propagação. **Exclui `ab5b5816` e `0f5ec205`** (congelados).
- **Rollback:** `docs/fase0/rollback_137_exam_documents.sql`.
- **Validação (read-only):** `docs/fase0/validation_137.sql` — estrutural + integridade + espelho `file_url`→primário + congelados intocados.

## Sequência de execução (gated — cada passo antes do seguinte)
1. **Snapshot** — antes de qualquer mutação em ambiente com dados reais: `pg_dump` das tabelas afetadas (`exams`, `exam_documents`, `extraction_versions`, `biomarkers`, `clinical_results`) **ou** branch Supabase (cópia isolada).
2. **Migração em PREVIEW** — aplicar DDL 137 + backfill numa **branch Supabase** (dev/preview isolada), nunca no projeto de produção.
3. **Validação estrutural** — rodar `validation_137.sql` (blocos ESTRUTURAL/RLS) → tudo `ok = true`.
4. **Validação de integridade dos vínculos** — blocos INTEGRIDADE/VÍNCULO/PROVENIÊNCIA → todos `deve_ser_zero = 0`.
5. **Validação `file_url` → primário** — bloco FILE_URL → `deve_ser_zero = 0` (o exame continua apontando para o arquivo do documento primário).
6. **Teste de rollback** — aplicar `rollback_137...sql` na preview e reconfirmar que o schema volta ao estado anterior sem perda (as tabelas originais intactas; `fulfills_order_id`/`order_status` preservados).
7. **Homologação** — revisão arquitetural do resultado da preview (o founder/revisor aprova).
8. **Promoção a produção** — só então aplicar 137 + backfill no projeto real, **com snapshot prévio** e re-rodando a validação. **Requer autorização explícita** (gate).

## Invariantes de segurança
- **Aditivo/retrocompatível:** nenhuma coluna existente é removida ou alterada; `file_url` permanece como espelho; app atual continua funcionando (não lê `exam_documents` ainda — sem runtime nesta fase).
- **Congelados:** `ab5b5816` e `0f5ec205` **excluídos** do backfill; a validação confirma que continuam sem `exam_documents` e sem `primary_document_id`.
- **Reversível:** `rollback_137` restaura o estado anterior.
- **Escopo travado:** apenas o MVP do EXDOC-002. Sem runtime (upload/analyze/UI), sem dedup, sem timeline, sem pedido-como-documento.

## Fora desta fase (próximos incrementos, PRs próprios)
Runtime document-aware (`/analyze` por documento; upload anexando a exame existente); UI de documentos; migração de leituras para `exam_documents`; backfill dos congelados (revisado à parte). Nada disso entra aqui.

## Validação LOCAL executada (evidência)

Migração validada num Postgres **scratch** (psql 16, local — **não** produção) via `docs/fase0/local_validation_harness.sql`: DDL 137 → dados sintéticos (2 exames normais + 2 congelados) → backfill → `validation_137.sql` → teste de rollback. **Resultado: `psql exit 0`, todos os checks verdes.**

- Estrutural: `exam_documents` criada; colunas em `exams`; `exam_document_id` nas 3 tabelas de resultado; RLS habilitado. ✓
- Integridade: 0 exames (não-congelados) sem documento · 0 exames com >1 primário · **`file_url` do exame == `file_url` do primário (0 divergências)** · 0 `fulfills_order_id` órfão · 0 biomarker com `exam_document_id` inconsistente. ✓
- Congelados: **0** `exam_documents` e **0** `primary_document_id` para `ab5b5816`/`0f5ec205`. ✓
- Rollback: `exam_documents` removida, `primary_document_id` removida, **`fulfills_order_id` preservado**. ✓

Falta apenas a validação em **PREVIEW real** (branch Supabase, passos 2–6) e a **promoção a produção** (passo 8), ambas gated e com sua autorização.

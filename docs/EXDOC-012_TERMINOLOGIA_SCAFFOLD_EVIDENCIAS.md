# EXDOC-012 — Camada de terminologia (scaffold): design + evidências

> **Componente estrutural P1 · terminologia** (canônico §6; matriz P1). Migração **141**, aditiva/reversível,
> validada em **PostgreSQL isolado** (sintético). **Sem popular** — nenhum LOINC/SNOMED/GAL inventado (`coding` `[NC]`).
> **Não** produção, backfill, wiring/UI, FHIR-serialização ou RNDS. **Não** toca tabelas existentes nem o Ciclo 1.
> Independente das migrações 138/139/140. **Data:** 2026-08-19.

## 1. O que entra (141)
`terminology_bindings` — binding **conceito → coding** com **proveniência da codificação**:
- `concept_text` (conceito original, **sempre preservado**); `target_type`/`target_id` (contexto opcional, polimórfico, sem FK).
- **FHIR coding** `system`/`code`/`display`/`version` — **NULL até curadoria** (`[NC]`; não inventar).
- **Proveniência:** `coding_source` (manual_curation/catalog/imported/ai_suggested), `coded_by`, `coded_at`, `confidence`.
- `status` (unmapped/proposed/confirmed) + **invariante `chk_confirmed_coding`**: confirmado ⇒ `system`+`code`+`coded_by`+`coded_at` (não se confirma código sem fonte e sem autor).
- RLS user-scoped; índices.

Realiza o requisito do canônico §6 (conceito → code → system → display → version + proveniência) **e** o "não inventar código" do Protocolo §7/§8, com o mesmo espírito da regra anti-vínculo-silencioso da C-2.

## 2. Evidências (validação isolada — todos ✅)
| Seção | Verificação | Resultado |
|---|---|---|
| A | tabela, RLS+4 policies, `chk_confirmed_coding` | ✅ |
| B | **unmapped**: conceito preservado, `system`/`code` **NULL** (não inventado), status default | ✅ |
| C | **proposed** (ai_suggested): coding + `confidence`, **não** vira confirmado sozinho | ✅ |
| D | **negativo**: confirmar sem `system`/`code`/`coded_by`/`coded_at` **FALHA** (`chk_confirmed_coding`) | ✅ |
| E | **confirmação válida**: com fonte+código+autor+instante | ✅ |
| F | **RLS dois sentidos** | ✅ |
| — | idempotência (4 objetos `already exists`) · rollback limpo | ✅ |

Resultado: `VALIDATION_141_OK`.

## 3. Gaps / `[NC]` / divergências
- `[NC]` **URIs/ValueSets oficiais** (LOINC/SNOMED/GAL) e cardinalidades por perfil — não confirmados por fonte oficial; `coding` só entra por **curadoria** com proveniência, nunca por inferência.
- **Sem populamento** (curadoria/backfill) — gate material.
- **Divergências:** nenhuma.

## 4. Estado
Componente **concluído** em ambiente isolado; scaffold de terminologia pronto (vazio, com governança de codificação).
**Próximo componente (matriz P1 · segurança/governança):** **`Consent` + `AuditEvent`** estruturais (canônico §9; Protocolo §10) — consentimento por finalidade/destinatário e trilha de auditoria. Aditivo/reversível, isolado.
> **Gate material (NÃO autônomo):** retrofit de enum `document_type`/`order_status` (dados legados); populamento/curadoria de códigos; backfill/preview/RNDS.

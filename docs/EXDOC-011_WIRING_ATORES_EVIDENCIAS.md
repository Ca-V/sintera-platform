# EXDOC-011 — Wiring dos atores (service_requests → Patient/Practitioner/Organization): evidências

> **Componente estrutural** (fecha o P0-identidade): liga a solicitação (138) às entidades de identidade (139).
> Migração **140**, aditiva/reversível, validada em **PostgreSQL isolado** (sintético). **Não** produção, backfill,
> wiring de app/UI, FHIR-serialização ou RNDS. Só ALTERA `service_requests` (tabela da 138, sem dado legado);
> **não** toca `exams`/`profiles`/Ciclo 1. **Depende de 138 + 139.** **Data:** 2026-08-19.

## 1. O que entra (140)
`service_requests` ganha 3 colunas **NULLABLE** com FK e índice:
- `subject_patient_id → patients(id)` `on delete set null`
- `requester_practitioner_id → practitioners(id)` `on delete set null`
- `performer_organization_id → organizations(id)` `on delete set null`

Campos **interinos** (`subject_user_id`/`requester_text`/`performer_text`) **preservados como fallback** — não removidos. Nada populado.

## 2. Evidências (validação isolada — todos ✅)
Sequência aplicada: harness (auth stub + exams) → 138 → 139 → 140.
| Seção | Verificação | Resultado |
|---|---|---|
| A | 3 colunas FK nullable + **3 FKs** para 139 + índices | ✅ |
| B | Solicitação com **subject/requester/performer estruturados** resolve por join | ✅ |
| C | **Fallback**: solicitação só com campos interinos (FKs de ator NULL) permanece válida | ✅ |
| D | **`on delete set null`**: apagar o ator → FK NULL; **solicitação preservada** | ✅ |
| — | **Idempotência**: 2ª aplicação (6 objetos `already exists`) | ✅ |
| — | **Rollback**: remove só as 3 colunas/índices; `service_requests`(138) e `patients`(139) **intactos** | ✅ |

Resultado: `VALIDATION_140_OK`.

## 3. Mapeamento FHIR
`ServiceRequest.subject → Patient` · `ServiceRequest.requester → Practitioner` · `ServiceRequest.performer → Organization`. A projeção usa a FK estruturada quando presente; senão, o campo interino (texto) como fallback.

## 4. Gaps / `[NC]` / divergências
- **Sem populamento** (backfill/associação real de atores) — gate material.
- Campos interinos permanecem até a migração de dados (futuro, gated).
- `[NC]` identificadores oficiais `system` (herdado da 139).
- **Divergências:** nenhuma.

## 5. Estado
Componente **concluído** em ambiente isolado; P0-identidade completo (entidades 139 + wiring 140). Ciclo 1 intocado.
**Próximo componente (matriz):** **P1 · camada de terminologia (scaffold)** — tabela de binding `conceito → system/code/display/version` **com proveniência da codificação** (quem/quando/fonte), **sem popular** (coding permanece `[NC]` até fonte oficial). Aditivo/reversível, isolado. Prossigo sob o regime autônomo.
> **Gate material à vista (NÃO autônomo):** retrofit de enum em `document_type`/`order_status` (dados legados) e qualquer populamento/backfill/preview/RNDS.

# EXDOC-014 — Procedure (execução): design + evidências · fecha o escopo estrutural aditivo autônomo

> **Componente estrutural P2 · Procedure** (canônico §3/§14; FHIR Procedure). Migração **143**, aditiva/reversível,
> validada em **PostgreSQL isolado** (sintético). **Sem popular** (coding `[NC]`). **Não** produção, backfill,
> wiring/UI, FHIR-serialização ou RNDS. **Não** toca tabelas existentes nem o Ciclo 1. Depende de 138 + 139 (referencia
> exams). **Data:** 2026-08-19.

## 1. O que entra (143)
`procedures` (FHIR Procedure — execução efetivamente realizada), separada de solicitação e resultado:
- `based_on_service_request_id → service_requests(138)` (`Procedure.basedOn`), `status` (enum FHIR event-status).
- `code` (coding+text; coding **NULL** até curadoria — não inventar).
- `subject_user_id` (interim) + `subject_patient_id → patients(139)`; `performer_practitioner_id`/`performer_organization_id → 139`.
- `performed_start/end`; `body_site`+`laterality`; `report_exam_id → exams` (`Procedure.report` → resultado/laudo); `outcome_text`; `reason_text`.
- Todas as FKs de ator/origem com **`on delete set null`**. RLS user-scoped; índices.

## 2. Evidências (validação isolada — todos ✅)
Sequência: harness (auth + exams) → 138 → 139 → 143.
| Seção | Verificação | Resultado |
|---|---|---|
| A | tabela, RLS+4 policies, **5 FKs** (service_requests/patients/practitioners/organizations/exams) | ✅ |
| B | `Procedure.basedOn → ServiceRequest`; `report → exams`; performer estruturado; **coding NULL** | ✅ |
| C | **separação**: execução ≠ solicitação ≠ resultado (sem colisão de identidade) | ✅ |
| D | **`on delete set null`**: apagar solicitação/paciente **não** apaga a execução; FKs → NULL | ✅ |
| E | **RLS dois sentidos** | ✅ |
| — | idempotência (5 objetos `already exists`) · rollback limpo (138/139 intactos) | ✅ |

Resultado: `VALIDATION_143_OK`.

## 3. Divergências / decisões técnicas derivadas (documentadas)
- **Correção de dado de teste** (reversível): o `report_exam_id` do cenário referenciava um `exams` do harness da D-2; ajustado para um `exams` presente no `test_harness_138`. Não altera a migração; corrigido e re-testado.
- Nenhuma divergência semântica.

## 4. Gaps / `[NC]`
- Sem populamento (coding/dados) — gate material.
- `[NC]` ValueSets/coding oficiais (herdado).

## 5. Estado — FECHAMENTO DO ESCOPO ESTRUTURAL ADITIVO AUTÔNOMO
Concluído o conjunto **canônico mínimo** de entidades estruturais aditivas (todas isoladas, reversíveis, Ciclo 1 intocado):
`ServiceRequest` (138) · vínculo `basedOn` com proveniência (138) · `Patient`/`Practitioner`/`Organization` (139) · wiring de atores (140) · terminologia (141) · `Consent`/`AuditEvent` (142) · `Procedure` (143).

**A partir daqui, o que resta NÃO é escopo estrutural aditivo autônomo — são GATES materiais ou código:**
| Item remanescente | Natureza | Por que é gate |
|---|---|---|
| Retrofit de enum em `document_type`/`order_status` | schema sobre **dados legados** | CHECK pode rejeitar linhas; risco ao baseline; exige auditoria de dados |
| Ajustes de `exam_documents` (content_type, papel 'solicitacao', issuer→Organization) | schema | depende do #117 (137) — decisão de merge/ajuste |
| **Curadoria/populamento** de códigos (LOINC/SNOMED) e identificadores | dados | `[NC]` até fonte oficial; decisão de curadoria |
| Projetores FHIR (serialização ServiceRequest/DiagnosticReport/…) | **código** (Fase C) | camada de aplicação, não schema |
| **Backfill** de dados existentes | dados reais | gate material (item F do regime) |
| **Preview/Staging com dados reais**, **merge** das migrações, **RNDS/OpenCare** | infra/integração | gates materiais (itens D/E/G) |

Estes exigem **decisão/gate seu**. O regime autônomo cobre execução dentro do escopo estrutural aditivo — que está **fechado** com a 143.

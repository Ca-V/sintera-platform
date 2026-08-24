# EXDOC-018 — Fase C: especificação dos projetores FHIR (sobre o schema canônico 137→143)

> **Fase C — ESPECIFICAÇÃO READ-ONLY.** Define os **projetores SINTERA → FHIR R4** sobre o schema canônico já
> integrado em preview (137→143). **NÃO** implementa código, **NÃO** executa, **NÃO** toca produção, dados reais,
> backfill, RNDS/OpenCare nem o Ciclo 1. Entregável de gate: após sua aprovação desta spec, implementa-se em camada
> **pura** (sem DB/rede) e valida-se com **dados sintéticos** + FHIR validator estrutural.
> **Fontes governantes:** Protocolo v1.0 → modelo canônico → matriz → EXDOC-015/016/017. **Data:** 2026-08-19.

## 1. Objetivo
Projetar o modelo canônico interno (tabelas 137→143) para um **grafo FHIR R4** determinístico, **puro** e **desacoplado de transporte** — reaproveitando a arquitetura do **#119** (`src/lib/fhir/`), estendida ao schema de 1ª classe (`service_requests`, `service_request_results`, identidade, `procedures`, `exam_documents`). **Compatibilidade FHIR ≠ envio RNDS**: esta fase entrega apenas a projeção/validação estrutural.

## 2. Escopo
**ENTRA:**
- **Read-model source** (leitura pura, read-only) sobre o schema canônico → `FhirProjectionInput`.
- **Projetores** (funções puras, sem IO) → recursos FHIR R4.
- **Validação estrutural** (referências resolvem; 1 evento clínico; sem acoplamento RNDS; bilateral por `requisition`; `basedOn` por lado; coding NULL preservado).
- **Testes com dados SINTÉTICOS** + FHIR validator estrutural (sem perfis RNDS).

**NÃO ENTRA (gates próprios):** RNDS/OpenCare, Bundle de transporte, certificado/mTLS, populamento/curadoria de terminologia, backfill/dados reais, retrofit de enum legado, UI, wiring de escrita no app.

## 3. Reconciliação com #119 (não duplicar)
O #119 já tem projetor puro (`projector.ts`), mapeador (`readModelMapper.ts`), loader/contrato e `validate.ts`, porém sobre o read-model da Fase 0 (fixture; pedido via `fulfills_order_id`). **Fase C ESTENDE o #119** ao schema canônico:
- Fonte da solicitação passa a ser **`service_requests`** (1ª classe), não `fulfills_order_id`.
- Vínculo resultado→solicitação passa a ser **`service_request_results`** (canônico), projetando **`DiagnosticReport.basedOn`**.
- Atores passam a vir de **`patients`/`practitioners`/`organizations` + `party_identifiers`** (com FKs do wiring 140), não texto livre.
- **`procedures`** projeta **`Procedure`** (execução).
- `exam_documents` projeta **`DocumentReference`** (já previsto no #119).
> Decisão: **evoluir** os módulos do #119; não recriar. O #119 permanece draft até esta evolução (ou é incorporado por ela).

## 4. Mapa de projeção (schema canônico → FHIR R4)
| Origem (tabela/coluna) | Recurso/elemento FHIR | Regra |
|---|---|---|
| `service_requests` (linha) | `ServiceRequest` | 1:1 por procedimento/lado |
| `service_requests.requisition_id` | `ServiceRequest.requisition` (Identifier) | agrupa o bilateral (2 SR) |
| `service_requests.code_*` | `ServiceRequest.code` (CodeableConcept) | `text` sempre; `coding` só se `code_system`+`code_value` (senão omitir) |
| `service_requests.body_site_*`/`laterality` | `ServiceRequest.bodySite` | coding só se presente (`[NC]` → só text/laterality) |
| `service_requests.subject_patient_id`/`subject_user_id` | `ServiceRequest.subject → Patient` | FK estruturada; fallback id local |
| `service_requests.requester_practitioner_id`/`_text` | `.requester → Practitioner` | FK; fallback texto |
| `service_requests.performer_organization_id`/`_text` | `.performer → Organization` | FK; fallback texto |
| `service_requests.status`/`intent`/`authored_on` | `.status`/`.intent`/`.authoredOn` | enum já alinhado |
| `service_request_results` (confirmado) | `DiagnosticReport.basedOn → ServiceRequest` | **só vínculos `confirmed`**; sugestões não projetam |
| `exams` (resultado) | `DiagnosticReport` (evento) | 1 evento por exame-resultado |
| `biomarkers`/`clinical_results` | `Observation` | `derivedFrom → DocumentReference` via `exam_document_id` |
| `procedures` | `Procedure` | `basedOn → ServiceRequest`; `report → DiagnosticReport` (via `report_exam_id`) |
| `exam_documents` | `DocumentReference` | url/hash/type/date/proveniência |
| `patients`/`practitioners`/`organizations` | `Patient`/`Practitioner`/`Organization` | id local |
| `party_identifiers` (system não-NULL) | `Identifier` | **projeta só quando `system` presente**; `[NC]` (system NULL) → omitir coding oficial, manter id local |
| `provenance`/`extraction_versions`/`source` | `Provenance` | por documento (herdado do #119) |
| `terminology_bindings` (status='confirmed') | preenche `coding` de `code`/`bodySite` | **só bindings confirmados** com system+code; nunca inventar |

**Regra de ouro da projeção:** o que é `[NC]` no schema (coding/identificador NULL) **é omitido** no FHIR — nunca inventado. `text`/id local sempre preservados.

## 5. `fulfills_order_id` (legado) na projeção
**Não** é fonte de `basedOn`. A projeção usa **exclusivamente `service_request_results`** (canônico). `fulfills_order_id` pode, no máximo, servir de **fallback de leitura** para registros legados **sem** `service_request_results` — e, mesmo assim, sinalizado como origem legada (não confirmado). Coerente com EXDOC-016 §2.

## 6. Invariantes de validação (estrutural, sem perfis RNDS)
1. **Referências resolvem:** todo `reference` aponta a um recurso presente no grafo.
2. **1 evento clínico por exame-resultado** (`DiagnosticReport` único por `exam`).
3. **Bilateral:** 2 `ServiceRequest` com o mesmo `requisition`; cada resultado referencia o `ServiceRequest` do **seu lado** via `basedOn`.
4. **Sem acoplamento RNDS:** o grafo não contém termos/campos RNDS.
5. **Coding honesto:** nenhum `coding` sem `system`+`code` reais; `[NC]` omitido.
6. **Proveniência:** `Provenance`/`DocumentReference` por documento preservados.
7. **Separação:** solicitação (`ServiceRequest`) ≠ resultado (`DiagnosticReport`/`Observation`) ≠ execução (`Procedure`) ≠ documento (`DocumentReference`).

## 7. Plano de implementação (após aprovação — NÃO agora)
```
C-α  Read-model source (read-only) sobre 137→143 → FhirProjectionInput   [código puro; sem escrita]
C-β  Projetores FHIR (ServiceRequest/DiagnosticReport/Observation/Procedure/DocumentReference/Patient/…/Provenance)
C-γ  validate.ts estendido (invariantes §6)
C-δ  Testes com FIXTURES SINTÉTICAS (caso bilateral Doppler + multi-procedimento + parcial) + FHIR validator estrutural
C-ε  Evidências → gate
```
Cada etapa: código puro, sem DB real/rede/RNDS; `tsc`/lint/testes verdes; Ciclo 1 intocado.

## 8. Critérios de aceite (para a execução C)
- Projeta o **caso bilateral** (2 `ServiceRequest` + `requisition` + `basedOn` por lado) a partir de fixtures sintéticas do schema canônico.
- `Procedure.basedOn` e `DocumentReference` presentes; `Observation.derivedFrom` por documento.
- **Nenhum** `coding`/identificador inventado (só quando `system`+`code` reais; `[NC]` omitido).
- Invariantes §6 verdes; **sem** acoplamento RNDS.
- `tsc`/lint/testes verdes; **Ciclo 1 intocado**; camada **pura** (sem IO/rede).

## 9. Riscos / `[NC]`
- `[NC]` ValueSets/coding oficiais — projeção **omite** coding até curadoria (não inventa).
- **Divergência #119:** o mapeador do #119 usa `fulfills_order_id`; Fase C o substitui por `service_request_results` — **decisão já aprovada** (EXDOC-016 §2), não material.
- Dado real/RNDS/backfill — **fora** desta fase (gates próprios).

## 10. Gate
**Fase C é ESPECIFICAÇÃO aqui.** Após sua aprovação, implemento em camada pura e valido com dados sintéticos, retornando evidências. **Nenhuma implementação até então.** Backfill/produção/RNDS/OpenCare/retrofit permanecem gates materiais posteriores.

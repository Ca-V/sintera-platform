# FHIR-003 — Mapeador read-model → FhirProjectionInput

**Status:** IMPLEMENTADO (puro, testável). `src/lib/fhir/readModelMapper.ts` + `tests/capture-hub/func/FUNC-fhir-readmodel-mapper.test.ts`. Validado local: capture-hub **395/395**, tsc 0, eslint 0. **Não toca banco/infra/RNDS**; **não** aplica a Fase 0.

## 1. Papel
A "cola fina" entre o **schema da Fase 0 (EXDOC-002)** e o **projetor FHIR (FHIR-002)**. Recebe as **linhas** do read-model do exame (agregado + `exam_documents` + resultados + pedido) e devolve o `FhirProjectionInput`. Puro/determinístico — o projetor gera o grafo FHIR a partir daí.

```
exams + exam_documents + biomarkers/clinical_results + pedido
        │  mapReadModelToFhirInput (FHIR-003)
        ▼
   FhirProjectionInput
        │  projectToFhir (FHIR-002)
        ▼
   Bundle FHIR R4 (DiagnosticReport/Observation/DocumentReference/Provenance/ServiceRequest)
```

## 2. Regras de mapeamento
| Read-model | FhirProjectionInput / FHIR |
|---|---|
| `exams` (realizado) | `event` → `DiagnosticReport` (id do exame = id do evento) |
| `exams.display_title` | `event.code` (nomenclatura clínica) |
| `exam_documents[]` | `documents[]` → `DocumentReference` + `presentedForm` |
| `document_role` (preliminar/final) | `deriveEventStatus` → `DiagnosticReport.status` (final > preliminar > registrado) |
| `source`/`uploaded_at`/`current_extraction_version_id` | proveniência → `Provenance` (agent/recorded/entity) |
| `exams.fulfills_order_id` → pedido | `order` → `ServiceRequest` (`basedOn`) |
| `requesting_physician` (do pedido) | `Practitioner` (requester) |
| `issuer` | `Organization` (performer) |
| `biomarkers`/`clinical_results` (com `exam_document_id`) | `results[]` → `Observation` (`derivedFrom` = documento de origem) |

Identificação **local** (sem exigir CPF/CNS/CNES). `contentType` derivado da extensão do `file_url`.

## 3. Invariante central (testado)
**Um exame = UM evento clínico (`DiagnosticReport`), mesmo com N documentos.**
- 2 documentos (preliminar + final) → **1** `DiagnosticReport`, **2** `presentedForm`, **2** `DocumentReference`, **2** `Provenance`.
- Anexar o laudo **final** ao mesmo exame **não cria** um segundo evento (mesmo `id`); apenas: status preliminar→final, +1 documento/proveniência, e o **preliminar é preservado** (não-overwrite).
- Cada `Observation` mantém `derivedFrom` para o documento que a originou (rastreabilidade); cada `Provenance` carrega a `extraction_version` (entity).

## 4. Escopo / limites
- **Não** aplica a Fase 0 (só consome o schema aprovado como tipos).
- **Não** RNDS (adaptador posterior).
- **Não** amplia `exam_documents` além do MVP.
- Congelados intocados; homologação não bloqueia esta frente.

## 5. Próximo passo
Quando a **Fase 0 estiver aplicada em preview**, ligar um loader que produz `ExamReadModel` a partir das tabelas reais e validar a projeção com **dado real** (item 4 concluído em nível de dado). Até lá, a validação é por fixtures (Doppler).

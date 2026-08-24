# FHIR-004 — Loader do read-model (contrato) + validação do Bundle + casos-limite

**Status:** IMPLEMENTADO (puro, sem banco). `src/lib/fhir/examReadModelLoader.ts`, `src/lib/fhir/validate.ts`, fixtures + testes. Validado: **suíte completa 1281 verdes**, capture-hub 408/408, tsc 0, eslint 0. **Não conecta ao banco**; o binding Supabase (pós-Fase 0 em preview) é gated.

## 1. Loader (contrato desacoplado)
`loadExamReadModel(source, examId)` monta o `ExamReadModel` a partir de uma **fonte abstrata** `ExamReadModelSource` (injetada) — **não** do Supabase. Assim a orquestração é testável **sem banco** (fonte fake em memória). O pedido é resolvido via `fulfills_order_id` reusando `getExam`.

```
ExamReadModelSource (interface)  ← implementado depois por um adaptador Supabase (gated, fora deste PR)
   getExam / getDocuments / getResults / getPatient
        │  loadExamReadModel
        ▼
   ExamReadModel → mapReadModelToFhirInput → projectToFhir → Bundle FHIR
```

## 2. Validação estrutural (`validate.ts`, pura)
- `unresolvedReferences(bundle)` — referências internas (`Type/id`) que **não** resolvem para um recurso do Bundle (deve ser `[]`).
- `hasSingleClinicalEvent(bundle)` — exatamente **um** `DiagnosticReport`.
- `isRndsDecoupled(bundle)` — nenhum acoplamento RNDS embutido.
(Não é validação de PERFIL BR-Core/RNDS — apenas invariantes internos.)

## 3. Casos-limite cobertos por teste
| Caso | Resultado garantido |
|---|---|
| Exame **sem documento** | 1 evento, `status: registered`, 0 DocumentReference/Provenance |
| **Preliminar sem final** | `status: preliminary`, 1 documento |
| **Preliminar + final** | `status: final`, **2 documentos preservados** (nenhum substitui o outro) |
| **N documentos** (prelim+final+complementar) | 1 evento, 3 DocumentReference, 3 Provenance |
| **Resultado → documento correto** | `Observation.derivedFrom` aponta o documento de origem |
| **Sem identificadores opcionais** | sem Organization/Practitioner/ServiceRequest; Patient com id **local** (cai para `user_id`) |
| Contrato | 1 DiagnosticReport · status/`basedOn` corretos · documentos preservados · Provenance por documento · **referências todas consistentes** · **zero RNDS** |

## 4. Limites (mantidos)
Sem banco/infra/RNDS/Atestado; **não** aplica a Fase 0; **não** amplia `exam_documents`; congelados/homologados intocados.

## 5. Próximo (gate operacional)
Quando a **Fase 0 estiver em preview** (autorizado): implementar o adaptador Supabase de `ExamReadModelSource` (o único que falta), carregar um exame real e validar a projeção com **dado real**. Produção segue gate à parte.

# FHIR-002 — Projetor FHIR R4 da SINTERA (spec + implementação pura)

**Status:** IMPLEMENTADO (pura, testável, desacoplado de RNDS e do banco). Módulo `src/lib/fhir/projector.ts` + testes `tests/capture-hub/func/FUNC-fhir-projector.test.ts` (caso Doppler ponta a ponta). Validado local: capture-hub 389/389, tsc 0, eslint 0.
**Escopo:** a **camada de projeção** (modelo interno → grafo FHIR R4). **Não** contém RNDS (adaptador posterior — RNDS-001 §10). **Não** lê banco — a entrada é um contrato em memória.

## 1. Separação (FHIR-001, materializada)
| Conceito interno | Recurso FHIR |
|---|---|
| Evento/achado clínico (exame realizado) | `DiagnosticReport` |
| Resultados/medições | `Observation[]` (`DiagnosticReport.result`) |
| Documento/artefato (arquivo) | `DocumentReference` (+ `DiagnosticReport.presentedForm`) |
| Proveniência (por documento) | `Provenance` |
| Pedido | `ServiceRequest` (`DiagnosticReport.basedOn`) |
| Paciente/Profissional/Emissor | `Patient`/`Practitioner`/`Organization` (id **local**) |

## 2. Contrato de entrada (`FhirProjectionInput`)
Visão interna normalizada: `patient`, `order?`, `event{ status: preliminary→final }`, `documents[]{ role, url, source, extractionRef }`, `results[]{ code, valueNum/valueText, unit, bodySite, documentLocalId }`. Desacoplada do schema (mapeia-se do read-model do exame + `exam_documents` + resultados quando a Fase 0 estiver ativa).

## 3. Caso Doppler (teste ponta a ponta)
```
Bundle(collection)
 ├─ Patient (id local)              ├─ Practitioner (solicitante)      ├─ Organization (AXIAL)
 ├─ ServiceRequest  code="… — bilateral"  subject→Patient  requester→Practitioner
 ├─ DiagnosticReport  status=preliminary  basedOn→ServiceRequest  performer→Organization
 │     result→[Observation]   presentedForm→[preliminar.jpg, formal.pdf]
 ├─ Observation  valueQuantity 3.9 mm  bodySite  derivedFrom→DocumentReference(preliminar)
 ├─ DocumentReference(preliminar)  ├─ DocumentReference(formal)   (context.related→DiagnosticReport)
 └─ Provenance(preliminar)  ├─ Provenance(formal)   (agent=source; entity=extraction_version)
```
O teste prova: status preliminar→final nativo, **múltiplos `presentedForm`** (preliminar + formal), **`Provenance` por documento**, `basedOn`→`ServiceRequest`, e **ausência de qualquer acoplamento RNDS** (nenhum `rnds`/`meta.profile`; identificação local).

## 4. Decisões
- **Identificação local** (`urn:sintera:local`) — a representação FHIR **não exige** CPF/CNS/CNES; oficiais entram só no adaptador RNDS.
- **Puro/determinístico** — sem `Date.now()`, sem IO; `Provenance.recorded` vem da data do documento (ou do evento).
- **`ImagingStudy` fora** — a SINTERA tem foto/PDF do laudo (não DICOM) → `DocumentReference`.
- **Aditivo** — não altera nada existente; é uma nova camada consumível quando necessário.

## 5. Próximo passo (quando a Fase 0 estiver aplicada)
Adaptar do read-model real (exame + `exam_documents` + resultados) para `FhirProjectionInput` (mapeador fino), e então validar a projeção com dados reais. **Sem** RNDS até haver perfil federal aplicável. Congelados intocados.

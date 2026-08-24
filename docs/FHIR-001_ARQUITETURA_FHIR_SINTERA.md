# FHIR-001 — Especificação da Arquitetura FHIR da SINTERA (read-only)

**Status:** ESPECIFICAÇÃO READ-ONLY — nada implementado (sem código, schema, banco, dados). Serve de **teste arquitetural**.
**Objetivo:** (a) fixar a separação **Exame/resultado clínico × Documento/artefato × Proveniência**; (b) mapear os recursos FHIR **candidatos** (sem assumir que todos serão usados); (c) separar **FHIR R4/BR-Core genérico** de **requisitos específicos da RNDS**; (d) achar **onde o modelo atual perde informação**; (e) responder objetivamente: **`exams.file_url` (1 exame = 1 arquivo) é estruturalmente insuficiente para a projeção FHIR desejada?** → decidir se `exam_documents` (ADR-EXDOC-001 / #113) é **backlog** ou **pré-requisito**.
**Método:** mapeamento contra o modelo real da SINTERA (auditado em RNDS-001) + semântica FHIR R4, usando um **caso de teste ponta-a-ponta real: o Doppler** (`ab5b5816` pedido + `0f5ec205` laudo preliminar + futuro laudo formal). **Não** decide transporte RNDS (desacoplado — RNDS-001 §10). **Não** toca itens congelados.

---

## 1. A separação fundamental (que o FHIR já faz e a SINTERA colapsa)

FHIR separa nativamente três coisas que hoje vivem numa **única linha `exams`**:

| Conceito | Recurso(s) FHIR | Hoje na SINTERA |
|---|---|---|
| **Evento / achado clínico** ("que exame é, com que resultado") | `DiagnosticReport` + `Observation` (± `Procedure`/`ImagingStudy`) | `exams` (row) + `biomarkers`/`clinical_results` |
| **Documento / artefato** ("o arquivo que carrega a informação") | `DocumentReference` + `Binary` | `exams.file_url` (escalar) |
| **Proveniência / derivação** ("de onde veio cada fato") | `Provenance` | `understanding_report`/`PipelineAudit` + `extraction_versions` + `representation_fingerprint` |

**O colapso:** a linha `exams` **é** o evento **e** o documento **e** carrega a proveniência do único documento. FHIR exige que sejam recursos distintos com **referências** entre si.

---

## 2. Recursos FHIR candidatos (POTENCIAL — não decidido)

| Recurso FHIR | Papel | Âncora SINTERA | Genérico/BR-Core × RNDS | Confiança |
|---|---|---|---|---|
| `Patient` | sujeito | `profiles`/`exams.patient_name` | id **local** basta p/ FHIR; **CPF/CNS** só p/ RNDS | alta |
| `Practitioner` | solicitante/executor | `exams.requesting_physician` | id local p/ FHIR; **CRM/CNS** p/ RNDS | alta |
| `Organization` | emissor/estabelecimento | `exams.issuer` | id local p/ FHIR; **CNES** p/ RNDS | alta |
| `ServiceRequest` | **pedido** | `document_type=medical_order`, `fulfills_order_id` | FHIR ok; RNDS: não é doc de envio próprio | alta |
| `DiagnosticReport` | **laudo/achado do exame realizado** (âncora) | `exams` (realizado) | FHIR/BR-Core ok; RNDS imagem **inexistente** | alta |
| `Observation` | resultados/medições | `biomarkers`/`clinical_results` (`code/value/referenceRange/bodySite`) | FHIR ok | alta |
| `DocumentReference` + `Binary` | **arquivo de origem** | `exams.file_url` + `provenance/DocumentMeta` | FHIR ok (base forte) | alta |
| `Provenance` | rastreabilidade | `PipelineAudit`/`resolution_id`/`fingerprint`/`extraction_versions` | FHIR ok (base forte) | alta |
| `ImagingStudy`/`Media` | imagens DICOM | — (a SINTERA tem **foto do laudo**, não DICOM) | **provável NÃO usar** — vira `DocumentReference` | média |

Nota `ImagingStudy`: modela um **estudo DICOM** (séries/instâncias). A SINTERA hoje recebe **foto/PDF do laudo**, não DICOM → o artefato é `DocumentReference`, não `ImagingStudy`. `ImagingStudy` só entraria se houver integração PACS futura.

---

## 3. Caso de teste ponta-a-ponta: o Doppler

Projeção dos registros reais (sem inventar dado):

```
ServiceRequest  (pedido ab5b5816)
  ├─ code: Doppler colorido venoso de membro inferior (TUSS 40901483 ×2 → bilateral)
  ├─ subject → Patient
  ├─ requester → Practitioner (Lucas Rezende Gomes)
  └─ status: active/completed

DiagnosticReport  (o EXAME/laudo — UM evento clínico)
  ├─ basedOn → ServiceRequest            (vínculo pedido↔resultado)
  ├─ subject → Patient
  ├─ performer → Organization (AXIAL)
  ├─ code: Doppler venoso de membro inferior esquerdo
  ├─ status: preliminary → final          (progressão!)
  ├─ result[] → Observation[]            (diâmetros v. safena magna, fluxo/refluxo…)
  └─ presentedForm[] → DocumentReference[]  (VÁRIOS documentos)
        ├─ DocumentReference #1 → Binary  (0f5ec205: foto do laudo preliminar da médica)
        │     └─ Provenance #1 (DUE/extração do preliminar)
        └─ DocumentReference #2 → Binary  (futuro: PDF formal do laboratório)
              └─ Provenance #2 (extração do laudo formal)
```

**Três fatos do FHIR que este caso exercita — e que são exatamente o problema:**
1. **`DiagnosticReport.status`** tem os códigos `registered | partial | **preliminary** | **final** | amended | corrected …` — o FHIR **modela nativamente preliminar→final**.
2. **`DiagnosticReport.presentedForm`** é **`Attachment [0..*]`** (via `DocumentReference`) — **múltiplos documentos** para **um** laudo.
3. **`Provenance`** é **por recurso/documento** — cada documento carrega a sua.
4. **`DiagnosticReport.basedOn → ServiceRequest`** — o vínculo pedido↔resultado.

---

## 4. Onde o modelo atual PERDE informação (contra o caso Doppler)

| Necessidade FHIR (do caso real) | Modelo atual SINTERA | Perde? |
|---|---|---|
| **N documentos por 1 evento clínico** (preliminar + formal) | `exams.file_url` **escalar** (1 arquivo) | 🔴 **SIM — estruturalmente impossível** |
| **Progressão preliminar → final** do laudo | sem campo de status clínico do laudo (`order_status` é do pedido, não do laudo) | 🔴 SIM |
| **Proveniência POR documento** | `understanding_report` é **do único documento** do exame | 🔴 SIM (com 2 docs, precisa 2 proveniências) |
| **Vínculo pedido↔resultado** (`basedOn`) | `fulfills_order_id` **sem DDL** (só no DTO) | 🟠 SIM (persistência ausente) |
| Resultados como `Observation` (code/value/range/bodySite) | `biomarkers`/`clinical_results` | 🟡 mapeável (UCUM/LOINC a resolver) |
| Identificadores oficiais (CPF/CNS/CNES) | ausentes | 🟡 só bloqueia **RNDS**, não a representação FHIR local |

**Contra-hipótese testada (usar 2 linhas `exams` em vez de `exam_documents`):** modelar preliminar e formal como **duas linhas `exams`** produziria **dois `DiagnosticReport`** para **um** evento clínico — **semanticamente errado** (é UM laudo que evolui preliminar→final, ou um laudo com dois `presentedForm`). Além disso, irmãos de bundle **reusam o mesmo `file_url`**. → a projeção FHIR correta **exige** a estrutura **Exame(evento) → N Documentos**.

---

## 5. VEREDITO — `exam_documents` é pré-requisito?

**SIM. Confirmado: o modelo "1 exame = 1 arquivo" é estruturalmente insuficiente para a projeção FHIR desejada.** O caso real (Doppler preliminar + formal) exige representar **um evento clínico (`DiagnosticReport`) com múltiplos documentos (`presentedForm`/`DocumentReference`), progressão preliminar→final (`status`), proveniência por documento (`Provenance`) e vínculo ao pedido (`basedOn`)** — tudo nativo no FHIR e **irrepresentável** hoje sem colapso/erro semântico.

→ **`exam_documents` (ADR-EXDOC-001 / #113) deixa de ser backlog e passa a PRÉ-REQUISITO da camada FHIR.**

**Mas em MVP MÍNIMO** (subconjunto do #113, dirigido pela necessidade FHIR — não o modelo completo):
1. **Exame (evento) → N `exam_documents`** (arquivo + `document_role` + proveniência própria).
2. **`status` preliminar/final** do laudo (no evento ou por documento).
3. **Proveniência por documento** (extração/understanding_report por `exam_document`).
4. **Persistir o vínculo pedido↔resultado** (resolver o DDL ausente de `fulfills_order_id`/`order_status`).

Os demais aspectos do #113 (dedup/anexar-a-existente/UI/timeline) permanecem **backlog** — não são exigidos pela projeção FHIR mínima.

---

## 6. Separação FHIR/BR-Core × RNDS (reafirmada)

- A **representação FHIR/BR-Core** deste caso é **alcançável já**, com **identificadores locais** — independe da RNDS.
- **Transporte RNDS:** o Doppler é **imagem** → **sem perfil federal** (RNDS-001 §9). Logo, **Doppler → FHIR/BR-Core = possível e útil** (portabilidade, base para o futuro); **Doppler → RNDS = indisponível hoje**. A camada FHIR **não** deve embutir lógica RNDS (adaptador separado, quando/onde houver perfil).

---

## 7. Recomendação / próximo passo

1. **Promover `exam_documents` de backlog a pré-requisito** — revisar o ADR-EXDOC-001 (#113) e recortar o **MVP mínimo dirigido por FHIR** (os 4 itens do §5), deixando o resto do #113 como backlog.
2. Depois: **mapeamento semântico + terminologias/identificadores** (Observation↔LOINC/UCUM; Patient/Practitioner/Organization ids).
3. Depois: **projetor FHIR R4/BR-Core** (aditivo, sobre UCDA/provenance existentes).
4. **RNDS**: adaptador posterior, só onde houver perfil federal aplicável.

**Decisão que preciso de você:** aprovar o veredito (§5) — promover `exam_documents` (MVP mínimo) a pré-requisito da camada FHIR — antes de eu detalhar esse MVP. **Nada implementado; `0f5ec205`/`ab5b5816`/#111/#112 intocados; #113 permanece como está até sua aprovação do recorte mínimo.**

# EXDOC-002 — `exam_documents` MVP mínimo (recorte dirigido por FHIR)

**Status:** ESPECIFICAÇÃO READ-ONLY — nada implementado (sem código, schema, banco, dados). Recorte **mínimo** do ADR-EXDOC-001 (#113), promovido a **pré-requisito** da camada FHIR pelo veredito de **FHIR-001 (#115)**.
**Escopo:** apenas o **estritamente necessário** para a projeção FHIR do caso Doppler (evento clínico com documentos preliminar + formal, proveniência por documento, vínculo ao pedido). O modelo completo de #113 permanece **backlog**.
**Congelados/intocados:** `ab5b5816` (#111/#112), `0f5ec205`, #113 (visão completa), #114 (RNDS audit), #115 (FHIR spec).

---

## 0. O que este MVP resolve (e por quê)

Do FHIR-001: o modelo `1 exame = 1 arquivo` não representa `DiagnosticReport{ status: preliminary→final, presentedForm[]: N documentos, basedOn: ServiceRequest }` com `Provenance` por documento. Este MVP cobre **exatamente esses 4 pontos** — nada além.

```
EXAME / EVENTO CLÍNICO (exams — agregado)
 ├── PEDIDO (exams medical_order, vinculado por fulfills_order_id)   → ServiceRequest
 ├── DOCUMENTO 1 (laudo_preliminar)  → presentedForm[0] + Provenance
 ├── DOCUMENTO 2 (laudo_final)       → presentedForm[1] + Provenance
 └── RESULTADOS (biomarkers/clinical_results, por documento)          → Observation[]
```

---

## 1. Entidades

- **`exams`** — permanece o **agregado / evento clínico** (`DiagnosticReport`). Ganha um ponteiro para o documento primário; `file_url` vira **espelho** do primário (retrocompatível).
- **`exam_documents`** (NOVA) — cada **arquivo/artefato** do evento (`DocumentReference`/`Binary`), com identidade e proveniência próprias.

## 2. Relacionamentos

```
exams (1) ───< exam_documents (N)                 [FK exam_id, on delete cascade]
exams.primary_document_id ──> exam_documents.id   [documento primário p/ apresentação]
exam_documents (1) ───< extraction_versions/biomarkers/clinical_results  [FK exam_document_id, nullable na transição]
exams.fulfills_order_id ──> exams.id (pedido)      [vínculo pedido↔resultado — DDL a formalizar]
```

## 3. Campos indispensáveis (MÍNIMO)

### 3.1 `exam_documents`
```
id                             uuid PK
exam_id                        uuid  NOT NULL  FK → exams.id (cascade)
user_id                        uuid  NOT NULL
-- artefato
file_url                       text  NOT NULL          -- DocumentReference.content.attachment.url
document_sha256                text                     -- base de dedup (coluna só; SEM lógica de merge no MVP)
-- papel/status (MÍNIMO: distinguir preliminar × final)
document_role                  text  NOT NULL           -- 'laudo_preliminar' | 'laudo_final' | 'complementar' | 'outro'
-- proveniência POR documento (origem · quando · fonte · rastreabilidade)
source                         text  NOT NULL DEFAULT 'upload_usuario'  -- origem do documento (como entrou)
uploaded_at                    timestamptz NOT NULL DEFAULT now()       -- data/hora de inclusão do arquivo
current_extraction_version_id  uuid  FK → extraction_versions.id        -- rastreabilidade da extração deste doc
-- fatos documentais (para FHIR: date/author) — transcrição, não inferência
exam_date                      date                     -- data DESTE documento (null se ausente)
issuer                         text                     -- emissor DESTE documento
-- apresentação
is_primary                     boolean NOT NULL DEFAULT false
-- ciclo
status                         text  NOT NULL DEFAULT 'pending'  -- pending|processing|processed|error
created_at                     timestamptz NOT NULL DEFAULT now()

Índices: (exam_id), (document_sha256); UNIQUE parcial (exam_id) WHERE is_primary  -- no máx. 1 primário/exame
```
**Deliberadamente FORA do MVP:** `document_type` por-doc, `document_identity_status`, `representation_fingerprint` por-doc, `resolution_id` por-doc, `page_count`/`pdf_quality` por-doc, taxonomia completa de `document_role`. (Ficam para o modelo completo do #113, se necessários.)

### 3.2 `exams` (aditivo)
```
primary_document_id  uuid  FK → exam_documents.id     -- documento primário (apresentação/derivação)
-- file_url permanece como ESPELHO do documento primário (retrocompatível; depreciar depois)
```

### 3.3 Vínculo pedido↔resultado (formalizar o schema)
`exams.fulfills_order_id` (self-FK → `exams.id`) e `exams.order_status` **hoje não têm DDL no repo** (RNDS-001 §2; usados só no DTO/domínio). O MVP **formaliza** essas colunas por migração — pré-requisito de `DiagnosticReport.basedOn → ServiceRequest`. **Não** criar lógica nova; só sustentar formalmente o que o código já assume.

### 3.4 Tabelas de resultado (aditivo)
`extraction_versions`, `biomarkers`, `clinical_results` ganham **`exam_document_id`** (FK, **nullable** na transição), para que os resultados sejam **por documento** (Observation por `presentedForm`). Backfill aponta para o documento único existente.

## 4. Invariantes (herdadas do #113 — mantidas)

1. **Write-once por documento** — identidade/extração de cada `exam_document` imutável (só correção explícita).
2. **Sem overwrite silencioso** — documento novo **nunca** apaga resultados/identidade de outro; divergência = evento de consistência.
3. **Proveniência por documento** — todo resultado carrega `exam_document_id`.
4. **Documentos nunca são apagados** pela chegada de outro.
5. **Primário = referência de apresentação, não substituição** — demais documentos preservados e rastreáveis.
6. **Não-inferência (RDC-657)** — `exam_date`/`issuer` ausentes ⇒ `null`; não completar por contexto.

## 5. Migração / backfill (aditiva, retrocompatível — Fase 0)

1. Criar `exam_documents` (aditivo).
2. Backfill: para cada `exams`, inserir **1** `exam_document` (`is_primary=true`; `document_role` inferido: `medical_order`→(fica como pedido, ver §7) / imagem/laudo→`laudo_final` por padrão / se `0f5ec205`-like sem título→`laudo_preliminar` quando aplicável), copiando `file_url`, `document_sha256`, `uploaded_at`←`created_at`, `current_extraction_version_id`, `exam_date`, `issuer`. Setar `exams.primary_document_id`.
3. Adicionar `exam_document_id` (nullable) a `extraction_versions`/`biomarkers`/`clinical_results`; backfill → documento único.
4. **Formalizar** `exams.fulfills_order_id`/`order_status` (reconciliação de schema).
5. Manter `exams.file_url` como **espelho** do primário (nenhuma tela quebra).

**Reversível:** tudo aditivo; drop das colunas/tabela reverte sem perda. Nenhuma mudança de comportamento na Fase 0.

## 6. Impacto por área

| Área | Impacto no MVP |
|---|---|
| `exams` | +`primary_document_id`; `file_url` vira espelho; formalizar `fulfills_order_id`/`order_status` |
| `extraction_versions` | +`exam_document_id` (nullable) — versão passa a pertencer a um documento |
| `biomarkers` | +`exam_document_id` (nullable) — resultado por documento; reprocesso passa a substituir **só** os do documento |
| `clinical_results` | +`exam_document_id` (nullable) |
| Upload/`/analyze` | (implementação futura) passam a operar por documento; **fora deste doc** (só schema aqui) |
| UI | (implementação futura) — **fora do MVP** |

## 7. Vínculo com FHIR (compatibilidade futura)

| Campo MVP | Elemento FHIR |
|---|---|
| `exams` (agregado) | `DiagnosticReport` |
| `exam_documents.document_role` (preliminar/final) | `DiagnosticReport.status` (preliminary/final) |
| `exam_documents` (cada) | `DocumentReference` (`presentedForm[]`) + `Binary` |
| `exam_documents.uploaded_at`/`source`/`current_extraction_version_id` | `Provenance` (recorded/agent/entity) |
| `exams.fulfills_order_id` | `DiagnosticReport.basedOn → ServiceRequest` |
| `biomarkers`/`clinical_results` (por doc) | `Observation[]` (`result`) |
| `exams.primary_document_id` | documento de apresentação/derivação |

## 8. O que fica DELIBERADAMENTE FORA (anti-expansão de escopo)

- ❌ **Deduplicação sofisticada** — só a **coluna** `document_sha256`; **sem** lógica de merge/detecção.
- ❌ **Timeline documental completa.**
- ❌ **Regras avançadas de "anexar a exame existente"** (A/B/C/D do #113) / sugestão de vínculo.
- ❌ **UX completa** de gerenciamento de documentos.
- ❌ **Pedido como `document_role`** — pedido permanece **exame separado** vinculado por `fulfills_order_id` (§3.3).
- ❌ **Taxonomia completa** de `document_role` e demais campos per-doc do #113 (`document_type`, `identity_status`, `fingerprint`, `resolution_id` por doc).
- ❌ **Mover leituras / depreciar espelhos** (Fase 3 do #113).
- ❌ **Qualquer código de runtime** (upload/analyze/UI) — este doc é **só o modelo de dados MVP**.

## 9. Próximo gate

**Revisão arquitetural desta especificação** antes de **qualquer** PR de implementação. Só após sua aprovação: detalhar a migração Fase 0 (SQL aditivo + backfill) como primeiro PR de implementação — sem tocar `ab5b5816`/`0f5ec205`/registros congelados.

**Decisão que preciso:** aprovar este recorte MVP (entidades/campos/invariantes/migração/fora-de-escopo) como a base da Fase 0.

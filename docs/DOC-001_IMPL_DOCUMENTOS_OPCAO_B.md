# DOC-001 — Domínio "Documentos do paciente" (implementação opção B: código isolado, sem banco)

**Status:** camada de **domínio/dados IMPLEMENTADA e testada** (isolada, sem banco) + **política transversal de anexos**
(SSOT). **Não aplica schema, não conecta banco real, não faz merge em produção.** Validação funcional aguarda o Preview.
Fonte de verdade: `HOMOLOG-SPECS_C1_C2_C3.md` (DOC-001/ANEXO-001).

## 1. Decisões travadas (não reabrir)
- Domínio **único** "Documentos do paciente"; **Receita, Atestado, Relatório, Encaminhamento** = **subtipos**.
- **Separado** de `exams` e de `exam_documents`.
- **Receita associável** a 1..N contextos conforme o conteúdo: Medicamento, Suplemento, Ciclo/Contracepção, Composição corporal, Recursos de saúde, Hábitos, Monitoramento.
- **Sem** categoria genérica "Evento"; **sem** regra provisória fora da especificação.

## 2. Implementado agora (código + testes, sem schema)
### `src/lib/documents/patientDocuments.ts` (puro/isolado)
- `PatientDocumentSubtype` = receita | atestado | relatorio | encaminhamento | outro (+ rótulos, `isDocumentSubtype`).
- `DocumentTargetDomain` + `RECEITA_TARGET_DOMAINS` (os **7** contextos) + `canAssociate`/`allowedTargets` — associação **dentro da especificação** (alvo inválido é rejeitado, sem improviso).
- `buildPatientDocumentInsert` / `buildDocumentLinkInserts` — linhas de `patient_documents` e `patient_document_links` (schema DOC-001, **não aplicado**).
- `createPatientDocument` / `associateDocument` — escrita **isolada** sobre cliente mínimo. **INVARIANTE (testada):** criar/associar um Documento **nunca** toca `exams`/`exam_documents` nem muta o registro-alvo — só `patient_documents`/`patient_document_links`.

### `packages/core/src/domain/capture/attachmentPolicy.ts` (SSOT — ANEXO-001)
- Allowlist **única**: PDF, JPEG, PNG, **HEIC**, **Word** (com flags `extractable`/`needsConversion`).
- `MAX_ATTACHMENT_BYTES` — limite **único** (baseline unificado; valor definitivo = decisão técnica).
- Métodos de entrada por plataforma (`entryMethodsFor`): arquivo (ambos), câmera (Mobile), drag-and-drop (Web), múltiplos, voz.
- `ATTACHMENT_CARDINALITY`: múltiplos, mistos, inclusão posterior, **`pdfEndsFlow: false`**, **N documentos → 1 exame**.

### Testes
- `tests/documents/FUNC-patient-documents.test.ts` (10): subtipos, os **7** casos de associação da Receita, invariante documento≠exame, associação posterior.
- `tests/capture-hub/func/FUNC-attachment-policy.test.ts` (6): formatos (Word/HEIC), conversão, limite único, métodos por plataforma, PDF não encerra, N→1 exame.

## 3. Pendente (entra com a Fase própria aplicada — gate)
- **Schema DOC-001** (aditivo): `patient_documents` + `patient_document_links` (RLS por `user_id`); **não** é `exam_documents`.
- **Wiring real:** ligar `createPatientDocument`/`associateDocument` ao `SupabaseClient` + upload por arquivo.
- **UI:** captura de Documento (subtype), associação da Receita a 1..N categorias, área "Documentos".
- **Adoção transversal da política** de anexos (ANEXO-001) em **todos** os pontos (inputs/capture/limite) — rollout com B1/Fase 0.
- **Validação funcional no Preview** → só então a frente é considerada concluída.

## Escopo
Só o domínio Documentos + política de anexos (código isolado). Sem tocar banco, `exam_documents`, itens congelados, RNDS ou produção.

# EXDOC-004 — Múltiplos documentos por exame + anexação posterior (opção B: código, sem schema)

**Status:** camada de **domínio/dados** IMPLEMENTADA e testada (isolada, sem banco). **Não aplica schema no Supabase.** Preparado para entrar **junto com a Fase 0** (#117). **NÃO homologado** — a homologação real ocorre depois de #117 no Preview. Congelados/produção/RNDS/#118 intocados.

## 1. Auditoria de formatos (read-only)
| Superfície | Formatos aceitos | Comportamento atual |
|---|---|---|
| Upload de exame (`src/app/dashboard/exams/page.tsx`) | **PDF, JPG, PNG** (`ACCEPTED_MIME` :96) | `processFile` valida **1 arquivo por vez** (:291); múltiplas **imagens** são fundidas em **1 PDF** (`useDocumentBundle`); **PDF** selecionado → cria o exame de imediato; cópia reforça "**um exame por vez**" (:456) |
| Ômica (`dashboard/omics`) | CSV, JSON, PDF, imagem | fluxo próprio |
| Anexo fiscal (detalhe do exame :1123) | PDF/JPG/PNG | 2º slot (`expense_doc`) — não é documento clínico |

**Pontos onde "1 arquivo = 1 exame" e "PDF encerra o fluxo" estão fixados:** `processFile` (1 file → 1 insert de `exams`), o Document Bundle (imagens→1 PDF), e a cópia da dropzone. É onde o item 1 precisa mudar (na fase de UI/flow, com a Fase 0 ativa).

## 2. Design (exame = evento; documentos = artefatos)
```
EXAME (exams, 1 evento) ──< N exam_documents (PDF/JPG/PNG, mistos) ──< extração/proveniência própria
        │
        └── anexação posterior: novo documento entra sob o MESMO exam_id (NÃO cria novo exame/evento)
```
- **1º upload:** N arquivos (formatos mistos) → 1 exame + N `exam_documents` (não fundir em 1 PDF, não criar N exames).
- **Anexação posterior:** do detalhe do exame, adicionar documento → 1 `exam_documents` sob o `exam_id` existente.
- **Proveniência por documento:** `source`/`uploaded_at` e `current_extraction_version_id` (o `/analyze` roda por documento — fase de wiring).

## 3. Implementado agora (código + testes, sem schema)
`src/lib/exams/examDocuments.ts` (puro/isolado, testado em `FUNC-exam-documents-writer.test.ts`, 8 casos):
- `SUPPORTED_DOCUMENT_MIME` / `isSupportedDocument` / `contentTypeFromUrl` — formatos.
- `buildExamDocumentInserts(exam_id, user_id, docs[])` — N documentos com o **mesmo `exam_id`** (um evento), 1 primário.
- `createExamDocuments(client, …)` — escreve N linhas **só** em `exam_documents`.
- `attachDocumentToExam(client, …)` — **INVARIANTE (testado): anexar toca só `exam_documents`, NUNCA `exams`** → não cria novo exame/evento; o documento entra sob o `exam_id` existente.
- Escrita sobre um **cliente mínimo** (o `SupabaseClient` real entra no wiring gated).

## 4. Pendente (entra JUNTO com a Fase 0 aplicada — gate)
- **Wiring real:** ligar `createExamDocuments`/`attachDocumentToExam` ao `SupabaseClient` + upload de storage por arquivo.
- **UI:** dropzone aceitar **N arquivos mistos** sem encerrar no PDF; botão **"Adicionar documento"** no detalhe do exame; ajustar a cópia ("um exame por vez").
- **/analyze por documento** (extração/identidade por `exam_document`).
- **Retest end-to-end** no Preview com a Fase 0 aplicada → só então **homologar**.

## Escopo
Só o item 1 (múltiplos documentos + anexação posterior). Sem tocar `exam_documents` no banco, itens congelados, RNDS ou #118. Não confundir com a frente de documentos não-exame (#118).

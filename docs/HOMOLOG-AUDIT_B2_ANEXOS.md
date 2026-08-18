# Auditoria B2 — Anexos universais (todos os pontos de upload, Web + Mobile)

Auditoria transversal de **todo** ponto onde a pessoa adiciona documento/arquivo/imagem. Objetivo: verificar
formatos, formas de entrada, cardinalidade e **consistência** — e a regra de produto **N documentos → 1 exame/evento**.
Base de código (não device). Alimenta o runtime B1 (multi-documento, gated pela Fase 0).

## Achados estruturais (o que a homologação apontou, confirmado no código)

1. **"PDF = encerra o fluxo" existe e está localizado:** `src/components/ui/DocumentBundleCapture.tsx:35` (e `intake`): o **primeiro PDF** encontrado chama `onComplete` na hora e **descarta** os demais arquivos. Logo: não dá para juntar **vários PDFs**, nem **PDF + imagem** no mesmo documento. → **é o item B1**; a correção vive no runtime multi-documento.
2. **"N documentos → 1 exame" só é honrado como N imagens → 1 PDF → 1 exame** (`DocumentBundleCapture.finish` / mobile `useExamUpload.submitBundle`). **Todo outro caminho cria um exame por arquivo** (`processFile`/`startUpload`). Só a Ômica agrega de verdade (versionamento dentro de 1 painel). → **B1**.
3. **Word (.doc/.docx) não é aceito em lugar nenhum** — nenhuma allowlist (`ACCEPTED`, `DEFAULT_UPLOAD_CONSTRAINTS`, nenhum `accept=`) inclui Word. → **decisão de produto**: a plataforma vai **declarar** suporte a Word? Se sim, entra na allowlist única (item 6) + pipeline de leitura.
4. **HEIC contraditório:** constraints do Mobile **permitem** HEIC (`packages/api-client/src/exams/write.ts:42`), mas o document picker do Mobile só filtra `pdf/jpeg/png` (`documentPickerAdapter.ts:16`) — HEIC não é selecionável; na Web, HEIC é **rejeitado** (`scanImage.ts:41`). → **corrigir a contradição** (decidir suportar HEIC de ponta a ponta ou não).
5. **Dois protocolos de captura convivem** (não um só): o compartilhado (`CreateRecordMenu`+`useDocumentBundle`+`CaptureCenter` / `useExamUpload`+`useAssistedCapture`) **e** vários inputs **bespoke** que chamam `pickDocument`+`uploadExam` direto (Web Recursos/Hábitos/Medicamentos‑receita/Ômica; **todos** os anexos do Mobile: Financeiro, EventForm, Condições, Recursos, Medicamentos, Hábitos). Os bespoke não têm bundle, multipágina nem câmera. → **CAP‑001/HUB‑001 (D‑14)**: unificar o protocolo de captura.

## Inconsistências pontuais (correções menores possíveis, fora do runtime B1)
| # | Superfície | Problema | Classe |
|---|---|---|---|
| a | Web Recursos (`recursos/page.tsx:589`) | input `accept="image/*"` **bloqueia PDF**, embora o handler `onScanFile` aceite PDF | **bug de 1 linha** (alinhar o accept) |
| b | Web Hábitos (`habitos/page.tsx:371`) | input `type=file` **sem `accept`** → aceita qualquer tipo | **hardening** (aplicar allowlist padrão) |
| c | Web Medidas (`medidas/page.tsx:415`) | image‑only (sem PDF) — pode ser intencional (foto de bioimpedância) | verificar intenção |
| d | Mobile anexos (Condições/Recursos/Medicamentos/Hábitos/Financeiro/EventForm) | **arquivo apenas, sem câmera**, apesar de a câmera existir no adapter | paridade de captura (D‑14) |
| e | Limites de tamanho divergem | Web captura/exames **200MB** (`limits.ts:9`) × Mobile exames **20MB** (`write.ts:41`) × Ômica **6/8MB** | **unificar limite** (decisão) |
| f | Bucket `exams` reutilizado para tudo | medicamentos/condições/recursos/hábitos/ômica/NF sobem para `storage.from('exams')` | organização de storage (não urgente) |
| g | Avatar de perfil | **não existe upload** em nenhuma plataforma (só iniciais/`avatar_url`) | lacuna vs. "paridade total" |

## Allowlist declarada hoje (para referência)
- **Web captura/exames:** PDF, JPG, PNG (`CaptureCenter.tsx:28`).
- **Mobile exames:** PDF, JPG, JPEG, PNG, HEIC — 20MB (`write.ts:40‑44`).
- **Ômica:** + CSV, JSON — 6/8MB.

## Encaminhamento
- **Runtime B1 (gated Fase 0):** itens 1, 2, 5 (unificar protocolo/limite), e a regra **N→1 exame** — entram no runtime de `exam_documents` (código base em #121). **Testes a preparar:** PDF; imagem; misto; múltiplos; anexação posterior; preliminar+final.
- **Decisões de produto:** item 3 (declarar Word?), item 4 (HEIC de ponta a ponta?), item e (limite único), item g (avatar).
- **Correções pontuais rápidas (independentes):** a (Recursos aceitar PDF), b (Hábitos allowlist) — prontas para um micro‑lote quando a fundadora liberar (não incluídas no Ciclo 1 para não misturar com a decisão da allowlist única).

> Princípio de produto (fundadora): onde a plataforma permite adicionar documentos, o mecanismo deve ser **consistente**
> e **não pode restringir arbitrariamente** pelo 1º formato. E, no mesmo exame: **N documentos → 1 exame/evento**.

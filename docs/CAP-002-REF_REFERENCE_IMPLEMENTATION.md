# CAP-002-REF — Reference Implementation (Condições de Saúde)

> Documento **técnico** complementar ao CAP-002 (congelado). NÃO define arquitetura —
> **mostra como a arquitetura foi aplicada na prática** na primeira implementação. Serve
> de referência para as próximas migrações (Medicamentos, Exames, etc.) e para revisões
> de código. Reflete a branch `feat/condicoes-captura`; **a ser confirmado/ajustado após
> os testes com documentos reais e o merge** (Condições é a primeira implementação que
> valida o pipeline end-to-end).

---

## 0. Por que Condições é a reference implementation

É a primeira funcionalidade que exercita **todas** as camadas do CAP-002 de ponta a
ponta: captura → OCR/IA → extração → revisão humana → proveniência → roteamento →
persistência. Ajustes conceituais decorrentes dos testes reais aparecem AQUI — e sai
mais barato incorporá-los antes de construir o backbone da Inbox.

---

## 1. Mapeamento CAP-002 → Condições (código atual)

| Camada CAP-002 | Onde vive em Condições | Observações |
|---|---|---|
| **Adaptador** (Upload/Foto/Voz) | `CreateRecordMenu` na página de Condições → `onSelectMethod(method, file)` | `origin` = `uploaded_document` \| `exam_report` \| `voice` \| `manual` |
| **CapturedDocument** | `fileToPayload(file)` (downscale imagem / base64 PDF) | Ainda parcial: falta `documentId`/`checksum` formais (usa o `File` + upload direto) |
| **Pipeline / OCR-Vision** | `POST /api/vision/condition` (Claude Haiku, visão) | Transcreve o que está ESCRITO; não infere (RDC 657) |
| **Classifier** | O próprio endpoint decide `is_exam` + `kind` | Classificador **embrionário/local**, não o `ContentClassifier` compartilhado ainda |
| **Extractor** | Campos do endpoint: `name·kind·since·notes·isExam·examType·examDate` | Extractor específico do tipo "condição/laudo" |
| **Needs Review** | Formulário pré-preenchido → usuária revisa → `save()` | **Gate humano**: nada grava antes do "Salvar" |
| **Routing** | `save()` cria `exams` (se `isExam`) e/ou `health_conditions` | Regra: exame SEMPRE se laudo lab/imagem; condição só se diagnóstico afirmado |
| **Persistência / DOC-001** | Upload ao bucket `exams` → URL assinada 1 ano → `file_url` | **Embrião do DOC-001**: ainda não há repositório único; usa o bucket exams + `file_url` |
| **Proveniência** | `health_conditions.file_url` + `source` + `source_exam_id`; `<ProvenanceLine>` "Ver documento original" | Vínculo condição↔exame opcional (`source_exam_id`) |

Migrations: **098** (`health_conditions.file_url`, `kind`) + **100** (`source`, `source_exam_id`).

---

## 2. Deltas a generalizar no backbone (o que ainda NÃO é o CAP-002 final)

Estes são exatamente os componentes comuns a extrair para o **backbone da Inbox**:

1. **`CapturedDocument` formal** — hoje o fluxo passa o `File` direto; o backbone
   introduz `documentId` + `checksum` (dedup + proveniência estáveis).
2. **Fila assíncrona (Inbox)** — hoje é **síncrono** (usuária espera a IA). O backbone
   traz a fila + worker, viabilizando origens assíncronas (e-mail/WhatsApp/share).
3. **`ContentClassifier` compartilhado** — hoje a decisão `is_exam`/`kind` é local do
   endpoint; o backbone tem UM classificador de rota (exame/medicamento/condição/vacina…).
4. **Routing Engine por registry** — hoje o `save()` conhece `exams` e `health_conditions`
   diretamente; o backbone roteia por registro de destino (novo módulo = registrar).
5. **DOC-001 (repositório único)** — hoje usa o bucket `exams` + `file_url` por tabela;
   o backbone centraliza o arquivo (referência por `documentId`, um doc → vários domínios).
6. **Dedup por checksum** — ainda não existe; entra com o `CapturedDocument` formal.

Nada disso invalida a implementação de Condições: ela é a prova de que o **fluxo**
funciona; o backbone só **extrai e generaliza** o que Condições já faz na mão.

---

## 3. Como as próximas migrações usam esta referência

Quando **Medicamentos** (ou Exames, Recursos…) migrar para o Capture Hub, segue o mesmo
mapeamento: reusa `CreateRecordMenu` (adaptador) → `CapturedDocument` → pipeline →
classifier → extractor do tipo → needs review → routing → persistência (DOC-001). O
extractor é o único pedaço específico do tipo; o resto é o backbone comum.

---

## 4. Gate RI-001 — Reference Implementation Approval

Condições **só se torna oficialmente a Reference Implementation** quando TODOS os itens
abaixo forem atendidos. A partir daí ela vira o **modelo que os próximos módulos copiam**
— por isso a barra de qualidade é alta. Legenda: ✅ verificado · 🧪 pende teste real
(fundadora, preview) · ⚠️ gap a fechar.

**Funcional**
- ✅ Upload de PDF · ✅ Upload de imagem · ✅ Câmera · ✅ Manual · ✅ Voz
- 🧪 Extração funcionando (com laudos reais) · ✅ Revisão humana obrigatória (gate no form)
- ✅ Proveniência registrada (`file_url`/`source`) · ✅ Documento original acessível ("Ver documento original")
- 🧪 Exame criado quando aplicável · 🧪 Condição criada quando aplicável · 🧪 Vínculos corretos (`source_exam_id`)
- 🧪 Timeline consistente

**Arquitetural**
- ✅ Fluxo aderente ao CAP-002 · ✅ Sem bypass do Capture Hub · ✅ Sem duplicação de pipeline
- ✅ Sem lógica de negócio acoplada ao adaptador (o adaptador só entrega o documento)
- ✅ Componentes reutilizáveis identificados (ver §2 — deltas a generalizar)

**Qualidade**
- ✅ Sem erros de console · ✅ Sem overflow · ✅ Build limpa (tsc/build verdes)
- ✅ **Testes automatizados do fluxo** — suíte vitest do Capture Hub: ARCH-002 (nomenclatura), ARCH-003 (canonicalização), FUNC-001 (roteamento do salvamento duplo, espelha a matriz RI-001). A decisão de roteamento (`decideCaptureRouting`) é a MESMA usada na produção. Suite rápida (mock) + config de homologação (IA real)
- 🧪 Performance aceitável (com documentos reais)

**Governança**
- 🧪 ARG = Aprovado (após teste real) · ✅ ADL atualizado · ✅ Documentação sincronizada

**Situação atual:** o verificável está ✅. Faltam para a aprovação do RI-001: o **teste
com documentos reais** (🧪, fundadora no preview) e a **suíte de testes automatizados do
fluxo** (⚠️). Após ambos + merge, Condições passa a ser a Reference Implementation oficial.

Ver [[req_captura_documental]], `docs/CAP-002_CAPTURE_HUB.md` (arquitetura congelada),
`docs/GOVERNANCA.md` (ARG + marcos de consolidação), [[principio_rastreabilidade_documental]].

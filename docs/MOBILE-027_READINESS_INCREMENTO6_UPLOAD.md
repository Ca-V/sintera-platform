# MOBILE-027 — Readiness Review do Incremento 6 (Upload de Exames)

- **Natureza:** planejamento (Readiness). **Nenhuma implementação.** Permitido antes do aceite do Inc.5
  (MOBILE-022: "planejar ≠ iniciar"). O **gate de implementação** do Inc.6 continua sendo o **aceite do Inc.5**.
- **Objetivo:** responder "existe surpresa?" antes de codar — dependências, contratos, riscos, impacto arquitetural.

## 1. Escopo funcional
No detalhe/lista de Exames, permitir ao usuário **adicionar um exame** (documento) — complementa o Inc.5
(visualizar → adicionar). Fronteira REG-001 mantida: sobe/organiza o **documento**, não interpreta resultado.

## 2. Achados da Readiness (o que o Inc.6 exige)

| Dependência | Situação hoje | Consequência |
|---|---|---|
| **Contrato de escrita** (`createExam` / upload) | Exames é **read-only** (`listExams`/`getExam`) — não há criação | Precisa **definir contrato novo** (tipos + regra de negócio: campos mínimos, doc fiscal opcional, fronteira REG-001) |
| **Upload de arquivo (Storage)** | `storage/adapter.ts` é **key/value** (token/prefs), **não** serve para blob/arquivo | Precisa de **caminho novo** (Supabase Storage) + política de bucket/RLS |
| **Seletor nativo** (documento/imagem/câmera) | **Nenhum** instalado (`expo-document-picker`/`image-picker` ausentes) | **Nova dependência nativa** na Onda 1 (recurso de dispositivo — exceção legítima a "nenhuma função exclusiva do Mobile") |

## 3. Pontos que são ESCALONAMENTO (decisão da fundadora — mandato)
1. **Contrato público novo** (`exams.createExam` + upload): "Contrato Primeiro" — definir contrato → validar regra
   de negócio → `API_CONTRACTS` → implementar. A **regra de negócio** (o que é um upload válido; doc fiscal;
   fronteira) é decisão de produto/negócio.
2. **Dependência nativa nova** (seletor de arquivo/câmera): a Onda 1 opera com stack estável; adicionar módulo
   nativo é **decisão de arquitetura** (impacto no build EAS/config plugins). *Recurso de dispositivo → é a
   exceção esperada, mas a escolha da lib e a inclusão precisam do seu aval.*
3. **Ordem de produto:** o roadmap oficial (MOBILE-015) põe **Upload = Inc.6**. Vale confirmar se essa continua a
   prioridade, ou se algum domínio **de leitura** (ex.: visão estruturada / evolução de biomarcadores) vem antes
   — reordenar roadmap é decisão de produto sua (MOBILE-015 §Notas).

## 4. Recomendação (para quando o Inc.5 for aceito)
- **Aplicar o recipe** (MOBILE-015): `uploadMachine (reducer puro)` → `boundary` → `hooks (via apiClient)` →
  `screen` → `navigator` → `tests`.
- **Antecipável com segurança** (exceção MOBILE-015 §Governança — UI-indep, nav-indep, 100% testável): o
  **`uploadMachine`** (reducer puro: `idle→selecting→uploading→success|error`, `RETRY`/`RESET`) e os **tipos de
  contrato** de escrita — mas **só depois** de você fixar a regra de negócio (§3.1), para não criar abstração
  prematura (princípio Estabilidade Arquitetural).
- **Não antecipável** (travado até o aceite do Inc.5 + suas decisões): dep nativa, upload real ao Storage, tela.

## 5. Decisões da fundadora — **APROVADAS (2026-07-31)**
- **D-INC6-1 (Upload como Inc.6): APROVADO.** Segue como próximo incremento.
- **D-INC6-2 (dep nativa de seleção): APROVADO** — atrás de **abstração própria** (`DocumentPickerPort`):
  Android e iOS usam a mesma abstração; o app **não conhece** a lib; trocar a lib muda **só o adaptador**.
  Recomendação de lib: `expo-document-picker` + `expo-image-picker` (SDK 54). *Instalação = parte da
  implementação (pós-aceite do Inc.5).*
- **D-INC6-3 (contrato de escrita): APROVADO** com **separação clara de operações** e **fluxo em 2 etapas**:
  `Selecionar → uploadExam (Storage) → URL/id → createExam (metadados)`. Desacopla armazenamento e negócio.

### Requisitos não-funcionais fixados pela fundadora (primeiro incremento com envio de dados)
- **Validação (antes do upload):** extensão permitida · tamanho máximo · MIME type.
- **Segurança:** nome do arquivo **nunca** é identificador → gerar id próprio; validar permissões no backend;
  **RLS** aplicada. (Validação no cliente é conveniência; o **backend revalida** — defesa em profundidade.)
- **UX (estados sempre visíveis):** `Selecionando → Enviando → Processando → Concluído` · `Erro → Tentar novamente`.

### Paridade com a Web (Contrato Primeiro — verificado 31/07)
A Web já tem a regra de negócio (`src/lib/capture/processors/exam.ts`). O contrato do Inc.6 foi **alinhado a
ela** (uma única regra, sem divergência): bucket `exams`, path `${userId}/${uuid}.${ext}` (**id gerado; nome
do arquivo nunca é id** — bate com o requisito de segurança), signed URL (1 ano), insert mínimo
`{ id, user_id, type, exam_date, file_url, status:'pending' }`. O `type` = **nome do arquivo sem extensão**
(o `uploadController` deriva igual à Web). Campos ricos (título/emissor/família) são **derivados pela extração**
depois — nunca informados na criação (REG-001). Ao implementar, o Mobile replica esse fluxo via `ApiClient`
(nunca Supabase direto); a Web migra para o mesmo contrato quando descongelar (R-008).

## 6. Preparação executada (camada pura/verificável — sem implementação funcional)
Conforme a fundadora ("preparar, não implementar ainda"). Tudo abaixo é **puro + testado**; nativo/Storage/tela
ficam travados até o aceite do Inc.5.

| Artefato | Onde | Natureza |
|---|---|---|
| Contrato de escrita (`ExamsWriteApi`, `UploadResult`, `CreateExamInput`, `UploadConstraints`) | `packages/api-client/src/exams/write.ts` | tipos (contrato definido) |
| Abstração do picker (`DocumentPickerPort`, `PickedFile`) | `packages/api-client/src/device/documentPicker.ts` | interface (port) |
| Validação (`validateUpload` + `DEFAULT_UPLOAD_CONSTRAINTS`) | `packages/api-client/src/exams/validateUpload.ts` | função pura + testes |
| Máquina de estados do upload (`uploadReducer`) | `apps/mobile/.../exams/uploadMachine.ts` | reducer puro + testes |
| Orquestração do fluxo (`startUpload`/`resumeUpload`/`toCreateInput`) | `apps/mobile/.../exams/uploadController.ts` | núcleo puro do hook (portas injetadas) + testes |
| Testes | `exams-upload-validate` · `upload-machine` · `upload-controller` | 22 casos ✅ |

**Falta para a implementação do Inc.6 (pós-aceite do Inc.5) — só INTEGRAÇÃO, a lógica já existe:**
1. **Adaptador nativo** do picker (implementa `DocumentPickerPort` com `expo-document-picker`/`image-picker`) — recurso de dispositivo (gate).
2. **`uploadExam`/`createExam` concretos** no `ApiClient` (Supabase Storage: bucket user-scoped + id gerado + RLS) — infra (gate) + bump MINOR do contrato.
3. **Hook `useExamUpload`** — invólucro fino: `useReducer(uploadReducer)` + injeta as portas reais no `startUpload`/`resumeUpload` (controller pronto).
4. **Tela + navegação** — rota `ExamUpload` no `DocumentosStack` (arquivo hoje congelado pelo Inc.5) + tela consumindo o hook e os estados de UX já definidos.

> Tudo em 1–4 é **integração** dos artefatos puros já entregues; nenhuma regra de negócio nova a inventar.

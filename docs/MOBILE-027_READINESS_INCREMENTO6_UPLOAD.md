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
| Telemetria do fluxo (evento `exam_upload` + outcome) | `uploadController.ts` (porta `Telemetry` de `@sintera/core`) | reusa porta existente; **sem PII** (LGPD); à prova de falha |
| Mensagens de erro acionáveis (`acceptedFormatsHint`) | `exams/validateUpload.ts` | derivadas das restrições; FACTUAL (REG-001) |
| Apresentação (fase→texto de UX; `isUploadBusy`/`isUploadDone`) | `exams/uploadPresentation.ts` | cópia dos estados definidos pela fundadora, centralizada + testada |
| Testes | `exams-upload-validate` · `upload-machine` · `upload-controller` · `upload-presentation` | 33 casos ✅ |

**Consolidação (fundadora 31/07 — sem tocar no binário do Inc.5):**
- **Telemetria:** reusa a porta `Telemetry` de `@sintera/core` (default no-op; impl real injetada na integração). Emite um único evento `exam_upload` com `outcome` (`started`/`cancelled`/`rejected`/`succeeded`/`failed`) + `step`/`reason`/`source` — **paridade** com `CaptureTelemetryEvent` da Web. **Só códigos, nunca nome de arquivo/conteúdo/dado pessoal** (LGPD); telemetria com try/catch (nunca quebra o fluxo).
- **Mensagens de erro:** revisadas para serem **acionáveis** (dizem o que fazer) e derivadas das restrições via `acceptedFormatsHint` — sem hardcode, consistentes Web/Mobile.
- **Nomenclatura/contrato:** convenção mantida — DTOs de banco em `snake_case` (`file_url`, `exam_date`, espelham colunas), tipos de transporte em `camelCase` (`storagePath`, `mimeType`, `sizeBytes`).

**Falta para a implementação do Inc.6 (pós-aceite do Inc.5) — só INTEGRAÇÃO, a lógica já existe:**
1. **Adaptador nativo** do picker (implementa `DocumentPickerPort` com `expo-document-picker`/`image-picker`) — recurso de dispositivo (gate).
2. **`uploadExam`/`createExam` concretos** no `ApiClient` (Supabase Storage: bucket user-scoped + id gerado + RLS) — infra (gate) + bump MINOR do contrato.
3. **Hook `useExamUpload`** — invólucro fino: `useReducer(uploadReducer)` + injeta as portas reais no `startUpload`/`resumeUpload` (controller pronto).
4. **Tela + navegação** — rota `ExamUpload` no `DocumentosStack` (arquivo hoje congelado pelo Inc.5) + tela
   fina consumindo o hook + `uploadPhaseLabel`/`isUploadBusy`/`isUploadDone` (a cópia de UX já existe).

> Tudo em 1–4 é **integração** dos artefatos puros já entregues; nenhuma regra de negócio nova a inventar.
> A camada pura do Upload está **completa** (contrato · validação · reducer · orquestração · telemetria ·
> mensagens · apresentação), toda testada e alinhada à Web.

## 7. Readiness de Integração (fundadora 31/07 — re-verificação contra a Web)

### 7.1 Fluxo de integração (completo, com fronteira do Inc.6)
```
Selecionar documento (pickDocument | captureImage)   → PICK  → (CANCEL se fechar)
        ↓
Validação local (validateUpload: vazio·extensão·tamanho·MIME) → PICKED | FAILURE(reason)
        ↓
uploadExam()  → Storage (bucket 'exams', path ${userId}/${uuid}.${ext})  → UPLOADED | FAILURE(step=upload)
        ↓
Receber URL/identificador (UploadResult: storagePath, url)
        ↓
createExam()  → insert { id, user_id, type, exam_date, file_url, status:'pending' } → CREATED | FAILURE(step=create)
        ↓
Histórico de Exames (Inc.5): o exame aparece como 'pending'      ◀── FRONTEIRA DO INC.6 (termina aqui)
        ┊
        ┊ (FORA do Inc.6 — capacidade futura)
        ▼
Processamento assíncrono: POST /api/exams/{id}/analyze  → status 'processing' → 'processed' | 'error'
```
Cada transição tem **estado** (reducer `uploadMachine`), **erro** (`FAILURE` com `step`/`reason` + mensagem
acionável) e **retorno** (evento + telemetria `exam_upload`). **Sem lacunas** no trecho do Inc.6.

### 7.2 Paridade com a Web (regra ÚNICA — confirmada)
| Aspecto | Web (fonte da verdade) | Refletido no contrato Mobile? |
|---|---|---|
| **Estados do exame** | `pending → processing → processed \| error` (coluna `status`) | ✅ `ExamDTO.status` (leitura, Inc.5); Upload cria `pending` |
| **Metadados na criação** | insert mínimo `{ id, user_id, type, exam_date, file_url, status }` | ✅ `CreateExamInput { file_url, type, exam_date? }` (+ id/user_id/status na impl) |
| **`type`** | nome do arquivo sem extensão | ✅ `nameWithoutExt` no controller |
| **Nomenclatura** | colunas `snake_case`; `file_url`, `exam_date` | ✅ DTOs de banco `snake_case`; transporte `camelCase` |
| **Tratamento de falhas** | upload/insert erro → captura de erro; `status:'error'` em falha | ✅ `FAILURE(step)` + retomada; telemetria `failed` |
| **Câmera** | `<input capture="environment">` (galeria + câmera) | ✅ `DocumentPickerPort.captureImage` (paridade + D-INC6-2) |
| **Processamento pós-upload** | **server-side** `POST /api/exams/{id}/analyze`, **auto-disparado no DETALHE** em `pending`, com **polling** | ⚠️ **FORA do Inc.6** — ver 7.2.1 |

**7.2.1 Fronteira explícita — extração NÃO é Upload.** Na Web a análise dispara sozinha ao abrir o detalhe de um
exame `pending` e roda no servidor (o cliente faz polling). O **Inc.6 entrega só até o `pending`** no Histórico.
A extração no Mobile é uma **capacidade futura** (operação `analyzeExam(id)` = `POST /api/exams/{id}/analyze`) —
**não implementar agora** (não decidida; fora do escopo). **Gap conhecido e esperado:** um exame enviado pelo
Mobile fica `pending` até ser aberto na Web (que dispara a análise) ou até o incremento futuro de extração. Isso
**não é regressão** — é o limite de escopo do Inc.6. Nenhuma regra de negócio de extração foi (nem deve ser)
duplicada no Mobile.

### 7.3 Checklist operacional de integração (executar após o aceite do Inc.5 — sem código agora)
Ordem = padrão da casa (Contrato→…→Testes). Cada item nasce da tag `mobile-inc5-accepted`.
1. **Dep nativa** — adicionar `expo-document-picker` + `expo-image-picker` (SDK 54) via config plugin (CNG).
2. **Adaptador `DocumentPicker`** — implementa `DocumentPickerPort` (`pickDocument`/`captureImage`) → `PickedFile`.
3. **`uploadExam` concreto** no `ApiClient` — `storage.from('exams').upload(${userId}/${uuid}.${ext})` + `createSignedUrl` → `UploadResult`.
4. **`createExam` concreto** no `ApiClient` — insert `{ id: uuid, user_id: sessão, type, exam_date, file_url, status:'pending' }` → `{ id }`. **Bump MINOR** em `API_CONTRACTS`.
5. **Hook `useExamUpload`** — `useReducer(uploadReducer)` + injeta portas reais + `observability.telemetry` no `startUpload`/`resumeUpload`; expõe `pick/retry/reset`.
6. **Tela de Upload** — consome o hook + `uploadPhaseLabel`/`isUploadBusy`/`isUploadDone` + `acceptedFormatsHint`; DS primitives; fronteira REG-001.
7. **Navegação** — rota `ExamUpload` no `DocumentosStack` (+ tipo em `types.ts`) e ponto de entrada na lista.
8. **Testes de integração** — boundary (já cobre a pasta) + fluxo do hook; `exams-boundary` continua verde.
9. **Typecheck · suíte · CI · Build EAS (preview)**.
10. **Homologação** (Android) — roteiro: enviar PDF e imagem; validações; falhas (rede/401/500); cancelar; exame aparece `pending`; **sem regressão** Inc.1–5. Depois: evidências → tag `mobile-inc6-accepted` → baseline.

### 7.4 Revisão de consistência (auditoria — resultado)
- **Sem duplicação Web↔Mobile:** a regra de upload vive no contrato compartilhado; o Mobile consome via
  `apiClient`. *(A Web ainda tem a regra inline em 2 lugares — `capture/processors/exam.ts` e `exams/page.tsx` —
  dívida pré-existente da Web, R-008; o Inc.6 não a agrava nem duplica no Mobile.)*
- **Nomenclatura consistente:** `snake_case` (colunas) × `camelCase` (transporte) — documentado.
- **Regra de negócio única:** validação em `validateUpload`; fluxo em `uploadController`; contrato em `write.ts`.
  Nenhuma regra espalhada.
- **Toda abstração tem consumidor no Inc.6:** `DocumentPickerPort`(+`captureImage`)→adaptador; `validateUpload`/
  `constraints`→controller; `uploadMachine`/`uploadController`→hook; `uploadPresentation`/`acceptedFormatsHint`→
  tela; telemetria→hook. **Nada órfão → nada a simplificar** nesta revisão.

**Conclusão:** a integração do Inc.6 é **curta, previsível e aderente à Web** — só os 10 itens de 7.3, sem novas
decisões de arquitetura.

## 8. Revisão de segurança do Upload (verificada no servidor — 2026-07-31)
Primeiro incremento com envio de dados → revisão específica **antes da homologação**. Servidor confirmado por
consulta read-only (não presumido).

| Item | Situação | Evidência |
|---|---|---|
| MIME validado no **cliente** | ✅ | `validateUpload` (extensão + MIME + tamanho + vazio) |
| Extensão validada | ✅ | `validateUpload` |
| Tamanho validado (cliente) | ✅ | `DEFAULT_UPLOAD_CONSTRAINTS.maxBytes` (20 MB) |
| **Bucket privado** | ✅ | `storage.buckets.exams.public = false` |
| **RLS validando owner (Storage)** | ✅ | policies `storage_exams_{insert,select,delete}`: `auth.uid() = folder[1]` — só a própria pasta |
| **RLS validando owner (tabela)** | ✅ | policies `exams_{insert,select,update}`: `auth.uid() = user_id` |
| Nome do arquivo nunca é id | ✅ | path `${userId}/<id-gerado>.<ext>` (`upload.ts`) |
| UUID/equivalente | ✅ | id do arquivo gerado; `exams.id = gen_random_uuid()` (default) |
| Signed URL | ✅ | `createSignedUrl` (bucket privado) |
| Caminhos internos fora dos logs | ✅ | telemetria não carrega `storagePath`; sem `console.log` de path |
| Sem PII na telemetria | ✅ | só códigos (`outcome`/`step`/`reason`/`source`) |
| **MIME validado no servidor** | ⚠️ **NÃO** | `storage.buckets.exams.allowed_mime_types = null` |
| **Tamanho validado no servidor** | ⚠️ **NÃO** | `storage.buckets.exams.file_size_limit = null` |

**8.1 Achados (⚠️) — defesa em profundidade, ESCALONADOS (não aplicar sozinho).** O bucket não restringe MIME
nem tamanho no servidor — a validação é só no cliente. Impacto **limitado**: a RLS confina cada usuário à
**própria pasta** (não afeta terceiros), e é a **mesma postura da Web** hoje (bucket sem limites) — o Inc.6 **não
introduz** o gap. Como o bucket é **infra compartilhada Web+Mobile**, endurecê-lo é **decisão de escalonamento**
(afeta as duas plataformas). **Recomendação:** migration curta setando `allowed_mime_types` (pdf/jpeg/png/heic) e
`file_size_limit` (~20 MB) no bucket `exams` — aplico **se aprovado**. **Não bloqueia a homologação** do Inc.6.

## 9. Estado do Inc.6 (classificação precisa — fundadora 31/07)
- **Camada pura:** ✅ **Verificada** (contrato · validação · reducer · orquestração · telemetria · apresentação;
  unitários + **teste de integração** com mocks + reducer real).
- **Integração:** 🔧 **Implementada** (adaptador nativo · uploadExam/createExam · hook · tela · navegação;
  typecheck + boundary verdes). **Ainda NÃO verificada em runtime** (picker nativo · `fetch(file://)` no Android ·
  Storage/RLS · permissão de câmera).
- **Homologação:** ⏳ **Pendente** (build `d9858c74`; roteiro [MOBILE-029](MOBILE-029_ROTEIRO_HOMOLOGACAO_INCREMENTO6.md)).

# ADR-EXDOC-001 — Modelo Multi-Documento por Exame (`exam_documents`)

**Status:** **APROVADO CONCEITUALMENTE (regras congeladas)** — implementação NÃO iniciada. Próximo PR = exclusivamente a **Fase 0** (migração aditiva + backfill).
**Escopo:** evolução estrutural transversal. Muda a unidade de modelagem de **Exame = documento** para **Exame = agregado clínico (episódio) → 1:N Documentos → 1:N extrações/evidências/resultados**.
**Fora de escopo nesta etapa:** correção do `0f5ec205` (extração/visão da etiqueta — trilha própria, posterior). Nenhuma alteração em `ab5b5816` (H-10 pedido, fechado e congelado).

---

## 0. Regras fundamentais (aprovadas — CONGELADAS)

Princípio: **Um exame é um agregado clínico (episódio) que pode possuir múltiplos documentos relacionados ao longo do tempo. Cada documento é uma entidade independente, preservada e rastreável. A adição de um novo documento NUNCA sobrescreve ou elimina documentos anteriores.**

1. **1 exame → N documentos.**
2. **Cada documento tem identidade própria** (arquivo, papel, tipo, data, emissor, solicitante, extração, evidências, proveniência).
3. **Documentos anteriores nunca são sobrescritos** nem eliminados pela chegada de outro.
4. **Laudo preliminar e laudo final coexistem** (não são substitutos um do outro).
5. **Pedido permanece conceitualmente separado** de resultado/laudo no MVP.
6. **Documento primário é uma REFERÊNCIA de derivação/apresentação, não uma substituição** dos demais — os outros documentos continuam válidos e rastreáveis.
7. **Dados clínicos derivados mantêm a proveniência do documento de origem** (`exam_document_id`).
8. **O nome clínico do exame é separado de data, médico e emissor** (nomenclatura ≠ metadados).
9. `0f5ec205` continua **fora** desta implementação; `ab5b5816` continua **congelado**.
10. **A arquitetura de navegação homologada permanece estável.** Multi-documento é **evolução de capacidade do módulo de exames/documentos** — **não** motivo para reabrir a arquitetura da sidebar/IA. A mudança ocorre **dentro dos módulos**, como evolução funcional.

### 0.1 Unidade clínica do agregado — o que significa "mesmo exame"

O agregado `exams` é o **episódio/evento clínico** (o procedimento realizado), **não** um arquivo. Um mesmo episódio pode reunir:

```
EXAME / EVENTO CLÍNICO  (ex.: Doppler colorido venoso de membro inferior)
        ├── Pedido                     (o que foi solicitado)
        ├── Documento preliminar       (informação/laudo manual da médica no dia)
        ├── Laudo definitivo           (PDF oficial do laboratório, depois)
        ├── Imagens                    (complementares)
        └── Documentos complementares  (correções/adendos)
```

Todos pertencem ao **mesmo episódio**, mas **não** são o mesmo documento. Esta é a unidade de modelagem — mais importante do que "transformar `file_url` em lista". A regra de **quando** um documento novo pertence a um episódio existente (vs. cria um novo) está em §13 (evidência; nunca auto-merge silencioso).

---

## 1. Problema e decisão

Hoje **1 exame = 1 arquivo** (`exams.file_url` escalar). Não há entidade de documento. `extraction_versions` versiona **re-análises do mesmo documento**, não múltiplos documentos. Portanto, "permitir vários `file_url`" **não** resolve — cada documento precisa de tipo, papel, data, emissor, solicitante, identidade, extração, resultados e proveniência próprios.

**Decisão:** introduzir a entidade **`exam_documents`** (Direção A). O `exams` passa a ser o **agregado clínico** (o evento/procedimento); cada arquivo vira um **`exam_document`** com identidade e extração próprias. A identidade **exibida** do exame é **derivada de forma governada** a partir de um **documento primário**, nunca por sobrescrita silenciosa.

Caso motivador (genérico, não específico do Doppler):
```
EXAME: Doppler colorido venoso de membro inferior — esquerdo
 ├── Documento 1  papel=laudo_preliminar  origem=foto do laudo manual da médica
 └── Documento 2  papel=laudo_final        origem=PDF oficial do laboratório (posterior)
```
Os dois coexistem; o Documento 2 **não apaga** o Documento 1 nem sobrescreve seus resultados/identidade.

---

## 2. Invariantes (não-negociáveis)

1. **Identidade documental write-once POR DOCUMENTO.** A identidade de cada `exam_document` é fixada na 1ª extração e imutável (só correção explícita muda). A identidade **do exame** (agregado) é uma **escolha governada e explicável**, nunca overwrite silencioso.
2. **Sem overwrite automático (Reprodutibilidade).** Um documento posterior **nunca** substitui em silêncio os resultados ou a identidade de um anterior. Divergência gera **evento de consistência**, não substituição.
3. **Preservação de incerteza (H-09).** Documento com leitura falha/indeterminada permanece indeterminado; um documento confiável não "lava" um incerto, nem vice-versa. Cada documento preserva sua própria incerteza.
4. **Rastreabilidade / auditoria append-only.** Todo fato (biomarcador, resultado, data, nome, lateralidade) carrega a **proveniência do documento** (`exam_document_id`) que o originou.
5. **Não-inferência (RDC-657).** Data, solicitante, emissor ausentes na evidência → `null`/indeterminado; **não** completar por contexto. Não fundir lateralidade de documentos distintos sem evidência (ex.: não inferir "bilateral" no laudo esquerdo só porque o pedido era bilateral).
6. **Sem auto-merge silencioso.** Anexar a um exame existente exige evidência; sem evidência, **cria novo exame** ou **sugere vínculo** — nunca funde automaticamente. (Preserva o princípio já presente em `duplicates.ts`.)
7. **Preservação de documentos.** Nenhum documento é apagado pela chegada de outro.

---

## 3. Modelo de dados proposto

### 3.1 Nova tabela `exam_documents`

```
exam_documents
  id                              uuid  PK
  exam_id                         uuid  FK → exams.id  (on delete cascade)
  user_id                         uuid  FK → auth.users
  -- origem/arquivo
  file_url                        text  NOT NULL   -- storage object (bucket exams)
  storage_path                    text             -- caminho canônico (opcional; hoje só a URL assinada é guardada)
  document_sha256                 text             -- dedup por bytes do documento
  page_count                      int
  pdf_quality                     text
  -- classificação do documento
  document_type                   text             -- gênero/mídia: imaging|laboratory|medical_order|... (por documento)
  document_role                   text  NOT NULL    -- papel: pedido|laudo_preliminar|laudo_final|imagem|complementar|outro
  -- fatos documentais (por documento, transcrição — não inferidos)
  exam_date                       date             -- data DESTE documento (realização/emissão conforme o doc)
  issuer                          text             -- emissor/laboratório DESTE documento
  requesting_physician            text             -- solicitante DESTE documento
  -- identidade + extração (por documento)
  document_identity_status        text             -- draft|validated|locked (write-once por documento)
  current_extraction_version_id   uuid  FK → extraction_versions.id
  understanding_report            jsonb            -- Pipeline Audit DESTE documento (DUE/decisionLog/lateralidade)
  resolution_id                   text
  representation_fingerprint      text             -- assinatura da representação DESTE documento
  -- papel de apresentação
  is_primary                      boolean NOT NULL DEFAULT false  -- documento primário do exame (derivado/governado)
  -- ciclo
  status                          text  NOT NULL DEFAULT 'pending'  -- pending|processing|processed|error
  uploaded_at                     timestamptz DEFAULT now()  -- data de INCLUSÃO do arquivo no exame (≠ exam_date do documento)
  created_at                      timestamptz DEFAULT now()

  Índices: (exam_id), (exam_id, is_primary), (document_sha256), (user_id)
  Regra: no máximo 1 is_primary=true por exam_id (índice parcial único).
```

### 3.2 O que **permanece** em `exams` (agregado / DERIVADO) vs o que **passa** para `exam_documents`

| Campo | Onde fica | Observação |
|---|---|---|
| `display_title` | **exams** (DERIVADO) | nomenclatura clínica do exame, derivada do documento primário + referências |
| `exam_date` | **exams** (DERIVADO) | data de realização do exame, derivada do documento primário; `null` se sem evidência |
| `issuer` | **exams** (DERIVADO) | emissor do documento primário |
| `requesting_physician` | **exams** (DERIVADO) | solicitante (do primário ou do pedido vinculado) |
| `document_type` | **exams** (agregado) | gênero do exame (ex.: imaging); para pedido puro = medical_order |
| `clinical_family` / `clinical_type` | **exams** | identidade clínica agregada |
| lateralidade (no `display_title`) | **exams** (DERIVADA) | consolidada a partir da evidência do documento primário (não fundida entre docs sem evidência) |
| `fulfills_order_id` / `order_status` | **exams** | vínculo pedido↔exame permanece no nível do exame (ver §12) |
| `patient_name` | **exams** | identidade do paciente (validação de titularidade) |
| `primary_document_id` | **exams** (NOVO) | ponteiro → `exam_documents.id` primário |
| `file_url` | **exams** (ESPELHO transitório) | espelha o `file_url` do documento primário durante a migração (§4); depreciado depois |
| `file_url` real, `document_sha256`, `page_count`, `pdf_quality` | **exam_documents** | por documento |
| `document_role`, per-doc `document_type/exam_date/issuer/requesting_physician` | **exam_documents** | por documento |
| `current_extraction_version_id`, `understanding_report`, `resolution_id`, `representation_fingerprint`, `document_identity_status` | **exam_documents** | identidade/extração por documento (espelho transitório em `exams` para o primário) |

### 3.3 Dimensão de documento nas tabelas de resultado

Adicionar **`exam_document_id`** (FK, nullable durante transição) a:
- `extraction_versions` — versões passam a pertencer a um **documento** (unique `(exam_document_id, version_number)`), não ao exame.
- `biomarkers` — já tem `extraction_version_id`; a versão carrega o documento. Adicionar `exam_document_id` denormalizado para consulta direta.
- `clinical_results` — adicionar `exam_document_id` (hoje só tem `exam_id`).
- `body_metrics` — adicionar `exam_document_id` (opcional; hoje `exam_id` nullable).
- `ai_processing_log` — adicionar `exam_document_id` (por chamada, por documento).

`current_biomarkers` (VIEW) passa a considerar o documento: por padrão, os biomarcadores do **documento primário** (para compatibilidade de exibição), com opção de união por exame quando a UI mostrar "todos os documentos".

### 3.4 Diagrama alvo

```
                 fulfills_order_id (1 pedido → N exames)         primary_document_id
pedido (exams) ──────────────────────────────────▶ exames ─────────────────────────┐
                                                     │ (agregado clínico)           │
                                                     │ display_title, exam_date,     │
                                                     │ issuer, document_type,        │
                                                     │ clinical_*, order_*           │
                                                     │ 1                             ▼
                                                     └── N ── exam_documents ◀── (primário)
                                                                    │ file_url, role, sha256,
                                                                    │ per-doc date/issuer/solicitante,
                                                                    │ identidade + fingerprint próprios
                                                                    │ 1
                                     ┌──────────────────────────────┼─────────────────────────────┐
                              extraction_versions (por doc)   clinical_results (por doc)     ai_processing_log (por doc)
                                     │ 1→N
                              biomarkers (por versão/doc)
                              current_biomarkers = VIEW por documento primário (default)
```

---

## 4. Estratégia de migração retrocompatível (crítico — fase de homologação)

**Aditiva e faseada; nenhuma tela quebra em nenhum passo.**

**Pré-requisito — reconciliação de schema:** a investigação encontrou que **não há migração no repo** criando `exams.order_status` nem `exams.fulfills_order_id` (colunas usadas no código, DDL ausente; `types.generated.ts` defasado). **Antes de qualquer migração nova**, reconciliar o schema real do banco com as migrações do repo e regenerar os tipos.

- **Fase 0 — schema aditivo + backfill (sem mudança de comportamento):**
  1. Criar `exam_documents` (aditivo).
  2. Backfill: para cada `exams` existente, inserir **1** `exam_document` (`is_primary=true`), copiando `file_url`, `document_sha256`, `page_count`, `pdf_quality`, `document_type`, `exam_date`, `issuer`, `requesting_physician`, `current_extraction_version_id`, `understanding_report`, `resolution_id`, `representation_fingerprint`; `document_role` inferido de `document_type` (`medical_order`→`pedido`; `imaging`→`imagem`/`laudo_final` conforme evidência; default `laudo_final`). Setar `exams.primary_document_id`.
  3. Adicionar `exam_document_id` (nullable) a `extraction_versions`/`biomarkers`/`clinical_results`/`body_metrics`/`ai_processing_log`; backfill apontando para o único documento.
  4. Manter `exams.file_url` e demais colunas espelhadas como **espelho do primário** (leituras atuais seguem funcionando).
- **Fase 1 — escrita document-aware (dual-write):** novos uploads e reanálises gravam em `exam_documents` **e** espelham no `exams` (primário). `/analyze` passa a operar por documento.
- **Fase 2 — capacidade de anexar documento** + re-derivação governada da identidade do exame + UI de detalhe com lista de documentos.
- **Fase 3 — mover leituras** (read model/DTO/telas) para `exam_documents`; **depreciar** as colunas espelhadas em `exams` (marcar, não remover de imediato).

**Rollback por fase:** cada fase é isolada e reversível; a Fase 0 é puramente aditiva (drop das colunas/tabela nova reverte sem perda).

---

## 5. Upload / criação (Web e Mobile)

Hoje há **3 cópias** do insert 1:1 (`page.tsx:296-306`, `processors/exam.ts:16-24`, Mobile `create.ts:22-28`) e **nenhum** caminho anexa arquivo a exame existente.

- Introduzir um contrato compartilhado **`createExamDocument({ exam_id?, file_url, role })`**:
  - `exam_id` ausente → cria `exams` (agregado) **+** primeiro `exam_document` (`is_primary=true`).
  - `exam_id` presente → cria `exam_document` sob o exame existente (NOVA capacidade).
- As 3 cópias passam a chamar esse contrato (Web inline, capture-hub, Mobile). O "achatar múltiplas imagens em 1 PDF" (Document Bundle) permanece válido **dentro de um documento**.
- H-12 (tabs "Pedido" vs "Exame realizado") permanece como filtro de apresentação; o `document_role` inicial pode ser sugerido pela tab.

---

## 6. Análise (`/analyze`) — document-scoped

- `/analyze` passa a operar **por documento**: `POST /api/exams/[id]/documents/[documentId]/analyze` (ou parâmetro de documento). Baixa o `file_url` **do documento**, roda DUE/extração/identidade **do documento** (write-once **por documento**).
- **Certificação keyed por documento:** `isRepresentationCertified` passa a considerar `(document.status, document.identity_established)` — um documento novo **nunca** é bloqueado porque o exame já está `processed`.
- Após analisar um documento, **re-derivar a identidade do exame** por regra governada (§9), **sem destruir** documentos/resultados anteriores; divergência → **evento de consistência** registrado.
- Preserva o invariante H-09 **por documento** (falha/indeterminado não promove).

---

## 7. Identidade documental

- **Por documento:** write-once/imutável, como hoje, porém escopada ao `exam_document` (`document_identity_status` draft/validated/locked no documento).
- **Do exame (agregado):** derivada do **documento primário** (§9). É uma decisão do pipeline/orquestração, auditável, e só muda por regra ou correção explícita — nunca overwrite silencioso pela chegada de outro documento.

---

## 8. Nomeação (`display_title`) — regra de nomenclatura

- `display_title` = **nomenclatura clínica/científica do exame**, derivada da **evidência documental + referências** (catálogo/Terminology). **Não** concatenar data/médico/emissor no nome.
- Data (`exam_date`), solicitante (`requesting_physician`), emissor (`issuer`) e papel (`document_role`) são **campos estruturados**, exibidos **separadamente** na UI.
  - ✅ `display_title = "Doppler colorido venoso de membro inferior — esquerdo"` + campos estruturados.
  - ❌ `"Doppler... — 17/08/2026 — Dr. X — Lab Y"`.
- Reusa `deriveDisplayTitle` / `resolveClinicalMapping` / `resolveOrderNaming` (já existentes) sobre a identidade do documento primário.

**Mapa de campos (nome clínico separado dos metadados):**

| Informação | Campo | Nível |
|---|---|---|
| Nome clínico | `display_title` | exame (derivado) |
| Data do exame | `exam_date` | exame (derivado) / documento |
| Solicitante | `requesting_physician` | exame (derivado) / documento |
| Emissor/laboratório | `issuer` | exame (derivado) / documento |
| Tipo/papel do documento | `document_role` | documento |
| Data de inclusão do arquivo | `uploaded_at` | documento |
| Arquivo | `file_url` | documento |
| Documento | `exam_document` (id) | documento |

Ex.: `display_title = "Doppler colorido venoso de membro inferior — bilateral"` — e **nunca** `"Doppler… — bilateral • Unimed • Dr. X • 17/08/2026"`. Os metadados existem como campos e são exibidos **separadamente**.

---

## 9. Documento primário (referência de apresentação — NÃO substituição)

**Princípio (congelado):** o documento primário é uma **referência de derivação/apresentação**, **não** uma substituição dos demais. Mesmo quando o laudo final chega: o preliminar permanece, a imagem permanece, e o laudo final passa a ser o **documento de maior autoridade quando aplicável** — a plataforma mantém a **proveniência de cada informação** (rastreabilidade clínica).

- `exams.primary_document_id`. Regra de precedência **governada e explicável**:
  1. maior precedência de papel entre documentos **processados**: `laudo_final` > `laudo_preliminar` > `imagem` > `complementar` > `pedido`;
  2. desempate por `exam_date` (mais recente de realização) e depois `uploaded_at`.
- A regra é **explícita e sobreponível por ação do usuário** (nunca troca silenciosa). A chegada de um `laudo_final` torna-o primário **para exibição/derivação**; **todos** os demais documentos permanecem preservados, válidos e rastreáveis.

---

## 10. Lateralidade

- `consolidateLaterality` permanece **por documento** (sobre as observações daquele documento) — preserva o invariante "não fundir lados de documentos distintos sem evidência".
- Lateralidade **do exame** = a do documento primário. **Não** herda "bilateral" do pedido para um laudo que só evidencia o lado esquerdo.

---

## 11. `extraction_versions` / `biomarkers` / `clinical_results` — sem sobrescrita entre documentos

- Versões e resultados passam a ser **por documento** (via `exam_document_id`). Reprocessar o Documento B substitui **apenas** os resultados de B (`replace_biomarkers`/deletes passam a filtrar por `exam_document_id`, não só `exam_id`).
- `current_extraction_version_id` migra para o documento; `exams` mantém (transitório) o ponteiro do primário para exibição compatível.
- Exibição de resultados: por padrão, do documento primário; com opção "ver por documento" (união rastreável por proveniência).

---

## 12. Compatibilidade com `fulfills_order_id` / pedidos

- **MVP:** o vínculo pedido↔exame permanece no **nível do exame** (`fulfills_order_id`), inalterado — o pedido continua um `exams` (medical_order) na aba Pedidos, e `effectiveOrderStatus` (≥1 resultado → `finalizado`) segue valendo. **Não** mexe no H-10 pedido já fechado.
- **Futuro (decisão explícita, fora do MVP):** o pedido poderá tornar-se um `exam_document` (`document_role='pedido'`) do próprio exame realizado, convergindo o modelo. Registrado como opção, **não** decidido aqui para não perturbar `ab5b5816`.

---

## 13. Adicionar documento a exame existente + duplicidade + regras de não-merge

Ao adicionar um arquivo, quatro comportamentos **explícitos** (reusando `duplicates.ts` — fingerprint OU paciente·data·emissor·título):

- **A. Anexar ao exame existente** — quando há **evidência suficiente** de pertencimento (mesmo fingerprint, ou match forte de identidade + confirmação/limite definido).
- **B. Criar novo exame** — quando **não há** evidência suficiente de vínculo.
- **C. Sugerir vínculo** — alta similaridade sem evidência suficiente → surface "parece pertencer ao exame X — vincular?" (o usuário decide).
- **D. Nunca merge silencioso** — mantém o princípio de `duplicates.ts` (avisa, não funde).

O usuário sempre pode anexar **manualmente** um documento a um exame que ele escolher (na tela de detalhe), independentemente do detector.

---

## 14. Preliminar vs final

- `document_role` distingue. `laudo_final` torna-se primário por precedência (§9); `laudo_preliminar` é **preservado** como histórico.
- Resultados de ambos são **retidos** (por documento); o exame exibe os do primário, com acesso aos demais. Nada é sobrescrito.

---

## 15. Timeline

- `examToTimelineEntry` permanece **1 entrada por exame** (ADR-001: projeta, não duplica). A entrada passa a poder **referenciar N documentos** (metadados), sem duplicar o exame. `attachmentUrl` singular → lista de documentos (opcional, quando a UI suportar).

---

## 16. Tela de detalhe (Web e Mobile)

- Substituir o `AttachmentLink` único (Web `[id]/page.tsx:892`, Mobile `ExamDetailScreen.tsx:309`) por uma seção **"Documentos"** listando cada `exam_document` (papel, data, emissor, `AttachmentLink` próprio), com o **primário destacado**.
- Ação **"Adicionar documento"** → upload → `createExamDocument({ exam_id })` → análise do documento → re-derivação governada.
- Read model (`ExamDTO`/`EXAM_LIST_COLUMNS`) ganha `documents[]` (na Fase 3), mantendo `file_url` (primário) durante a transição.

---

## 17. Auditoria / proveniência

- `understanding_report`, `decisionLog`, `resolution_id`, `representation_fingerprint` passam a ser **por documento**. Cada biomarcador/resultado carrega `exam_document_id`. Divergências entre documentos geram **eventos de consistência** (append-only), nunca substituição.

---

## 18. Testes de regressão (mínimos)

1. Exames existentes (backfill 1 documento) exibem igual ao atual — `display_title`, `file_url`, resultados inalterados.
2. Adicionar 2º documento **não** sobrescreve resultados/identidade do 1º.
3. Preliminar + final **coexistem**; primário = final; preliminar preservado.
4. Sem auto-merge sem evidência (A/B/C/D); `duplicates.ts` só avisa.
5. `fulfills_order_id`/abas Pedidos inalterados; `effectiveOrderStatus` intacto.
6. Lateralidade **por documento** preservada; não herda bilateral do pedido.
7. H-09: documento com DUE falha → indeterminado, não promove; não contamina outros documentos do exame.
8. Reprocessar um documento afeta só os resultados **daquele** documento.
9. `bundle`/CDU (1 arquivo → N exames) continua funcionando e **não** colide com N documentos → 1 exame.
10. Nomenclatura: `display_title` = nome clínico; data/médico/emissor **não** entram no título.

---

## 19. Fases de entrega (resumo)

| Fase | Entrega | Comportamento |
|---|---|---|
| 0 | schema aditivo + backfill + espelho | nenhuma mudança visível |
| 1 | escrita document-aware (dual-write) + `/analyze` por documento | interno |
| 2 | anexar documento + re-derivação governada + UI de documentos | nova capacidade |
| 3 | mover leituras p/ `exam_documents` + depreciar espelhos | consolidação |

Cada fase = PR próprio, com gates (testes/typecheck/lint) e homologação, sobre a arquitetura congelada — **sem** reabrir navegação.

---

## 20. Dependências e o `0f5ec205`

- O nome genérico "Ultrassom" **não** é resolvido por este modelo: é falha de **extração/visão da etiqueta** (a evidência existe, a DUE não leu). Trilha **posterior e própria**, com aval para reabrir a DUE.
- Sequência: **este modelo (Fases 0–2)** → depois a **etiqueta do preliminar** → depois anexar o **laudo formal** ao mesmo exame. Assim não corrigimos o `0f5ec205` dentro de uma arquitetura prestes a mudar.

---

## 21. Decisões — RESOLVIDAS (congeladas)

1. **Enum `document_role`** — ✅ `pedido | laudo_preliminar | laudo_final | imagem | complementar | outro`.
2. **Documento primário** — ✅ precedência de §9, com o princípio congelado: primário é **referência de apresentação, não substituição**; todos os documentos permanecem.
3. **Pedido como documento** — ✅ **separado no MVP** (pedido = solicitação; laudo = resultado; convergência só no futuro, decisão explícita).
4. **Escopo do MVP** — ✅ **Fases 0–2**, com o **requisito funcional obrigatório** abaixo; Fase 3 depois.
5. **Reconciliação de schema** (`order_status`/`fulfills_order_id` sem DDL no repo) — ✅ **pré-requisito da Fase 0** (não construir camada nova sobre inconsistência de schema).

### Requisito funcional OBRIGATÓRIO do MVP (§4/§5/§13/§16)
> O usuário precisa conseguir **adicionar um segundo arquivo ao mesmo exame** — sem criar um novo exame e **sem substituir** o primeiro.

```
Exame                         Depois (posterior):        NUNCA:
 ├── Doc 1 (preliminar)        ├── Doc 1 — preservado     novo arquivo → sobrescreve
 ├── Doc 2 (final)             ├── Doc 2 — preservado                     o arquivo anterior
 └── Doc 3 (complementar)      ├── Doc 3 — preservado
                               └── … — preservados
```

**Nada implementado.** Próximo passo: detalhar a **Fase 0** (migração aditiva + backfill) como primeiro PR — só schema aditivo, sem runtime, sem tocar `ab5b5816`/`0f5ec205`.

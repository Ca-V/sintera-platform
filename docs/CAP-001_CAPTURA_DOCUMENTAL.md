# CAP-001 — Padronização da Captura Documental (Camada de Captura)

**Status:** 🔒 **ESPECIFICAÇÃO CONGELADA · CONCEPÇÃO ENCERRADA** (2026-07-07) — aprovada pela fundadora.
Iniciativa própria, **não** faz parte da REL-001. Implementação em branch dedicada, após o merge da REL-001.
Contém: problema · auditoria arquitetural (Fase 0) · auditoria de compatibilidade MIME · **9 princípios** ·
Home oficial (V1) · arquitetura de 3 camadas + contrato `CapturedDocument` + Routing por registry ·
integração DOC-001 · jornada completa (documento → formulário preenchido) · estratégia de migração · governança.
**A partir daqui, o aprendizado vem da IMPLEMENTAÇÃO e da homologação — não de novas rodadas de documentação.**
Reabertura só por revisão explícita (erro estrutural real durante a implementação).
**Herda:** [[UX-001]] (§1.10, §1.11 e §10, emendados nesta data), [[DS-001]].

---

## 0. Problema

Hoje coexistem **dois modelos mentais** de entrada de documento que deveriam convergir:
1. **Centro de Captura (Home)** — ponto único que classifica e roteia um documento.
2. **Entrada por módulo** — cada módulo tem seus próprios botões, com **cobertura desigual**
   de meios de entrada. O sintoma relatado: em Medicamentos, "Escanear documento" abre
   **apenas a câmera** (não aceita PDF/arquivo existente).

O objetivo é um **fluxo único e previsível** de captura em toda a plataforma: o usuário
aprende uma vez e reencontra o mesmo padrão em qualquer módulo.

**Objetivo final — unificar toda a JORNADA de criação de registros (não só uploads).** A
definição do CAP-001 é elevada: não é "unificar uploads", é **unificar toda a jornada de criação
de registros na plataforma** — do documento de entrada até o **formulário correspondente já aberto
e preenchido**. O CAP-001 entrega **um só componente**, **uma só lógica de orquestração**, **um só
conjunto de meios de entrada e formatos** e **um só fluxo de ponta a ponta**, eliminando diferenças
de comportamento entre módulos e reduzindo a manutenção futura.

**Fluxo padrão da plataforma** (ex.: receita de medicamento): (1) seleciona o documento → (2)
informa que é uma "Receita de medicamento ou suplemento" → (3) o sistema **processa** o documento →
(4) o **formulário de Medicamentos abre automaticamente** → (5) os campos extraíveis já vêm
**preenchidos** → (6) a usuária apenas **revisa, complementa e salva**. Levar apenas para a página
do módulo **interrompe** a jornada e obriga a recomeçar — é considerado incompleto.

Este objetivo é mais coerente com o posicionamento da SINTERA (**reduzir trabalho manual e
organizar automaticamente** a informação de saúde) e escala para exames, recursos, despesas,
agenda e futuros módulos. Corrigir o PDF de medicamento é apenas o primeiro sintoma; a meta é a
jornada completa.

## 1. Estado atual (mapeado no código — fatos)

| Área | Meios de entrada hoje | Arquivo:linha |
|---|---|---|
| **Centro de Captura** | 4 tipos: Exame · **Receita de medicamento** · Receita de óculos · Exame ômico | `src/lib/capture/registry.ts:15-20`, `intake/CaptureCenter.tsx:172` |
| **Exames** | ✅ arquivo (PDF/JPG/PNG) + ✅ drag-and-drop + ✅ foto (câmera) — *referência* | `src/app/dashboard/exams/page.tsx:272,278,302` |
| **Medicamentos** | ✅ manual + 📷 foto **(image/\*, `capture=environment` → só câmera no mobile, sem PDF)** + 🎤 voz | `src/app/dashboard/medicamentos/page.tsx:479-487` |
| **Recursos de Saúde** | ✅ manual + 📷 foto (image/\*, IA de grau) + 🎤 voz — **sem PDF/arquivo/drag** | `src/app/dashboard/recursos/page.tsx:335-336` |
| **Componente único de upload** | ❌ inexistente — cada módulo repete seu `<input type=file>` | — |
| **Voz (reutilizável)** | ✅ `VoiceInput` compartilhado | `src/components/VoiceInput.tsx` |
| **Centro reutilizável** | ✅ `DocumentIntakeHub`/`CaptureCenter` (drag+preview+classificação+rota) | `src/lib/capture/intake/CaptureCenter.tsx` |

## 1.1 Fase 0 — Auditoria arquitetural (concluída · causa raiz confirmada)

Auditoria instrumentada dos fluxos de captura (não suposição). Respostas:

**(a) Uma ou duas implementações do Centro de Captura?** — **Um** componente de captura:
`src/lib/capture/intake/CaptureCenter.tsx`. O antigo `DocumentIntakeHub.tsx` foi **deletado**
(substituído — commit cf53884). **Porém há DUAS Homes** atrás do flag `NEXT_PUBLIC_DASHBOARD_V2`
(`dashboard/page.tsx:56`): **V1 legado** (`dashboard/page.tsx`) fia o CaptureCenter no modal
"Adicionar documento" (`:337`); **V2** (`DashboardNew` → `DashboardPriority`) tem um botão
"Adicionar documento" **sem `onClick`** (`DashboardPriority.tsx:112`) — botão morto.

**(b) Quais módulos usam o mesmo componente?** — Apenas a Home V1 (modal) usa o CaptureCenter.
**Nenhuma página de módulo o reutiliza.**

**(c) Quais têm implementação própria?** — Exames, Medicamentos, Recursos, Ômica, Medidas,
Agenda: cada um com seu `<input type=file>` inline.

**(d) O que cada fluxo oferece?** — ver tabela §1. CaptureCenter: arquivo+drag+câmera, aceita
PDF/JPG/PNG, mas **não** oferece manual/voz. Módulos: manual+câmera+voz; Medicamentos/Recursos
**sem PDF/arquivo/drag**.

### ✅ Causa raiz do relato "só 3 opções, sem medicamento" (CONFIRMADA)
`CaptureCenter.tsx:56` → `validKinds = file ? processorsAccepting(file.type) : CAPTURE_PROCESSORS`:
as opções de tipo são **filtradas pelo MIME do arquivo**. E `processors/medication.ts:12` →
`accepts: ['image/jpeg','image/png']` — **não inclui `application/pdf`** (exam/eyeglass/omics
incluem). Logo, ao enviar um **PDF**, a lista mostra só `[Exame, Receita de óculos, Exame ômico]`
— medicamento **filtrado**. Receita de medicamento é quase sempre PDF → o usuário não consegue
classificá-la. **Não** é build defasado nem duas UIs de captura: é **defeito de dados** (`accepts`)
+ **decisão de UX** (esconder destino por MIME).

### Divergências a eliminar
1. `medication.accepts` sem `application/pdf` → causa do relato. (Trivial, mas é implementação CAP-001.)
2. **Duas Homes**; a V2 (`DashboardPriority`) tem "Adicionar documento"/"Exame"/"Medicamento" sem `onClick`. Decidir Home canônica e remover/fiar a morta.
3. Filtro silencioso por MIME esconde destinos — preferir mostrar todos e validar no envio.
4. Sem componente único — unificar módulos + Home no `<DocumentCapture>`.

## 1.2 Auditoria de compatibilidade de formatos (MIME) — todos os fluxos

| Fluxo | Aceita hoje | Câmera | Limite | Arquivo:linha |
|---|---|:--:|---|---|
| Proc. exam | PDF · JPG · PNG | — | — | `processors/exam.ts:10` |
| Proc. eyeglass | PDF · JPG · PNG | — | — | `processors/eyeglass.ts:10` |
| **Proc. medication** | **JPG · PNG (sem PDF)** ❌ | — | — | `processors/medication.ts:12` |
| Proc. omics | PDF · JPG · PNG | — | — | `processors/omics.ts:10` |
| CaptureCenter (Home) | PDF · JPG · PNG | ✅ sep. | 50 MB | `intake/CaptureCenter.tsx:26,147,150` |
| Exames (módulo) | PDF · JPG · PNG + drag | ✅ | 50 MB | `exams/page.tsx:278,302` |
| **Medicamentos** | **só image/\* (câmera)** ❌ | ✅ | — | `medicamentos/page.tsx:481` |
| **Recursos** | **só image/\* (câmera)** ❌ | ✅ | — | `recursos/page.tsx:335` |
| Medidas | image/\* (câmera) | ✅ | — | `medidas/page.tsx:242` |
| Ômica (módulo) | CSV · JSON · PDF · image | ✅ | — | `omics/page.tsx:142,144` |
| Agenda (anexo) | PDF · JPG · PNG | — | **10 MB** | `AgendarModal.tsx:432`, `eventForm.ts:66` |

**Inconsistências (todas a eliminar, não só medicamento):**
1. `medication` sem **PDF** (receita costuma ser PDF) — causa raiz do relato.
2. **HEIC ausente** em todas as validações — foto de iPhone é `image/heic`; `image/*` passa no seletor mas `ACCEPTED = pdf/jpeg/png` **rejeita**.
3. **`ACCEPTED` triplicada** (`CaptureCenter.tsx:26`, `exams/page.tsx:56`, `eventForm.ts:66`) — sem fonte única.
4. **Limites divergentes:** 50 MB (captura/exames) × 10 MB (agenda/eventos).
5. Medicamentos/Recursos/Medidas só câmera — sem arquivo/drag/PDF.

**Alvo:** base de formatos **única** = `PDF · JPG · PNG · HEIC` (Ômica soma `CSV · JSON` por ser
dado, não documento); **uma** constante compartilhada; **um** limite de tamanho; declaração de
`accepts` por processador só para **validação pós-seleção** (nunca para esconder destino).

## 1.3 Home oficial (DECIDIDO pela fundadora — 2026-07-07)

Existem duas Homes atrás de `NEXT_PUBLIC_DASHBOARD_V2` (`dashboard/page.tsx:56`): **V1**
(`dashboard/page.tsx`, funcional, fia o CaptureCenter) e **V2** (`DashboardNew` →
`DashboardPriority`, com botões sem `onClick` em `DashboardPriority.tsx:112-117`).

**Decisão (sem ambiguidade, alinhada ao princípio SSOT / fluxo único):**
- A **Home V1 é a única Home oficial** da plataforma a partir de agora.
- A **V2 é apenas implementação em desenvolvimento** — **sem evolução paralela** de funcionalidades.
- **Enquanto não houver paridade:** toda nova funcionalidade entra na Home oficial (V1); **nenhuma**
  funcionalidade existe exclusivamente na V2; **nenhum botão** permanece sem comportamento definido.
- A V2 só substitui a V1 quando atingir **paridade funcional completa** (todos os fluxos existentes)
  **e** for superior em experiência — então substitui **integralmente** e a **V1 é removida do código**.
- **Não há convivência permanente** entre duas Homes.

*Consequência para o CAP-001:* os botões mortos da V2 (`DashboardPriority.tsx:112-117`) são
inconsistência a resolver (fiar ao fluxo oficial ou não expor), não um segundo fluxo a manter.

## 2. Estado-alvo

### 2.1 Centro de Captura — lista de tipos e roteamento

| Tipo do documento | Rótulo | Destino |
|---|---|---|
| Exame | Exame | Exames (`/dashboard/exams`) |
| Exame ômico | Exame ômico | Exames Ômicos (`/dashboard/omics`) |
| Receita de medicamento/suplemento | Receita de medicamento ou suplemento | Medicamentos e Suplementos (`/dashboard/medicamentos`) |
| Receita de recurso de saúde | Receita de recurso de saúde (óculos, lentes, próteses, órteses, dispositivos…) | Recursos de Saúde (`/dashboard/recursos`) |
| Outro | Outro documento de saúde | Caixa de revisão / classificação manual |

Mudanças vs. hoje: **ampliar** "Receita de óculos" → "Receita de recurso de saúde"
(coerente com os sub-tipos do Anexo A do UX-001) e **acrescentar** "Outro documento de
saúde" (catch-all com revisão manual). Os demais já existem.

**Diretriz 1 — destinos nunca escondidos por tipo de arquivo.** A lista de destinos é
**fixa** (todos os tipos suportados pela plataforma), independente do MIME do arquivo. A
compatibilidade é validada **depois** que a pessoa escolhe o destino (se incompatível, mensagem
clara: "receita de medicamento aceita PDF/JPG/PNG/HEIC"). Elimina a sensação de funcionalidade
que "desaparece". → *substitui `validKinds = processorsAccepting(file.type)` por lista fixa +
validação pós-seleção.*

### 2.2 Padrão único de meios de entrada (todo módulo que aceita documento)

Os **6 meios oficiais**, sempre os mesmos, na mesma ordem:

1. **Digitar manualmente** — formulário.
2. **Tirar foto** — câmera (`capture=environment`).
3. **Enviar arquivo** — file picker.
4. **Arrastar arquivo** — drag-and-drop.
5. **Importar do Centro de Captura** — quando aplicável.
6. **Falar** — captura por voz (`VoiceInput`).

Formatos base: **PDF · JPG · PNG · HEIC** (fonte única). Nenhum módulo oferece apenas um
subconjunto sem justificativa técnica registrada. O envio/arrastar de arquivo **não pode**
existir só no Centro de Captura — tem de estar **dentro do módulo**.

### 2.3 Um componente, uma lógica (captura × processamento separados)

- **Um único componente oficial `<DocumentCapture>`** (evolução do CaptureCenter). **Todos** os
  módulos o reutilizam; **nenhum** implementa seu próprio `<input type=file>`/upload.
- **Diretriz 3 — o componente decide apenas:** (a) qual documento foi enviado e (b) para qual
  módulo encaminhar. **Cada módulo permanece responsável só pelo processamento específico** do
  seu documento (OCR/IA/extração). Captura ≠ processamento.
- Cada módulo **declara** `accepts` + processador de destino; o componente entrega os 6 meios de
  forma idêntica. **Exames** é a implementação de referência.
- Fonte **única** de `ACCEPTED` + limite de tamanho (hoje triplicada e divergente — §1.2).

### 2.4 Princípio 6 — o usuário nunca escolhe entre fluxos equivalentes

A plataforma **conduz** ao melhor fluxo; não transfere a decisão de arquitetura ao usuário.
Na página de Medicamentos, a pessoa **não** deve ponderar *"uso o Centro de Captura? Adicionar?
Escanear? Enviar arquivo?"*. Ela apenas escolhe **a forma de entrada** (foto · arquivo · voz ·
manual) e a plataforma faz o resto. O Centro de Captura é canal unificado para documentos
diversos, mas **não compete** com os módulos. Comportamento **consistente** em toda a plataforma.
*(Coerente com [[UX-001]] §1.2 Consistência e §1.10.)*

### 2.5 Configuração central de formatos (ponto único de manutenção)

Em vez de apenas desduplicar, criar **uma configuração única** (ex.: `@/lib/capture/formats.ts`)
como fonte da verdade de:
- **formatos aceitos** (MIME + extensões) — base `PDF · JPG · PNG · HEIC`;
- **tamanho máximo** (um limite; hoje 50 MB × 10 MB divergem);
- **mensagens de erro** (formato inválido, arquivo grande…);
- **tipos permitidos por categoria documental** (ex.: Ômica soma `CSV · JSON`; medicamento/receita
  = base; futuros: **DICOM** para imagem médica, **AVIF** etc.).

Todos os inputs, processadores e validações passam a **ler dessa config** — quando um novo formato
precisar de suporte no futuro, há **um só ponto** de manutenção. Elimina as três `ACCEPTED`
duplicadas e os limites divergentes (§1.2).

### 2.6 Princípio 7 — captura orientada ao objetivo, não à origem do documento

A captura é guiada pelo **objetivo da usuária**, não pela **tecnologia da entrada**. Ela não pensa
*"vou enviar um PDF / tirar uma foto / importar um documento"* — pensa *"quero cadastrar um
medicamento / adicionar um exame / guardar uma receita / registrar um recurso"*. Os meios (foto,
arquivo, voz, manual…) são só **formas de atingir o objetivo**. O sistema é **orientado a tarefas**,
não a tecnologia. Consequência de design: a interface parte da **tarefa/destino**; o meio de entrada
é secundário e intercambiável.

### 2.7 Princípio 8 — compatibilidade retroativa (backward compatibility)

Toda evolução futura da captura **preserva compatibilidade com documentos já armazenados**: um
documento enviado hoje continua funcionando daqui a cinco anos. Trocar o **Capture Engine** não
invalida documentos antigos; trocar o **OCR** não quebra a proveniência; trocar a **IA** não altera
a referência ao documento original (`documentId`/`checksum` são estáveis e permanentes). É um
contrato permanente — conversa diretamente com [[DOC-001]], **KG v2** e **SRL**.

### 2.8 Princípio 9 — a jornada termina no formulário preenchido, não na página do módulo

> **Sempre que um documento puder gerar automaticamente um registro da plataforma, o fluxo termina
> DENTRO do formulário correspondente, já preenchido com o que foi extraído — nunca apenas na página
> do módulo.** A usuária só revisa, complementa e salva.

- Encaminhar para a página do módulo **sem** abrir o formulário preenchido é **experiência incompleta**.
- Vale para todos os módulos que geram registro a partir de documento: Medicamentos, Exames, Recursos,
  Despesas, Agenda e futuros.
- O **Routing Engine** entrega ao módulo o `CapturedDocument` **+ os campos extraídos**; o módulo abre
  seu formulário em modo de revisão pré-preenchido.

### 2.9 Fluxo orientado à INTENÇÃO — "o que/como deseja cadastrar", não "adicionar documento"

O fluxo **nasce na intenção da usuária**, não no mecanismo (herda [[UX-001]] §1.11). A usuária nunca
está "adicionando um documento" — ela quer **cadastrar um medicamento / exame / recurso / despesa /
consulta**; o documento é só um **meio**. Consequências de UX:

- **Ponto de partida** = a intenção: na Home, **"O que você deseja cadastrar?"**; dentro de um módulo,
  **"Como deseja cadastrar este medicamento?"**. Não "Adicionar documento".
- **Verbo do botão** comunica intenção: **"Novo medicamento" / "Cadastrar medicamento"** — não "Adicionar".
- Ao acionar, abre a **escolha do método** (o mesmo `DocumentCapture`): Digitalizar receita · Selecionar
  arquivo · Tirar foto · Importar do Centro de Captura · Digitar manualmente · Falar. **A tecnologia
  desaparece; a intenção fica em primeiro plano.**
- Depois da escolha, o fluxo continua automaticamente (documento → processado → formulário preenchido,
  Princípio 9). A **digitação manual é uma opção entre outras, não o caminho principal**.

## 3. Auditoria de conformidade e lacunas

| Módulo | Manual | Foto | Arquivo+Drag (PDF) | Centro de Captura | Voz | Lacuna a corrigir |
|---|:--:|:--:|:--:|:--:|:--:|---|
| Exames | ✅ | ✅ | ✅ | ➖ | ❌ | (opcional) voz |
| Medicamentos | ✅ | ✅ | ❌ | ➖ | ✅ | **arquivo/PDF + drag; separar "foto" de "enviar arquivo"** |
| Recursos de Saúde | ✅ | ✅ | ❌ | ➖ | ✅ | **arquivo/PDF + drag** |
| Exames Ômicos | ✅ | ✅ | parcial | ➖ | — | alinhar ao padrão |
| Medidas / Agenda | — | ✅ | parcial | ➖ | — | alinhar ao padrão |

Prioridade do relato: **Medicamentos** (arquivo/PDF+drag) e **Centro de Captura**
(ampliar tipos). Depois, propagar o `<DocumentCapture>` aos demais.

## 4. Não-metas / conformidade

- **RDC 657/2022:** captura organiza documentos; não interpreta nem diagnostica.
- "Voz" reusa o `VoiceInput` existente — não é um novo motor de IA.
- Nenhum link de documento fictício; proveniência ([[REL-001]]/`@/lib/provenance`) consome
  o arquivo por referência quando armazenado.

## 5. Princípio permanente (emendado no UX-001)

> **Todo módulo que aceite documentos oferece os mesmos meios de entrada: digitar
> manualmente · tirar foto · enviar/arrastar arquivo · importar do Centro de Captura ·
> falar.** O Centro de Captura é canal **adicional**, nunca o único local de envio de
> arquivo. O usuário não reaprende a inserir informação a cada tela. (UX-001 §1.10 e §10.)

## 6. Arquitetura de implementação (3 camadas + DOC-001)

`<DocumentCapture>` **não é só um componente visual** — é composto por três camadas separadas:

| Camada | Responsabilidade |
|---|---|
| **Presentation** | interface: botões, drag-and-drop, câmera, voz, entrada manual. |
| **Capture Engine** | recebe **qualquer** entrada e produz um **`CapturedDocument`** padronizado (contrato único). |
| **Routing Engine** | encaminha o documento para o módulo correto (Exames, Medicamentos, Recursos, Ômica, Procedimentos…). |

### Contrato único — `CapturedDocument`

Objeto **oficial** que trafega entre todas as camadas — evita que cada etapa crie sua própria
estrutura (sem acoplamento entre Capture Engine, Routing Engine e módulos):

| Campo | Descrição |
|---|---|
| `documentId` | id no repositório único ([[DOC-001]] / `health_documents`) |
| `originalFile` | arquivo original (referência ao binário armazenado) |
| `mimeType` | tipo do arquivo |
| `checksum` | hash de integridade (dedup + verificação) |
| `source` | origem (upload · câmera · Apple Health · WhatsApp · API…) |
| `captureMethod` | meio de entrada (foto · arquivo · drag · voz · manual · importação) |
| `capturedAt` | timestamp da captura |
| `uploader` | usuário que capturou |
| `metadata` | metadados livres por categoria documental |

### Routing Engine por registry (extensível)

O Routing Engine é **baseado em registradores** — mesmo padrão dos processadores atuais
(`registry.ts` / `CAPTURE_PROCESSORS`): um `captureRegistry` mapeia tipo/destino → módulo
(medication · exam · omics · resources · procedures · vaccines · …). Adicionar um módulo novo =
**registrar um novo destino**, sem alteração estrutural no Routing Engine. Reduz manutenção ao
longo dos anos.

**Extensibilidade por adaptadores:** futuras origens — Apple Health, Google Health Connect, e-mail,
WhatsApp, scanner TWAIN, integrações com clínicas, APIs externas — entram como **novos adaptadores no
Capture Engine**, sem alterar nenhuma tela. Presentation e Routing permanecem intactos.

### Integração com o DOC-001 (repositório único de documentos)

O documento original passa **primeiro** pelo repositório único e **só depois** é distribuído:

```
DocumentCapture (Presentation)
        ↓
Capture Engine  → CapturedDocument
        ↓
health_documents (DOC-001)      ← repositório único; proveniência compartilhada
        ↓
Routing Engine
        ↓
Exames · Medicamentos · Recursos · Ômica · Procedimentos · …
```

Assim, **um só armazenamento** do arquivo (sem duplicação por tabela/módulo) e **uma só
proveniência** para toda a plataforma — os módulos referenciam `document_id` e a camada
`@/lib/provenance` ([[REL-001]]) consome o documento por referência. Consolida a lacuna já
registrada em [[DOC-001]] (ômica/medicamentos hoje sem documento armazenado).

## 7. Sequência de trabalho (encerra a especificação)

Especificação **encerrada**. Ordem de execução:

1. **Homologar e publicar a REL-001** (pré-requisito; não misturar escopos).
2. **Abrir a implementação do CAP-001** (branch dedicada).
3. **Construir primeiro a infraestrutura:** `DocumentCapture` (3 camadas) + `Capture Engine` +
   `Routing Engine` + integração com `health_documents` (DOC-001) + config central de formatos (§2.5).
4. **Só depois, migrar gradualmente** Exames (referência) → Medicamentos → Recursos → Ômica →
   demais módulos para a infraestrutura única, começando pela causa raiz (PDF em medicamento).

## 8. Critérios de Aceite (oficiais — homologação do CAP-001)

O CAP-001 só é considerado **implementado** quando **todos** os itens forem verdadeiros:

- [ ] Todos os módulos utilizam **exclusivamente** o `DocumentCapture`.
- [ ] **Não existem** mais fluxos próprios de upload por módulo.
- [ ] Todos os módulos oferecem **exatamente os mesmos 6 meios**: digitar manualmente · tirar foto · enviar arquivo · arrastar arquivo · importar do Centro de Captura · falar.
- [ ] O Centro de Captura apresenta **sempre todos os destinos** suportados pela plataforma.
- [ ] A lista de destinos **não varia** conforme o tipo de arquivo enviado.
- [ ] Toda validação de formatos usa a **configuração central**.
- [ ] **Não existem** validações de MIME duplicadas.
- [ ] **Não existem** limites de tamanho diferentes entre módulos.
- [ ] O documento original segue o fluxo definido no **DOC-001** (`health_documents`).
- [ ] Todos os fluxos são **homologados com PDF, JPG, PNG e HEIC**.
- [ ] **Selecionar arquivo existente** do dispositivo (PDF/imagem da galeria) está disponível em **todos** os módulos — não apenas câmera.
- [ ] **Validação obrigatória em mobile (iOS e Android)** em cada módulo: abrir **câmera** · abrir **galeria** · **selecionar arquivo** do dispositivo · **selecionar PDF** · **comportamento idêntico** em todos os módulos. *(Critério obrigatório — a captura é um dos principais fluxos da SINTERA; inconsistência aqui compromete a proposta de valor.)*
- [ ] **Jornada completa (Princípio 9):** documento → processado → **formulário do módulo abre automaticamente e já preenchido** com o que foi extraído; a usuária só revisa/complementa/salva. **Não** terminar apenas na página do módulo.
- [ ] **"Adicionar" abre a escolha do método** (Digitalizar receita · Selecionar arquivo · Tirar foto · Importar do Centro de Captura · Digitar manualmente · Falar), **não** o formulário manual direto — em todos os módulos.

### Status de implementação (linha divisória documentação × execução — 2026-07-07)

Especificação **congelada**; implementação **ainda não iniciada** (programada para após o merge
da REL-001). Verificado no código nesta data:

| Item | Status |
|---|---|
| Aceitar PDF para receita de medicamento (`medication.accepts`) | 🟡 Hotfix aplicado — branch `fix/capture-destinos-sempre-visiveis` (aguardando merge) |
| Centro de Captura exibindo todos os destinos (sem filtro por MIME) | 🟡 Hotfix aplicado — idem |
| `DocumentCapture` único | ❌ Não implementado |
| Todos os módulos usando o mesmo componente | ❌ Não implementado |
| **Página de Medicamentos (mobile): selecionar arquivo/galeria, não só câmera** | ❌ Não implementado |
| Configuração central de formatos (`formats.ts`) | ❌ Não implementado |
| Capture Engine | ❌ Não implementado |
| Routing Engine (por registry) | ❌ Não implementado |
| Integração com `health_documents` (DOC-001) | ❌ Não implementado |
| Migração dos módulos para a nova arquitetura | ❌ Não implementado |

**Precursores existentes (não são os entregáveis CAP-001):** `CaptureCenter` (intake da Home,
com filtro por MIME a ser removido) e a `registry.ts` de processadores (base para o Routing Engine).
Tudo o mais acima é da **próxima etapa de desenvolvimento**.

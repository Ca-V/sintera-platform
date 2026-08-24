# EXDOC-005 — Reconciliação da #117 (Fase 0 · migração 137) contra o modelo canônico FHIR

> **Passo C-1 — AUDITORIA DOCUMENTAL READ-ONLY.** Não executa a #117; não altera código, schema, banco, UI,
> wiring, terminologia. Objetivo: determinar se a **#117 (migração 137)** é estruturalmente **compatível** com o
> `SINTERA-FHIR-CANONICAL-MODEL.md` aprovado, ou se precisa **ajustar/substituir** antes de qualquer aplicação.
> **Fonte governante:** `SINTERA-PROTOCOLO-INTEROPERABILIDADE-v1.0.md`. **Data:** 2026-08-19 · **Gate C-1→C-2: FECHADO.**

## 0. Objeto auditado (verificado no branch `origin/docs/fase0-migration`)
Migração `20260818120000_137_exam_documents_mvp_fase0.sql` — **aditiva, idempotente, reversível, não muta linhas**. Faz:
1. Formaliza `exams.fulfills_order_id uuid` + **FK self-ref** `exams(id) on delete set null` + índice; e `exams.order_status text` (**sem CHECK/enum**).
2. Cria `public.exam_documents` (id, exam_id FK→exams cascade, user_id, `file_url`, `document_sha256`, `document_role` CHECK{laudo_preliminar|laudo_final|complementar|outro}, `source`, `uploaded_at`, `current_extraction_version_id` FK→extraction_versions, `exam_date`, `issuer`, `is_primary`, `status`, `created_at`) + índices + único primário + **RLS user-scoped**.
3. `exams.primary_document_id` FK→exam_documents.
4. `exam_document_id` (nullable, FK→exam_documents) em `extraction_versions`, `biomarkers`, `clinical_results` + índices.

**Regra de evidência:** ausência de evidência ≠ inexistência. Imagem/Doppler federal permanece **`[NC]`**. Não inventar códigos LOINC/SNOMED. BR-Core: sem o StructureDefinition bruto, marca-se **`[NC-perfil]`** (alinhável, a confirmar contra o perfil).

## 1. ServiceRequest (pedido)
- **`medical_order` como linha de `exams`:** a #117 **não** cria entidade de solicitação de 1ª classe — o pedido continua sendo uma linha de `exams` distinguida por `document_type` (coluna **sem enum/CHECK**). A 137 **não toca** essa lacuna (está fora do MVP de 137).
- **N procedimentos por pedido:** **não suportado.** Não há estrutura filha de "procedimentos solicitados"; o "o que foi pedido" só é recuperável de `biomarkers` (texto). 137 não adiciona nada.
- **Modelo bilateral (dois `ServiceRequest` por `requisition`):** **não suportado.** Não há `requisition`/identificador de agrupamento; `fulfills_order_id` é self-ref resultado→pedido, **não** agrupa solicitações.
- **`code`/`bodySite`/lateralidade/`subject`/`requester`/`authoredOn`/`status`:** `code` inexistente (texto); `bodySite`/lateralidade inexistentes (embutidos no texto); `subject` = `user_id`/`patient_name` (texto); `requester` = `requesting_physician` (texto); `authoredOn` = **sem data de solicitação distinta**; `status` = `order_status` (**texto sem enum**).
- **Perda de semântica:** solicitação sem código; sem lateralidade estruturada; sem agrupamento `requisition`; ciclo do pedido não restrito. **`medical_order` como linha de `exams` NÃO representa um `ServiceRequest` com N procedimentos / bilateral.**
- **Situação:** 137 **não é incompatível**, mas é **insuficiente** para o modelo de `ServiceRequest`. ⇒ **AJUSTAR/COMPLEMENTAR** (aditivo).

## 2. Vínculo pedido → resultado (`basedOn`)
- **Mapeamento:** `fulfills_order_id` ↔ conceito `DiagnosticReport.basedOn → ServiceRequest`. A 137 dá **FK + índice** (bom), mas o **referente é outra linha de `exams`** (pedido-como-exame), não uma entidade `ServiceRequest`.
- **Cardinalidade:** `fulfills_order_id` é **um uuid** na linha do resultado → cada resultado aponta para **no máximo 1 pedido** (N resultados → 1 pedido). Cobre "1 pedido → N resultados"; **não** cobre **vínculo por lado/procedimento** (sem `ServiceRequest` por lado) nem **resultados parciais por lado** com granularidade.
- **FK/DDL:** presentes (`exams_fulfills_order_id_fkey`, `on delete set null`) — adequado.
- **Rastreabilidade/origem do vínculo:** **AUSENTE.** 137 não tem colunas de proveniência do vínculo (quem/quando/como; `link_source`/`confirmed_by`/`confirmed_at`/`match_confidence`). O Protocolo §6 exige **registrar confirmação e origem** e **proíbe vínculo silencioso** em ambiguidade — hoje `fulfills_order_id` é ponteiro **nu** ⇒ **risco de vínculo silencioso**.
- **Situação:** parcialmente compatível (granularidade de pedido); **AJUSTAR** — alvo do vínculo deve ser `ServiceRequest` (ou documentar a projeção pedido-como-exame como interina), + **proveniência do vínculo** + **granularidade por lado/procedimento**.

## 3. DocumentReference / `exam_documents`
- **Preservação/integridade/proveniência:** `file_url` (original), `document_sha256` (integridade/dedup — coluna, sem lógica), `source`+`uploaded_at`+`current_extraction_version_id` (proveniência por documento). Boa base.
- **Projeção para `DocumentReference`:** viável — `content.attachment.url`←`file_url`; hash←`document_sha256`; `type`←`document_role`; `date`←`uploaded_at`; autor/proveniência←`source`/extraction_version. (Confirmado também pelo projetor #119.)
- **Gaps:** **sem `contentType`/mime** (DocumentReference.content.attachment.contentType); sem `title`/`description`; `document_role` **não inclui papel de "solicitação/pedido"** (o PDF do pedido cairia em 'outro'); `exam_documents.issuer` é **novo campo TEXTO LIVRE** (ver §5).
- **Situação:** **compatível (parcial)**. **AJUSTAR (menor):** `contentType`, papel 'solicitacao', e caminho estruturado para `issuer`.

## 4. DiagnosticReport / Observation / Procedure (separação semântica)
- **Solicitação × relatório × observação × execução:**
  - **Solicitação (`ServiceRequest`):** não é entidade — é *flag* `document_type` (ver §1).
  - **Relatório (`DiagnosticReport`):** a linha `exams` age como evento/relatório; #119 projeta `exams`→`DiagnosticReport` (1 por exame). OK conceitualmente.
  - **Observação (`Observation`):** `biomarkers`/`clinical_results` → `Observation`; 137 adiciona `exam_document_id` (rastreabilidade por documento). OK.
  - **Execução (`Procedure`):** **AUSENTE** — 137 não modela `Procedure`; a "realização" é implícita.
- **Risco:** pedido e resultado são **ambos** linhas de `exams` separados só por `document_type` (flag, não tipo de entidade). Funciona **se** a projeção for limpa (roteamento/UX já separam — Ciclo 1), mas **`Procedure` não tem lar**.
- **Situação:** separação **parcial**; **`Procedure` ausente**. **AJUSTAR.**

## 5. Identidade e terminologia
- **Campos texto livre (persistidos/reforçados):** `exam_documents.issuer` (**novo** texto), além dos pré-existentes `exams.issuer`/`patient_name`/`requesting_physician`. **Sem** identificadores estruturados (CPF/CNS/CNES/CRM) e **sem** `code/system/display/version` em lugar algum da 137.
- **Terminologia:** 137 **não** introduz colunas de terminologia (LOINC/SNOMED/UCUM vivem em `biomarker_catalog`, fora da 137); `biomarkers` ganha `exam_document_id`, **não** um código padrão.
- **Risco:** 137 **reforça** superfície de texto livre (`exam_documents.issuer`) sem caminho para `Organization`+CNES. Não regride terminologia, mas perpetua o gap.
- **`[NC]`:** obrigatoriedade de código por elemento e ValueSets (LOINC/GAL/SNOMED) = **`[NC-artefato]`** (perfil vigente); **não** inventar códigos.
- **Situação:** **parcialmente compatível** — não regride, mas mantém/expande texto livre. **AJUSTAR** (caminho estruturado para atores/terminologia; não bloquear evolução).

## 6. Matriz de reconciliação
Situação: **Compatível** · **Parcial** · **Incompatível** · **`[NC]`**. FHIR R4 = correspondência ao recurso/elemento. BR-Core = `[NC-perfil]` sem StructureDefinition bruto.

| Elemento #117 (137) | Modelo canônico | FHIR R4 | BR-Core | Situação atual | Gap | Prioridade | Alteração necessária |
|---|---|---|---|---|---|---|---|
| `exams.fulfills_order_id` + FK self→exams | vínculo pedido→resultado | `DiagnosticReport.basedOn` | `[NC-perfil]` | **Parcial** | alvo é exame, não `ServiceRequest`; sem granularidade por lado; sem proveniência do vínculo | **P0** | manter FK; alvo lógico=solicitação; +colunas de origem/confirmação; +granularidade por procedimento |
| `exams.order_status` (text) | `ServiceRequest.status` | `ServiceRequest.status` (ValueSet) | `[NC-perfil]` | **Parcial** | texto sem enum/CHECK | **P1** | CHECK/enum alinhado ao ValueSet FHIR |
| `document_type` (pré-existente, tocado por contexto) | tipo de solicitação/resultado | recurso (SR×DR) | `[NC-perfil]` | **Parcial** | sem enum; `medical_order` não é entidade | **P0/P1** | enum/CHECK; projeção `medical_order→ServiceRequest` |
| `exam_documents` (tabela) | Documento original | `DocumentReference`/`Binary` | `[NC-perfil]` | **Compatível (parcial)** | falta `contentType`, `title` | **P1** | +`content_type`/mime; +papel 'solicitacao' |
| `document_role` (enum) | papel/status do laudo | `DiagnosticReport.status` (prelim/final) | `[NC-perfil]` | **Compatível** | sem papel 'solicitacao' | **P2** | acrescentar 'solicitacao' (ou documentar mapeamento) |
| `document_sha256` | integridade documental | `attachment.hash` | `[NC-perfil]` | **Compatível** | nullable, sem enforcement | **P2** | manter; política de integridade |
| `source`/`uploaded_at`/`current_extraction_version_id` | proveniência por documento | `Provenance`/`DocumentReference` | `[NC-perfil]` | **Compatível** | — | — | manter |
| `exam_documents.issuer` (text) | `Organization` | `DiagnosticReport.performer`/`Organization` | `[NC-perfil]` | **Parcial** | **novo texto livre**; sem CNES/CNPJ | **P1** | caminho estruturado p/ `Organization` (não fixar só texto) |
| `exams.primary_document_id` | documento primário | `DocumentReference` primário | `[NC-perfil]` | **Compatível** | — | — | manter |
| `exam_document_id` em results | resultado por documento | `Observation.derivedFrom` | `[NC-perfil]` | **Compatível** | — | — | manter |
| RLS user-scoped | controle de acesso | segurança (LGPD) | n/a | **Compatível** | auditoria de acesso à parte | **P1** | manter; +trilha de auditoria (§10) |
| **(ausente)** entidade de solicitação / `requisition` | `ServiceRequest` N-proc + bilateral | `ServiceRequest.code/bodySite/requisition` | `[NC-perfil]` | **Incompatível (lacuna)** | inexistente | **P0** | modelar solicitação de 1ª classe + `requisition` (migração complementar) |
| **(ausente)** `code`/`bodySite` do solicitado | procedimento solicitado codificado | `ServiceRequest.code` (CodeableConcept) + `bodySite` | `[NC-perfil]` | **Incompatível (lacuna)** | só texto | **P0/P1** | `code` coding+text; `bodySite` SNOMED CT por lado |
| **(ausente)** proveniência do vínculo | vínculo confirmável (§6) | — | n/a | **Incompatível (lacuna)** | vínculo nu ⇒ risco silencioso | **P0** | colunas de origem/confirmação; sem vínculo silencioso |
| **(ausente)** `Procedure` | execução | `Procedure` | `[NC-perfil]` | **Incompatível (lacuna)** | não modelado | **P2** | modelar quando houver execução |
| **(ausente)** identificadores estruturados | Patient/Practitioner/Organization | `identifier` (CPF/CNS/CNES/CRM) | `[NC-perfil]` | **Incompatível (lacuna)** | texto livre | **P1** (P0 T2) | estrutura de `Identifier` (system/value/period/origem/status) |

## 7. Compatibilidade FHIR R4 / BR-Core (síntese)
- **Compatível (aproveitável):** `exam_documents` (→ `DocumentReference`), proveniência por documento, `exam_document_id` nos resultados (→ `Observation.derivedFrom`), `primary_document_id`, RLS. **A parte documental da 137 é sólida e projetável.**
- **Parcial:** `fulfills_order_id` (→ `basedOn`, mas alvo/granularidade/proveniência), `order_status`/`document_type` (texto sem enum), `exam_documents.issuer` (texto).
- **Incompatível (lacunas, não erros):** ausência de `ServiceRequest` de 1ª classe (N-proc + `requisition` bilateral), `code`/`bodySite` do solicitado, proveniência do vínculo, `Procedure`, identificadores estruturados.
- **BR-Core:** todas as correspondências marcadas **`[NC-perfil]`** — alinháveis, a confirmar contra o StructureDefinition vigente (não disponível neste ambiente).

## 8. VEREDITO sobre a #117 — **AJUSTAR** (não "merge como está", não "substituir")
- **Não MERGE COMO ESTÁ:** a 137 é aditiva/reversível e **nada nela é FHIR-incorreto**, mas é **insuficiente** para o modelo canônico do **pedido** e cria **risco de vínculo silencioso** (`fulfills_order_id` sem proveniência) — contra o Protocolo §6.
- **Não SUBSTITUIR:** a porção `exam_documents`/proveniência/`exam_document_id` é **compatível e reaproveitável**; descartá-la seria retrabalho sem ganho.
- **AJUSTAR (aditivo, reversível):** manter a base documental da 137; **complementar** com o modelo de solicitação antes de depender dela para pedido↔resultado.

## 9. Plano de correção (aditivo e reversível) — NÃO executar (Gate C-1→C-2 fechado)
**Pré-condição (P0):** fechar o modelo de `ServiceRequest` no schema **antes** de tratar 137 como base do pedido↔resultado:
1. **Solicitação de 1ª classe** (ou extensão de `exams`): `code` (coding+text), `bodySite`/lateralidade, `subject`, `requester`, `authoredOn`, `status`(enum), **`requisition`** (agrupador do bilateral), suporte a **N procedimentos**.
2. **Vínculo com proveniência:** ligar resultado→solicitação **por procedimento/lado**, com origem/confirmação (`link_source`/`confirmed_by`/`confirmed_at`/`match_confidence`) — **sem vínculo silencioso**.
3. **Ajustes menores na 137:** `order_status`/`document_type` → CHECK/enum; `exam_documents` → `content_type` + papel 'solicitacao'; caminho estruturado para `issuer`→`Organization`.
4. **Fora do 137 (P1/P2):** `Procedure`; identificadores estruturados; camada de terminologia.
**Todos os passos aditivos/reversíveis**, sob a **regra de mudança (Protocolo §17)** e **sem tocar o baseline homologado do Ciclo 1**.

## 10. Riscos e dependências
- **Risco:** aplicar 137 isolada e passar a gravar `fulfills_order_id` sem proveniência **institucionaliza o vínculo silencioso** (dívida contra §6) — mitigar tratando o modelo de solicitação como pré-condição.
- **Risco:** `exam_documents.issuer` como texto amplia superfície de dado não estruturado — mitigar com caminho para `Organization`.
- **Dependência `[NC]`:** ValueSets/cardinalidades (LOINC/GAL/SNOMED, `ServiceRequest.status`, perfil de imagem federal) — pendentes de artefato/IG; **não** bloqueiam a Trilha 1 (modelo aditivo), mas condicionam a Trilha 2.
- **Dependência:** decisão bilateral (dois `ServiceRequest` + `requisition`) já aprovada em `SINTERA-FHIR-CANONICAL-MODEL.md` §4.1 — orienta o item 1 do plano.

## 11. Entregável / próximo gate
**Veredito: AJUSTAR** a #117 (complementar, sem substituir), com plano aditivo/reversível na §9. **Nada implementado.** **Gate C-1 → C-2 permanece FECHADO:** somente após aprovação explícita da fundadora deste parecer será definida qualquer primeira migração ou alteração de banco (Passo C-2).

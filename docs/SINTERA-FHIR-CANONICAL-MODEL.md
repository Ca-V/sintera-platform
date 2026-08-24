# SINTERA-FHIR-CANONICAL-MODEL

> **Fase A — Definição de arquitetura semântica. READ-ONLY.** **NÃO** altera código, banco, schema, UI, wiring
> nem **#117/#114/#119**. Segundo dos dois artefatos exigidos antes de qualquer alteração de banco/kernel (o
> primeiro é `INTEROPERABILITY-COMPLIANCE-MATRIX.md`). **Data:** 2026-08-19 · **Gate:** FECHADO.
> **Fonte governante:** `SINTERA-PROTOCOLO-INTEROPERABILIDADE-v1.0.md`. Este modelo **detalha** o mapa FHIR do Protocolo v1.0; em divergência, prevalece o Protocolo.

## 1. Cadeia canônica (decisão a preservar)
```
SINTERA Canonical Health Model
   → FHIR R4 / BR-Core            (modelo semântico interno — fonte da verdade estrutural)
   → projetores/adaptadores        (por perfil/caso de uso)
   → RNDS / OpenCare / parceiros   (só quando houver IG/fluxo/contrato vigente aplicável)
```
**Regra de ouro (ordem de derivação):**
```
conceito clínico → recurso FHIR → perfil BR-Core/RNDS aplicável → terminologia → modelo canônico → banco → API → UI
```
Nunca o inverso. Nunca criar campo "porque a tela precisa" quando ele representa informação clínica. Antes de criar extensão SINTERA: procurar perfil **BR-Core**, depois **RNDS**; usar o existente; só estender com necessidade real **documentada**.

**Este documento define semântica, não schema.** Nenhuma tabela/coluna/FK é criada aqui — apenas o alvo canônico e o gap atual.

## 2. Estado atual da SINTERA (linha de base, verificado no repositório)
- Entidade central única: `exams` (documento de qualquer modalidade). Paciente/profissional/emissor = **texto livre** (`patient_name`, `requesting_physician`, `issuer`); **sem** CPF/CNS/CNES/CRM/nascimento/sexo. [R]
- Pedido = linha de `exams` com `document_type ∈ {medical_order, insurance_guide}` (coluna **sem enum/CHECK**; convenção só em TS: `classification.ts:5`). [R]
- Vínculo pedido→resultado = `fulfills_order_id` + ciclo `order_status` — **sem DDL/FK** (só em código: `update.ts:16-17`, `orderStatus.ts`). [R]
- Procedimento solicitado = **texto livre** reconstruído de nomes de biomarcadores (`orderTitle.ts`); **sem código**. [R]
- Terminologia = catálogo local `biomarker_catalog` (`code` mnemônico); colunas `loinc_code`/`snomed_ct_code`/`ucum_unit` **existem porém vazias**. [R]
- `clinical_results` já tem `code`/`code_system`/`value_code` (BI-RADS/PI-RADS…) mas **0 linhas** no ambiente. [R]
- Proveniência rica: `provenance/index.ts`, `PipelineAudit`, `extraction_versions`, `document_sha256`, `representation_fingerprint`. [R]
- Camada FHIR pura #119 (projetor determinístico) existe mas **gated/fixture**, dependente da Fase 0 (#117). [R]

## 3. Mapa canônico — conceito SINTERA → recurso FHIR
Legenda gap: ❌ ausente · 🟡 parcial/local · ✅ presente.

| Conceito SINTERA | Recurso FHIR | Campos-núcleo | Representação atual | Gap |
|---|---|---|---|---|
| **Pedido de exame** (`medical_order`) | **`ServiceRequest`** | `status`, `intent`, `code` (o solicitado), `subject`, `requester`, `performer`, `authoredOn`, `reasonCode`, `bodySite`, `supportingInfo` | linha `exams` + texto livre | 🟡→❌ `code` sem terminologia; sem entidade de 1ª classe |
| **Laudo/relatório de resultado** | **`DiagnosticReport`** | `status`, `code`, `subject`, `basedOn`→ServiceRequest, `result`→Observation, `imagingStudy`, `presentedForm`, `effective[x]`, `issued`, `performer` | modelo interno de resultado | 🟡 sem recurso; `basedOn` não persistido |
| **Resultado atômico/medição** | **`Observation`** | `status`, `code`, `subject`, `value[x]` (+UCUM), `referenceRange`, `interpretation`, `bodySite`, `specimen`, `derivedFrom` | `biomarkers`/`current_biomarkers` | 🟡 sem `code` padrão; unidade texto |
| **Estudo de imagem** | **`ImagingStudy`** | `subject`, `started`, `modality`, `series`, `endpoint`, `basedOn` | — | ❌ (modelar em FHIR, independe de RNDS) |
| **Execução do procedimento** | **`Procedure`** | `status`, `code`, `subject`, `performed[x]`, `basedOn`→ServiceRequest, `performer` | — (implícito no exame realizado) | ❌ (separar do pedido — Protocolo §4) |
| **Documento original (PDF/imagem)** | **`DocumentReference`** (+ **`Media`** p/ imagem) | `status`, `type`, `subject`, `content.attachment` (url/hash/contentType), `context.related`, `date` | `exams.file_url`; `exam_documents` (#117 proposto) | 🟡 sem recurso; multi-doc não migrado |
| **Amostra/material** | **`Specimen`** | `type`, `subject`, `collection` | `source_material` (texto) | 🟡 texto |
| **Paciente** | **`Patient`** | `identifier` (local/CPF/CNS), `name`, `birthDate`, `gender` | `profiles` + `patient_name` | ❌ sem identifiers nacionais |
| **Profissional** | **`Practitioner`** / **`PractitionerRole`** | `identifier` (CRM/UF/CNS), `name`, `qualification`, papel/organização | `requesting_physician` (texto) | ❌ texto |
| **Estabelecimento** | **`Organization`** | `identifier` (CNES/CNPJ), `name`, `address`, `telecom` | `issuer` (texto) | ❌ texto |
| **Proveniência** | **`Provenance`** | `target`, `recorded`, `agent`, `entity` | `provenance/index.ts`, `extraction_versions` | 🟡 base pronta, não como recurso |
| **Consentimento/autorização** | **`Consent`** | titular, finalidade, escopo, fonte, destinatário, período, status, revogação, evidência | — | ❌ |
| **Auditoria** | **`AuditEvent`** | ação, agente, alvo, origem, resultado, finalidade | `ai_processing_log`, RLS | 🟡 parcial |
| **Cobertura/convênio** (`insurance_guide`) | **`Coverage`** | pagador, beneficiário, período | linha `exams` | 🟡 |
| **Identificador (transversal)** | **`Identifier`** | `system`, `value`, `period`, `assigner`, `use` | ad-hoc/texto | ❌ estrutura ausente |
| **Terminologia (transversal)** | **`CodeSystem`/`ValueSet`/`CodeableConcept`** | `code`, `system`, `display`, `version` | catálogo local; colunas vazias | 🟡 |

**Futuros (não bloquear a arquitetura):** `Encounter`, `Procedure`, `MedicationRequest`, `Medication`, `MedicationStatement`, `Immunization`, `AllergyIntolerance`, `Condition`, `HealthcareService`, `Device`. Modelar de forma que **não impeça** esses recursos depois.

## 4. `ServiceRequest` — o núcleo do PEDIDO (detalhe)
Semântica FHIR R4 [Ev1]: `ServiceRequest` representa a **solicitação** de procedimento/investigação diagnóstica; `ServiceRequest.code` = **o que é solicitado**; o resultado (`DiagnosticReport`/`Observation`/`ImagingStudy`) referencia a solicitação via `basedOn`.

```
ServiceRequest
  ├── status        (draft | active | completed | revoked …)  ← hoje: order_status (pendente/realizado/finalizado)
  ├── intent        (order)                                     ← hoje: implícito
  ├── code          (procedimento solicitado, CodeableConcept)  ← hoje: TEXTO LIVRE (orderTitle) — GAP
  ├── subject       (Patient)                                   ← hoje: exams.user_id/patient_name
  ├── requester     (Practitioner)                              ← hoje: requesting_physician (texto)
  ├── performer     (Organization/Practitioner)                ← hoje: —
  ├── authoredOn    (data da solicitação)                       ← hoje: sem data de solicitação distinta
  ├── reasonCode    (indicação)                                 ← hoje: —
  ├── bodySite      (lateralidade/topografia)                   ← hoje: embutido no texto
  └── supportingInfo                                            ← hoje: —
```
**`code`:** usar **CodeableConcept** — `coding` (system+code+version) quando houver terminologia aplicável **+** `text` (representação textual original preservada). **Não** transformar texto livre no modelo semântico definitivo quando houver código. **Não** inventar código (ver §8 da matriz).

### 4.1 DECISÃO SEMÂNTICA — pedido bilateral (Doppler venoso de MMII esquerdo + direito)
**Decisão (canônica, default):** modelar como **DOIS `ServiceRequest` relacionados** (esquerdo e direito), **agrupados por uma requisição comum** via `ServiceRequest.requisition` (Identifier compartilhado). Cada um com o **mesmo `code`** (o procedimento) e **`bodySite` distinto** (lado esquerdo / direito, estrutura qualificada por lateralidade).
**Variante condicional (aceitável só se o perfil exigir):** **um** `ServiceRequest` com `bodySite` bilateral **ou** um `code` bilateral — **apenas** quando o perfil/terminologia BR-Core/RNDS aplicável **definir código/estudo bilateral consolidado** e o resultado for reportado como peça única. Enquanto o perfil não for confirmado (`[NC-artefato]`), **prevalece o default (dois agrupados)**.

**Critério da escolha (semântica clínica + interoperabilidade, NÃO facilidade/UI):**
1. Doppler venoso de membro inferior é **clinicamente per-membro** — cada membro é avaliado de forma independente (patência/refluxo/trombose por veia, por lado).
2. **Fulfillment e resultados parciais independentes** (um lado realizado, outro pendente) — exigido pelo Protocolo v1.0 §6 e §5.
3. **`basedOn` limpo por lado** — cada resultado referencia o `ServiceRequest` do lado correto, sem ambiguidade.
4. **Orientação FHIR R4:** usar `ServiceRequest` separados quando as solicitações podem ser **cumpridas/rastreadas independentemente**; `requisition` é o mecanismo canônico para agrupá-las como **uma única requisição/pedido** (um documento autorizado).
5. Suporta naturalmente **"pedido com múltiplos procedimentos"** (Protocolo §5/§6) sem caso especial.

**Fonte normativa/técnica:** HL7 FHIR R4 — `ServiceRequest` (`code`; `bodySite` 0..*; `requisition` 0..1 = "requisição composta comum"; `supportingInfo`) [Ev1]; `DiagnosticReport.basedOn`, `Observation` [Ev2]. Lateralidade via **SNOMED CT** *bodySite* qualificado por lado; **ValueSet/coding exato = perfil-dependente `[NC-artefato]`** (BR-Core/RNDS de imagem = `[NC]`, Protocolo §9/§15).

**Impacto por elemento:**
| Elemento | Efeito da decisão |
|---|---|
| `ServiceRequest.code` | **Mesmo** CodeableConcept (coding+text) nos dois; **não** usar código "bilateral" por default (perderia granularidade), salvo perfil exigir. |
| lateralidade / `bodySite` | `bodySite` = SNOMED CT lado **esquerdo** / **direito** — um por `ServiceRequest`. |
| vínculo → resultado (`basedOn`) | Cada resultado do lado X → `DiagnosticReport.basedOn = ServiceRequest(X)`; `requisition` reconstrói o pedido único. |
| `DiagnosticReport` | Default: um por lado; admite **relatório consolidado** referenciando os dois `basedOn` — decisão de reporte, ambos suportados. |
| `Observation` | Por achado/veia, com `bodySite` reafirmando o lado; `derivedFrom` do documento de origem. |
| `Procedure` | Execução por lado (`Procedure.basedOn → ServiceRequest(X)`), quando modelada. |
| `ImagingStudy` (se houver imagem) | Por lado/série, `basedOn` ao `ServiceRequest` correspondente; existência de **fluxo federal = `[NC]`**. |

**Não-regressão do Ciclo 1 (display ≠ semântica):** a UI **continua** consolidando *"Pedido de Doppler colorido venoso de membro inferior — bilateral"* em **um card** — isso é **display** e permanece inalterado. Internamente são **dois `ServiceRequest` agrupados**. A decisão **não** altera o baseline homologado da interface (regra de mudança, Protocolo §17).

**Fechamento final:** a escolha entre *default (dois)* e *variante (um bilateral)* só se fecha contra o **perfil BR-Core/RNDS + terminologia vigente** (`[NC-artefato]`). Até lá, o canônico é **dois agrupados** — degrada com segurança e **não perde granularidade**.

## 5. Vínculo Pedido → Resultado (estrutural, não heurístico)
```
ServiceRequest ──basedOn── DiagnosticReport ──result──> Observation
                                     └──imagingStudy──> ImagingStudy (quando aplicável)
```
Preservar `pedido_id` + `resultado_id` com relação **equivalente ao `basedOn` FHIR**. `fulfills_order_id` deve ser revisado para garantir: **DDL, FK, integridade referencial, cardinalidade** (1 pedido → N resultados; 1 pedido → N procedimentos; resultados **parciais**), e **auditoria do vínculo**. Isto é **modelo estrutural** — distinto da futura *sugestão automática* de vínculo (que é funcionalidade, não modelo).

**Comportamento do vínculo (Protocolo v1.0 §6):** quando um resultado é inserido e há pedido compatível, a SINTERA **sugere o vínculo de forma explícita e confirmável** — **nunca** vínculo silencioso quando houver ambiguidade. Sinais de correspondência: paciente, código/tipo, lateralidade, data, estabelecimento, profissional, identificadores. Havendo múltiplos candidatos, **apresentar a lista**; **registrar a confirmação e a origem** do vínculo; manter pedido e resultado como **entidades distintas**.

## 6. Camada de terminologia (transversal)
Para cada conceito clínico relevante:
```
conceito SINTERA → code → system → display → version   (+ proveniência da codificação)
```
Aplicar a: exames, pedidos, resultados, medicamentos, diagnósticos, procedimentos, profissionais, estabelecimentos.
- **LOINC** p/ identificação de exame/teste [Ev5][Ev8]; **SNOMED CT** onde aplicável [Ev7]; **UCUM** p/ unidades quantitativas; **GAL/Tabela SUS** conforme perfil RNDS.
- **Não inventar LOINC.** Fluxo: identificar conceito → verificar código aplicável → registrar quando houver correspondência válida → **manter texto original** → registrar `system` → **preservar proveniência da codificação** → se não houver código adequado, **registrar explicitamente a ausência**. Objetivo = interoperabilidade semântica verdadeira, não preencher campo.

## 7. Identidade e atores (estrutura de identificadores)
Separar **identidade local** (`patient_id` SINTERA) de **identificadores nacionais** — **nunca** substituir o interno pelo CPF.
```
Patient.identifier[] = { system, value, period, assigner(origem), use, status/verificação }
   ├── local (urn:sintera:patient)
   ├── CPF
   ├── CNS
   └── outros
Practitioner: nome, CPF (quando aplicável), CRM, UF, CNS, outros
Organization: nome, CNPJ, CNES, endereço
```
Não deixar profissional/estabelecimento como string. Buscar artefatos **BR-Core/RNDS** para indivíduos, profissionais e estabelecimentos antes de estender.

## 8. Datas (semântica separada) e Proveniência
**Datas** — não colapsar em um único `created_at`: data do **pedido**, de **realização**, de **coleta**, de **emissão**, de **publicação**, de **importação**, de **atualização**.
**Proveniência** — todo dado importado responde "de onde veio?", preservando o original:
```
source_system · source_organization · source_document_id · source_document_hash
imported_at · extracted_at · extraction_method · verified_at · verified_by
original → extracted → normalized → FHIR   (sem perder o original)
```
**Documento original preservado** (Lei 13.787/2018 [Ev-13787]): integridade, autenticidade, confidencialidade. Separar **documento original + dados estruturados derivados + proveniência + auditoria**. A extração é representação derivada, **não** substitui o original.

## 9. Governança, consentimento, auditoria, segurança (transversal)
- **LGPD [Ev-LGPD]:** dados de saúde = sensíveis → finalidade, base legal, minimização, controle de acesso, rastreabilidade, direitos do titular, retenção, eliminação, governança de terceiros, incidentes, transferência internacional. **Consentimento ≠ base legal.** Separar finalidades: interno · compartilhamento · transmissão · consulta · disponibilização · assistencial · secundário · pesquisa · analytics · IA.
- **`Consent`:** titular/finalidade/escopo/fonte/destinatário/tipos/período/versão do termo/status/revogação/evidência — não `consent = true`.
- **`AuditEvent`:** quem criou/viu/alterou/excluiu, quando, origem, finalidade, sessão, resultado — **desde o início**, não feature futura.
- **Segurança:** cripto em trânsito/repouso, gestão de chaves, RBAC/ABAC, menor privilégio, MFA administrativo/profissional, segregação de ambientes, secrets, logs protegidos, monitoramento, backup/DR, gestão de vulnerabilidades/incidentes.
- **Papéis:** definir **controlador × operador × suboperadores** (jurídico + contratual + arquitetural + fluxos). **RIPD** [Ev-ANPD] como entregável obrigatório interno.

## 10. Enquadramento regulatório (limites do produto — preservar)
- **ANVISA/SaMD [Ev-ANVISA]:** manter a definição — *a SINTERA organiza, integra e contextualiza informações para apoiar continuidade do cuidado e decisão por pessoas/profissionais autorizados; **não** realiza diagnóstico, **não** substitui avaliação clínica, **não** produz recomendação terapêutica.* Esse limite permanece na documentação e nas specs funcionais.
- **Prontuário / Lei 13.787/2018:** diferenciar **arquivo pessoal organizado pelo usuário** de **registro eletrônico de saúde/prontuário assistencial profissional** (consequências jurídicas/técnicas distintas). Se caracterizado prontuário, aplica-se a guarda mínima de **20 anos** a partir do último registro (regra geral, sujeita a normas específicas) → política de **retenção/descarte** formalizada. Classificação é **análise jurídica** dependente do produto/uso.
- **CFM 2.314/2022 [Ev-CFM]:** se houver uso como SRES por profissionais em contexto assistencial, avaliar requisitos (representação, terminologia, interoperabilidade, sigilo, assinatura). **Não** concluir automaticamente que toda a SINTERA é SRES — depende do modelo de uso/responsabilidade.

## 11. Fronteira FHIR × RNDS × OpenCare
- **FHIR/BR-Core:** capacidade técnica **aproveitável agora**, independente de endpoint. Modelar imagem em FHIR (`ServiceRequest`/`ImagingStudy`/`DiagnosticReport`/`Observation`/`DocumentReference`/`Media`) **mesmo sem** fluxo RNDS de imagem.
- **RNDS:** infraestrutura federal; **REL laboratorial aplicável nacionalmente** (Portaria 8.276/2025 [Ev3]) — porém docs técnicos podem estar defasados (**conflito documental**). **Imagem/Doppler = `[NC]`**: a existência de fluxo/perfil federal aplicável **deve ser confirmada no IG/contrato vigente antes de qualquer transmissão**. **Ausência de evidência ≠ evidência de ausência.**
- **OpenCare [Ev12]:** ecossistema (descentralização, consentimento granular, tokenização, auditoria, visualização efêmera, FHIR) — **referência arquitetural e parceiro potencial**, **não** norma substitutiva. Princípio útil à SINTERA: **não centralizar dados de terceiros sem necessidade** — distinguir dado que a SINTERA **possui** de dado que apenas **consulta** (reduz superfície de risco/governança/duplicação).

## 12. Validação automática (pipeline futuro — definição)
```
SINTERA resource → FHIR R4 validation → BR-Core validation → RNDS profile validation → terminology validation → security checks → accept/reject
```
Nenhum payload destinado à RNDS deve sair sem validação contra o perfil correspondente. Separar credenciais/certificados de **homologação × produção**; **nenhum certificado no app mobile**; certificados via *Integration Gateway* (TLS/ICP-Brasil).

## 13. Reavaliação do #117 (Fase 0) à luz deste modelo
**Não** executar #117 só por ter sido validado localmente. Verificar, antes de merge, se `exam_documents` atende: documento original; múltiplos documentos; relação com **resultado**; relação com **pedido**; **proveniência**; tipo semântico; **integridade**; **auditoria**; **projeção futura para `DocumentReference`**. E rever `fulfills_order_id` como parte de **`ServiceRequest`→resultado** (DDL/FK/cardinalidade/resultados parciais/pedido multi-procedimento/auditoria do vínculo). Conclusão do gate de #117 sai **após** aprovação deste modelo.

## 13.1 Fase C — PRIMEIRO PASSO (proposta, NÃO executar — aguarda próximo gate)
Escopo mínimo, aditivo e reversível; **read/design antes de qualquer DDL**. **Não** inclui RNDS/OpenCare, terminologia populada, nem UI.

**Passo C-1 — Auditoria de reconciliação do #117 contra o modelo canônico (documental, sem executar a migração).**
Confrontar a migração 137 (`exam_documents`, `primary_document_id`, `exam_document_id`, formalização de `fulfills_order_id`/`order_status`) com:
1. **`ServiceRequest` (§4/§4.1):** o schema precisa comportar **pedido com N procedimentos** e **dois `ServiceRequest` agrupados por `requisition`** (Identifier de requisição comum) — verificar se `medical_order` como linha única de `exams` **impede** isso ou exige entidade/ტabela de solicitação de 1ª classe com `code` (coding+text) e `bodySite`.
2. **Vínculo `basedOn` (§5):** `fulfills_order_id` precisa de **DDL+FK+cardinalidade** e suportar **resultados parciais por lado** e **origem/auditoria do vínculo** (Protocolo §6). Avaliar se um único `fulfills_order_id` em `exams` é suficiente ou se o vínculo é **por procedimento/lado**.
3. **`DocumentReference` (§3):** `exam_documents` deve projetar para `DocumentReference` (documento original preservado + proveniência) — confirmar campos de integridade/hash/tipo/uploaded_at/extraction_version.
4. **Identidade/terminologia (§6/§7):** confirmar que o schema **não fixa** texto livre onde o modelo exige `code/system/display/version` e identificadores estruturados (não bloquear evolução).

**Entregável do C-1:** parecer `EXDOC-00x_RECONCILIACAO_117_vs_CANONICO.md` com veredito **merge #117 como está × ajustar × substituir**, itens de DDL faltantes (ex.: entidade de solicitação, `requisition`, vínculo por lado) e **plano aditivo/reversível**. **Sem** aplicar schema.

**Gate C-1 → C-2:** só após sua aprovação do parecer C-1 é que se define a **primeira migração** (Passo C-2), sempre sob a **regra de mudança (Protocolo §17)** e sem tocar o baseline homologado do Ciclo 1.

## 14. Entidades canônicas mínimas (não implementar agora — não impedir depois)
`Patient` · `Practitioner` · `PractitionerRole` · `Organization` · `HealthcareService` · `Encounter` · `ServiceRequest` · `Procedure` · `DiagnosticReport` · `Observation` · `ImagingStudy` · `Specimen` · `MedicationRequest` · `Medication` · `MedicationStatement` · `Immunization` · `AllergyIntolerance` · `Condition` · `DocumentReference` · `Media` · `Device` · `Coverage` · `Provenance` · `Consent` · `AuditEvent` · `Identifier` · `Terminology`/`CodeSystem`/`ValueSet`.

## 15. Decisões preservadas / correções de premissa
1. **`ServiceRequest` é a representação semântica do pedido** — confirmado por FHIR R4 [Ev1] e exemplificado em IG estadual SES-GO [Ev9]. `medical_order` permanece como **classificação interna**, com **projeção clara `medical_order → ServiceRequest`**.
2. **Rótulo "Pedido de …" = decisão de produto** [BEST PRACTICE], **não** exigência FHIR/RNDS. Semântica interoperável nos recursos/códigos.
3. **Imagem/Doppler federal RNDS = `[NC]`** — **não** afirmar "RNDS não suporta imagem"; confirmar no IG/contrato vigente. Modelar imagem em FHIR de todo modo.
4. **FHIR-first, BR-Core-aligned, RNDS-ready, NÃO RNDS-dependent.**

## 16. Fontes
As mesmas de `INTEROPERABILITY-COMPLIANCE-MATRIX.md` §6 ([Ev1]–[Ev12], [Ev-LGPD], [Ev-13787], [Ev-ANPD], [Ev-ANVISA], [Ev-CFM]) + evidências de repositório `[R]` (arquivos citados na §2).

> **Gate FECHADO.** Este documento **define semântica**, não implementa. Nenhuma tabela/coluna/FK/terminologia/wiring/UI/integração criada. Próximo passo = aprovação da fundadora **deste modelo + da matriz**; só então (Fase C) começa alteração de banco/kernel, iniciando pela reavaliação do #117.

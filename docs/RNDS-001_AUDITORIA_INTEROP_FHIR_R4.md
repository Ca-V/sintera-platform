# RNDS-001 — Auditoria de Interoperabilidade + Gap Analysis (RNDS / FHIR R4)

**Status:** AUDITORIA READ-ONLY + GAP ANALYSIS (PROPOSTA) — nada implementado. Nenhuma alteração de código, banco ou dados. **2ª rodada de verificação externa incorporada (ver §3-bis):** REL V2, "LOINC obrigatório" e a lista fechada de recursos foram **rebaixados a hipóteses**; pivô imagem × laboratório registrado. O gap analysis **não deve ser congelado** até a matriz de domínios (§3-bis) ser fechada contra o IG vigente.
**Objetivo:** entender exatamente onde a SINTERA está em relação à RNDS/FHIR R4 **antes** de abrir qualquer PR de implementação. Não criar endpoints FHIR agora.
**Método:** 4 frentes de leitura no código/banco + fonte oficial da RNDS.

> **Limitação declarada (importante):** o proxy de egresso **bloqueia** os hosts oficiais (`rnds-fhir.saude.gov.br`, `hl7.org.br`) para leitura completa. O contrato RNDS abaixo foi montado a partir de **trechos oficiais** (busca) + FHIR R4 base. **Os perfis, cardinalidades e o escopo vigente precisam ser confirmados no Guia de Implementação da RNDS ao vivo** — não foram congelados a partir de memória.

---

## 1. Estado da homologação — freeze RECONCILIADO (última conferência)

⚠️ **Os documentos de homologação (`HOMOLOGATION_PLAN_v1`, `MOBILE-037`) estão ATRASADOS em relação ao código.** Eles ainda descrevem H-09/H-10/H-11/H-12 como "investigação/proposto", mas essas correções **foram implementadas e estão na linha de homologação** (branch `feat/mobile-inc4-perfil` / PR #110, deploy de preview). Abaixo o estado **real do código**, não o dos docs. **Housekeeping pendente:** atualizar os docs para refletir os merges (sync de documentação — NÃO é reabrir os itens).

| ID | Título curto | Estado REAL (código) | Classificação de freeze |
|---|---|---|---|
| H-09 | Pedido classificado como exame realizado (imaging) | ✅ corrigido (roteamento, `resolveImageDocumentType`) — na linha de homologação/preview | FECHADO (código+preview); validar em produção no merge do #110 |
| H-10 pedido (`ab5b5816`) | Nome/lateralidade (unilateral→bilateral) | ✅ **corrigido + VALIDADO no dado real** (#111 consolidação + #112 propagação) | **FECHADO E CONGELADO** — não reabrir |
| H-11 | "Possível duplicado" desformatado (só apresentação) | ✅ corrigido (apresentação isolada) — preview | FECHADO (código); validar em device |
| H-12 | Rótulo "Adicionar exame realizado" → "pedido" | ✅ corrigido | FECHADO (código) |
| H-03 | Hierarquia do detalhe do exame (Web) | ✅ corrigido (conteúdo antes de financeiro) | FECHADO (código); parte Mobile pendente |
| H-04 | "Minha Saúde" abre Exames em vez do menu (Mobile) | ✅ corrigido (1 linha) | FECHADO (código); revalidar em device |
| H-05 | "Erro desconhecido" (migração 136 não aplicada) | ✅ corrigido server-side (migração aplicada) | FECHADO (server); revalidar em device |
| H-01 | INP ~216ms ("Extrair novamente") | ⏳ a validar em produção | ABERTO — sem defeito funcional; provável ambiental |
| H-02 | Sidebar subdivisões abertas por padrão | ⏸️ registrada | **CONGELADO** — baseline de navegação; só com exceção explícita |
| H-06 | "Acesso rápido" Web×Mobile divergente | ⏸️ decisão de produto | ABERTO |
| H-07 | Config · DDD/país (WhatsApp) | ⏳ a detalhar | ABERTO |
| H-08 | "Nova medida" desformatado (Composição) | ⏳ a detalhar | ABERTO |

**Série D (MOBILE-037):** por reconciliação de 15/08, "nenhum defeito de código aberto"; a maioria fechada em código aguardando revalidação em device. Abertos = decisões de produto/clínica (D-05, D-10, D-12) e revalidação de deploy (D-02). Backlog/roadmap = D-13, D-14 (MOBILE-038).

**Bottom line do freeze:** o ciclo funcional está **majoritariamente fechado em código** (na linha de homologação/preview). Congelados de verdade: **H-02** (navegação) e **H-10 pedido** (validado). O passo que falta para "congelar" a homologação é **produto**: última conferência em device/produção + merge do #110. **Não** há necessidade de reabrir itens já corrigidos.

---

## 2. Modelo interno SINTERA (Camada A) — o que existe hoje

O modelo real vive em **~137 migrações**; `schema.sql` é só a semente. Entidades clínicas mapeadas:

| Entidade clínica | Como existe hoje | Identificadores presentes | Ausências críticas p/ RNDS |
|---|---|---|---|
| **Paciente** | `profiles` (1:1 auth.users); `exams.patient_name` (texto) | `user_id` (uuid) | **sem CPF, sem CNS/cartão SUS, sem data de nascimento (só `age_range`), sem sexo biológico** |
| **Profissional** | `exams.requesting_physician` (texto); `health_events.professional_name/kind` | — | **sem tabela, sem CRM, sem CNS** |
| **Organização** | `exams.issuer` (texto) | — | **sem tabela, sem CNES, sem endereço/telecom** |
| **Pedido** | `document_type ∈ {medical_order, insurance_guide}`; domínio `orderStatus`/`careFlow` | — | **`order_status`/`fulfills_order_id` NÃO têm DDL** (só no DTO/domínio) — vínculo pedido↔resultado não persistido |
| **Exame/Resultado** | `exams` + `biomarkers`/`current_biomarkers` (view) + `clinical_results` + `omics_*` + `body_metrics` | ids internos, `catalog_id`, `extraction_version_id` | unidades **texto livre (não UCUM)**; 2 modelos paralelos de resultado |
| **Procedimento** | `modalities` (7 códigos internos), `exams.modality_code` | `modality_code` interno | **sem TUSS/CBHPM/SIGTAP** |
| **Documento** | `exams.file_url`, `document_sha256`, `extraction_versions` | sha256 | multi-documento (`exam_documents`) **proposto, não construído** (ADR-EXDOC-001) |
| **Datas** | `exam_date` (uma coluna); `semantic-dates.ts` computa coleta/realização/liberação… | — | sub-tipos de data **colapsados** em `exam_date` (FHIR distingue) |
| **Terminologia** | `TerminologyRef` (contrato), `biomarker_catalog.loinc_code/snomed_ct_code` | — | `lookupOfficialTerminology` = **stub**; LOINC/SNOMED **0% populados**; CID-10 ausente |

**Base de proveniência (forte — matéria-prima para FHIR Provenance/DocumentReference):**
- `src/lib/provenance/index.ts` — modelo `Provenance`/`DocumentMeta` (`url/type/date/issuer/hash/…`) → mapeia quase 1:1 para **DocumentReference**.
- `PipelineAudit`/`understanding_report` (decisionLog + evidências aceitas/rejeitadas) + `resolution_id` + `representation_fingerprint` + `extraction_versions`/`document_sha256` + `ai_processing_log` → trilha de **Provenance** (activity/agent/entity) pronta.
- `UcdaItem` (`ucda.ts`) — `code/codeSystem/valueNum/valueText/region/anatomy/specimen/method/referenceText/page` — **julgado FHIR R4/BR-Core mapeável** (V2_ARCHITECTURE_GAP_ANALYSIS §1, gap BAIXO).

**Interoperabilidade hoje: ZERO implementação.** Nenhum builder FHIR, serializer de Bundle, cliente RNDS ou terminology server. Só arquitetura "adapter-ready" + gates explícitos "NÃO IMPLEMENTAR agora" (V2_ARCHITECTURE_GAP_ANALYSIS `:93,:96`). Enum `'rnds'`/`'lab_api'` existem como rótulos de origem de captura, sem adaptador.

**LGPD/consentimento:** `consent_records` (por tipo+versão, com hash/ip/user-agent) e `report_shares` (compartilhamento por token). **Gaps conhecidos p/ envio à RNDS:** consentimento **por destinatário** e **log de acesso** — ambos ausentes (V2 gap `:92`).

---

## 3. Contrato RNDS / FHIR R4 (Camadas B/C) — do guia oficial (A CONFIRMAR no IG vigente)

Da fonte oficial (busca; fetch bloqueado):
- **FHIR 4.0.1.** Envio de resultado de exame laboratorial (**REL**), perfil **V2** (`BRResultadoExameLaboratorial`), via **Bundle** (contêiner que agrupa os recursos).
- **Recursos no Bundle (REL) — HIPÓTESE, ver §3-bis:** `Bundle (type=document)` → `Composition` → `Observation` + `Specimen` + `Patient`/`Organization`/`Practitioner` (grafo de referências). A **lista exata e as cardinalidades dependem do perfil/versão vigente** (V2 × 3.2.1) — **não congelar**.
- **Terminologias RNDS:** `BRNomeExameLOINC` (nome do exame via **LOINC**), `BRNomeExameGAL` (classificação GAL), `BRResultadoQualitativoExame` (resultado qualitativo). → **HIPÓTESE (ver §3-bis):** LOINC aparece como sistema de nome de exame, mas a **obrigatoriedade em todo cenário não está confirmada** (a RNDS também usa GAL) — gap a confirmar no perfil vigente.
- **Identificadores:** **CNS** (Cartão Nacional de Saúde, paciente) e **CNES** (estabelecimento) são identificadores centrais da RNDS; CPF/CNPJ conforme perfil. **Confirmar cardinalidades**.
- **Autenticação/ambiente:** integração exige **certificado** (ICP-Brasil/X.509, provável mTLS) + ambientes de homologação/produção + processo de **homologação RNDS**. **Confirmar no portal.**
- ⚠️ **Nuance de escopo (a confirmar):** o **exemplo** documentado do REL historicamente estava **restrito a COVID-19 e Monkeypox** (doenças de notificação). É preciso confirmar no IG vigente se o escopo de resultado laboratorial foi **ampliado** para exames gerais — isso muda drasticamente a aplicabilidade para a SINTERA.

**Fontes oficiais (a abrir num ambiente com egresso liberado):**
- IG RNDS FHIR: `https://rnds-fhir.saude.gov.br/`
- REL V2: `https://rnds-fhir.saude.gov.br/rel-v2.html`
- CodeSystems: `BRNomeExameLOINC`, `BRNomeExameGAL`, `BRResultadoQualitativoExame`
- Guia/Modelo Computacional REL: `https://rnds-guia.saude.gov.br/docs/rel/mc-rel/`
- Homologar: `https://rnds-guia.saude.gov.br/docs/publico-alvo/ti/homologar/`
- BR-Core DiagnosticReport: `https://hl7.org.br/fhir/core/StructureDefinition-br-core-diagnosticreport.html`

---

## 3-bis. Verificação externa (2ª rodada) — CONFIRMADO × HIPÓTESE

> Honestidade: os hosts oficiais seguem **bloqueados para fetch** neste ambiente; as confirmações abaixo vêm de **busca em fontes oficiais/estaduais** + verificação direta da fundadora nos artefatos oficiais da RNDS.

**✅ CONFIRMADO (alta confiança):**
- FHIR **4.0.1** é a base da RNDS.
- RNDS usa recursos/perfis FHIR; resultado laboratorial tem **representação estruturada**.
- Envio como **Bundle `type=document`** com **Composition** + Observation + Specimen + recursos relacionados (grafo de referências) — **não** "mandar um JSON de exame".
- Existe o perfil **`BRResultadoExameLaboratorial-3.2.1`** (derivado de **Composition**) **além** de exemplos "REL V2" — **há versões diferentes** no IG oficial.
- A **Composition** (3.2.1) exige `status`/`type`/`subject`/`date`/`author`/`title`/`section` + referências a indivíduo / pessoa jurídica-profissional / estabelecimento de saúde / condição de saúde / diagnóstico laboratorial.
- **Autenticação:** certificado **ICP-Brasil A1** (`.pfx`/`.p12`; A3/token **não** suportado em API), **mTLS (2-way SSL)** + token JWT; **credenciamento vinculado a CNES** via Portal de Serviços DATASUS; produção só após testes no ambiente de **homologação**.
- **Paciente** identificado por **CPF e/ou CNS**.
- RNDS tem **terminologias próprias** (ex.: **`BRNomeExameGAL`** — classificação GAL; ValueSets/CodeSystems de resultado qualitativo; NamingSystem `BRCategoriaDiagnostico`).
- Notificar resultado é análogo a enviar **RAC** (Registro de Atendimento Clínico) / **Sumário de Alta** — a RNDS tem **múltiplos tipos de documento FHIR**, não só REL.
- Escopo do **MI REL:** historicamente COVID-19; ampliado pela **Portaria nº 3.328/2022** (Monkeypox + características mais gerais de registro laboratorial; novos atributos "Suspeita Diagnóstica" e "Patógeno").

**🟡 NÃO CONGELAR (hipótese / a confirmar no IG vigente):**
- **Qual versão/perfil REL** é o contrato vigente aplicável (**V2 × 3.2.1 × outro**).
- **Lista definitiva de recursos obrigatórios** e **cardinalidades**.
- **"LOINC obrigatório em todo cenário"** — a RNDS usa GAL/terminologias próprias; LOINC pode ser exigido em parte, não necessariamente em tudo → **gap a confirmar**.
- **Domínio de imagem:** para imagem/laudo, o padrão observado (fonte parcialmente **estadual — SES-GO**, ≠ RNDS federal) usa **DiagnosticReport + ServiceRequest + Media (índice de imagens/PACS) + Patient (CPF/CNS)**. **Confirmar** se a RNDS **federal** tem perfil próprio de resultado de imagem.

**⚠️ Pivô arquitetural (decisão de sequência):** o caso que acabamos de homologar — **Doppler colorido venoso de membro inferior** — é **diagnóstico por IMAGEM**, **não** laboratório. Logo, **REL (laboratorial) pode NÃO ser o primeiro domínio aplicável** à SINTERA. Iniciar a implementação por REL antes de confirmar o perfil de imagem seria erro de sequência.

**Consequência para a arquitetura:** projetar **SINTERA → modelo clínico interno → grafo de recursos FHIR → Bundle (document/Composition) → RNDS** — nunca a partir do `display_title`. A base de **proveniência** da SINTERA (evidência → extração → interpretação → dado estruturado) é exatamente o que sustenta isso.

### Matriz de domínios (a FECHAR na 2ª auditoria oficial, antes da Camada A)

| Domínio | Perfil RNDS vigente | FHIR | Recursos | Terminologias | Identificadores | Obrigatoriedades |
|---|---|---|---|---|---|---|
| **Laboratório** | REL **V2 × 3.2.1** — a confirmar | 4.0.1 ✅ | Bundle/Composition/Observation/Specimen (+?) — a confirmar | GAL/LOINC/qualitativo — a confirmar | CPF/CNS (pac.), CNES (estab.) — cardinalidade a confirmar | a confirmar |
| **Imagem** | a confirmar (federal × estadual) | 4.0.1 ✅ | DiagnosticReport/ServiceRequest/Media/Patient (indício estadual) — a confirmar | a confirmar | CPF/CNS — a confirmar | a confirmar |
| **Pedido** | ServiceRequest — a confirmar | 4.0.1 ✅ | ServiceRequest (+ basedOn) — a confirmar | a confirmar | a confirmar | a confirmar |

**Bloqueio operacional:** fechar esta matriz contra o IG vigente exige leitura de `rnds-fhir.saude.gov.br` / `rnds-guia.saude.gov.br` / `hl7.org.br` — **hoje bloqueados pelo proxy deste ambiente**. Opções: **(a)** liberar egresso a esses hosts para eu fechar a matriz; **(b)** a fundadora compartilha os artefatos/páginas do perfil vigente e eu os transformo na matriz congelável. **Só depois da matriz fechada** se aprova a Camada A.

---

## 4. Mapeamento SINTERA → FHIR R4 (ponto de partida — NÃO definitivo)

| SINTERA (hoje) | FHIR R4 | Perfil BR/RNDS | Situação |
|---|---|---|---|
| `profiles` + `patient_name` | **Patient** | BRIndividuo / br-core-patient | **CRIAR** entidade + CNS/CPF/nascimento/sexo |
| `requesting_physician` | **Practitioner** (+PractitionerRole) | br-core-practitioner | **CRIAR** entidade + CNS/CRM |
| `issuer` | **Organization** | br-core-organization | **CRIAR** entidade + CNES |
| pedido (`medical_order`) | **ServiceRequest** | — | **CRIAR/PERSISTIR** (order_status/fulfills_order_id sem DDL) |
| `exams` (realizado) | **DiagnosticReport** | BRCoreDiagnosticReport | **ADAPTAR** (projetor) + LOINC |
| `biomarkers`/`clinical_results` | **Observation** | BR Observation | **ADAPTAR** (UcdaItem → Observation) + LOINC + UCUM |
| amostra (specimen em clinical_results) | **Specimen** | RNDS Specimen | **ADAPTAR/CRIAR** |
| `file_url` + `provenance/DocumentMeta` | **DocumentReference** + **Binary** | — | **ADAPTAR** (base forte) |
| `PipelineAudit`/`resolution_id`/fingerprint | **Provenance** | — | **ADAPTAR** (base forte) |

---

## 5. Gap analysis — JÁ ATENDE / ADAPTAR / CRIAR

### ✅ JÁ ATENDE (base sólida, mapeável)
- Modelo canônico **UCDA** FHIR R4/BR-Core-mapeável (code/valueX/bodySite/specimen/method/referenceRange).
- **Proveniência** rica (`provenance/index.ts`, `PipelineAudit`, `extraction_versions`, `fingerprint`) → Provenance/DocumentReference.
- **Contratos de código** já preveem terminologia (`TerminologyRef`, colunas `loinc_code`/`snomed_ct_code`/`code_system`/`value_code`).
- Arquitetura **adapter-ready** (conectores) — o "encaixe" para um adaptador RNDS.

### 🔧 ADAPTAR
- Projetor **UCDA/biomarkers/clinical_results → Observation/DiagnosticReport** (camada aditiva, sem tocar o domínio).
- Unidades **texto → UCUM**.
- **`exam_date` → sub-tipos** (coleta/realização/liberação) já computados por `semantic-dates.ts`, mas colapsados — FHIR precisa distinguir (`effective[x]`, `issued`, `Specimen.collection`).
- **Consentimento por destinatário** + **log de acesso** (hoje ausentes) — pré-requisito LGPD/RNDS para envio.

### 🚧 CRIAR (net-new — os bloqueadores)
1. **Entidades Patient/Practitioner/Organization** (hoje texto livre em `exams`) + **identificadores oficiais**: **CPF, CNS, data de nascimento, sexo** (paciente); **CRM/CNS** (profissional); **CNES** (organização). **Sem CNS/CNES não há como enviar à RNDS — bloqueador nº 1.**
2. **Persistência do Pedido (ServiceRequest)** — resolver a **lacuna de schema** `order_status`/`fulfills_order_id` (sem DDL). *(Pré-requisito compartilhado com o exam_documents.)*
3. **Resolução de terminologia ao vivo** — hoje **stub** (backlog C7), cobertura LOINC **0/83**. ⚠️ **Correção (§3-bis):** "LOINC obrigatório em todo cenário" **NÃO está confirmado** — a RNDS usa terminologias próprias (GAL/`BRNomeExameGAL`, ValueSets de resultado qualitativo). **LOINC = gap a confirmar conforme o perfil vigente.** Terminologia ao vivo é gap real de qualquer modo (bloqueador de conformidade, sistema a definir).
4. **Camada de projeção FHIR** (resource builders + serializer de **Bundle** REL).
5. **Cliente RNDS** — autenticação por **certificado** (ICP-Brasil/mTLS), ambientes, operações, tratamento do identificador retornado pela RNDS.
6. **Testes de conformidade** (validação FHIR + perfis RNDS) e **homologação RNDS**.

---

## 6. Ordem recomendada (com pré-requisitos)

```
CONGELAR HOMOLOGAÇÃO ATUAL  (última conferência em device/prod + merge #110)
        ↓
PRÉ-REQUISITO: reconciliar schema (order_status/fulfills_order_id sem DDL)  ← compartilhado com exam_documents
        ↓
CAMADA A — completar o modelo interno: entidades Patient/Practitioner/Organization + identificadores (CPF/CNS/CNES/CRM/nascimento/sexo)
        ↓
Terminologia ao vivo (LOINC) — destravar backlog C7 (bloqueador de conformidade)
        ↓
CAMADA B — projetor SINTERA → FHIR R4 (Observation/DiagnosticReport/Patient/…/Provenance/DocumentReference) — ADITIVO
        ↓
CAMADA C — perfis/contrato RNDS (REL v2, Bundle) + cliente (certificado, ambientes)
        ↓
Consentimento por destinatário + log de acesso (LGPD/RNDS)
        ↓
Testes de conformidade → homologação RNDS
```

**Fora deste ciclo (backlog):** `exam_documents` (ADR-EXDOC-001) e correção do `0f5ec205`.

**Confirmar antes de qualquer implementação (pré-requisito de decisão):** abrir o **IG vigente da RNDS** (num ambiente com egresso liberado) para confirmar (a) o **escopo atual** do REL (COVID/Monkeypox vs. exames gerais), (b) os **perfis e cardinalidades** obrigatórios, (c) **identificadores** exigidos, (d) o **processo de homologação** e certificados. Só então congelar a lista de recursos FHIR.

---

## 7. Riscos e invariantes
- **Bloqueadores de dados:** sem CNS/CPF/CNES e sem LOINC nos resultados, o envio à RNDS é inviável — priorizar Camada A + terminologia.
- **Escopo RNDS:** se o REL vigente ainda é restrito a notificáveis, a aplicabilidade para exames gerais da SINTERA precisa ser reavaliada (talvez outro fluxo/documento RNDS seja o alvo).
- **LGPD:** enviar dados à RNDS exige base de consentimento por destinatário + auditoria de acesso — hoje ausentes.
- **Preservar invariantes existentes:** UCDA puro; proveniência de todo fato; sem virar "FHIR Server" nem "RNDS por aproximação" (DEV-001 §129).
- **Não implementar endpoints FHIR direto** sem o mapeamento A→B→C fechado.

---

## 8. Plano faseado (aprovado) + artefatos oficiais necessários (Fase 1)

**Regra:** NÃO começar pela Camada A (entidades) nem por REL antes de fechar o contrato oficial para os **3 domínios** que a SINTERA precisa: **Laboratório, Imagem, Pedido**. O caso homologado (Doppler = imagem) tornou isso obrigatório.

**Ordem (plano congelado — não é autorização de implementação):**
1. **Fase 1 — Auditoria normativa RNDS/FHIR** (esta): versão vigente do IG; perfis oficiais para imagem/laboratório/pedido; recursos (Composition/DiagnosticReport/Observation/ImagingStudy/ServiceRequest/DocumentReference/Media) **só quando previstos pelo contrato aplicável**; terminologias; identificadores; cardinalidades/regras; autenticação/credenciamento — separando **confirmado / inferido / não confirmado**.
2. **Fase 2 — Matriz de interoperabilidade** (Domínio × Recurso FHIR × Perfil RNDS × Terminologia × Identificador × Obrigatoriedade) — congelada só com evidência oficial suficiente.
3. **Fase 3 — Arquitetura interna SINTERA** (Patient/Practitioner/Organization/identificadores/resultados/pedidos/proveniência/terminologias/relacionamento documento↔evento clínico).
4. **Fase 4 — Projetor FHIR** · 5. **Fase 5 — Integração RNDS** · 6. **Fase 6 — Homologação RNDS**.

**Artefatos oficiais necessários para fechar a Fase 1/2** (hosts hoje **bloqueados** neste ambiente — preciso de egresso liberado OU do conteúdo colado):
- **IG (versão/publicação):** `rnds-fhir.saude.gov.br/` (home + `qa.html`).
- **Laboratório:** StructureDefinition `BRResultadoExameLaboratorial` (**V2 e 3.2.1**) + a Composition + Bundle exemplo (document); perfis Observation/Specimen; CodeSystems `BRNomeExameLOINC` / `BRNomeExameGAL` / `BRResultadoQualitativoExame`.
- **Imagem:** buscar no IG **federal** perfil de resultado/laudo de imagem (ImagingStudy/Media/DiagnosticReport/DocumentReference); confirmar se é federal ou só estadual (SES-GO).
- **Pedido:** perfil de **ServiceRequest**/solicitação, se houver.
- **Entidades:** perfis Patient/Practitioner/Organization + identificadores exigidos (CPF/CNS/CNES/CNPJ) e cardinalidades.
- **Transversal:** lista de tipos de documento RNDS (REL/RAC/SA/…); Manual de Integração (Barramento) — certificado A1, mTLS, credenciamento CNES, ambientes.

**Congelados (sem mudança oportunista):** H-10 pedido `ab5b5816`, PRs #111/#112, `0f5ec205`, `exam_documents` (#113). #114 permanece **auditoria**, não autorização de implementação.

---

## 9. 2ª auditoria (busca oficial) — matriz preliminar + ACHADO ESTRATÉGICO

> Fonte: busca em domínios oficiais (`rnds-fhir.saude.gov.br`, `rnds-guia.saude.gov.br`, `gov.br`, `hl7.org.br`) — **fetch completo ainda bloqueado**; cardinalidades exatas dependem de abrir os StructureDefinitions.

**Documentos/serviços VIVOS na RNDS federal (confirmado):** RIA (imunização), **REL** (exames laboratoriais — portfólio de produção descrito como **COVID‑19**), RAC (Registro de Atendimento Clínico), SA (Sumário de Alta), dispensação de medicamentos. **Não há documento de resultado de exame de IMAGEM.**

### Matriz preliminar (grau de certeza por célula)

| Domínio | Perfil RNDS federal | FHIR | Recursos | Terminologias | Identificadores | Status |
|---|---|---|---|---|---|---|
| **Imagem** | ❌ **inexistente/não implementado** (DiagnosticReport "not yet implemented in RNDS"; padrão DiagnosticReport/ImagingStudy/Media só em **BR-Core/estadual SES-GO**) | R4 4.0.1 | — (federal) | — | CPF/CNS | 🔴 **SEM CONTRATO FEDERAL HOJE** |
| **Laboratório** | ✅ `BRResultadoExameLaboratorial` **V2 e 3.2.1** (baseado em **Composition**) | R4 4.0.1 | Bundle(document) + Composition + Observation + Specimen + Patient/Organization/Practitioner | `BRNomeExameLOINC` (LOINC) / `BRNomeExameGAL` / resultado qualitativo | CNS, CNPJ, CNES + **id de solicitante atribuído pela RNDS** | 🟡 existe, mas **portfólio de produção = COVID‑19** (ampliação a confirmar) |
| **Pedido** | ⚠️ sem documento clínico de envio próprio | R4 4.0.1 | `ServiceRequest` aparece como **referência** dentro de outros modelos, não como documento enviável | — | id do solicitante (credenciamento) | 🟠 **provavelmente não é domínio de envio autônomo** |

**Confirmado (alta):** FHIR 4.0.1; lista de documentos vivos; REL é Composition/Bundle (V2 + 3.2.1); imagem **não** implementada na RNDS; identificadores CNS/CNPJ/CNES + id de solicitante RNDS; terminologias LOINC/GAL existem.
**A confirmar (fetch do IG):** cardinalidades exatas por perfil; qual versão REL vigente; se REL ampliou além de COVID/Monkeypox; obrigatoriedade de LOINC × GAL.

### ⚠️ Achado estratégico (impacto na decisão de produto)
A RNDS **não é um repositório geral de exames do paciente**. Os documentos vivos são fluxos específicos (resultado laboratorial de **notificação/COVID**, imunização, atendimento clínico, alta, dispensação). O **núcleo da SINTERA** — **exames de imagem (ex.: Doppler)** e **exames laboratoriais gerais** — **não mapeia para um documento RNDS federal vivo hoje**:
- **Imagem:** sem perfil/documento RNDS federal → **não há para onde enviar** o Doppler na RNDS agora.
- **Laboratório geral:** o REL existe, mas o portfólio de produção é de **notificação (COVID)** — enviar hemograma/rotina depende de confirmar ampliação de escopo.

**Consequência para a sequência:** antes de investir em Camada A/FHIR **para RNDS**, é uma **decisão de produto** definir o alvo real:
1. **Compatibilidade FHIR/BR-Core** (modelar internamente + projetar para FHIR R4/BR-Core) — útil e aplicável **já**, independente da RNDS; ou
2. **Transporte RNDS** — só faz sentido quando houver **documento RNDS aplicável** ao tipo de exame da SINTERA (hoje: nenhum para imagem; laboratório só no escopo de notificação).

Recomendação: **desacoplar "compatibilidade FHIR" de "envio à RNDS".** A primeira é evolução técnica aproveitável agora; a segunda depende de um contrato RNDS que, para o caso de uso atual da SINTERA (imagem), **ainda não existe** — e não deve ditar o modelo interno.

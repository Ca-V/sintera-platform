# INTEROPERABILITY-COMPLIANCE-MATRIX

> **Fase A — Arquitetura de interoperabilidade e adequação semântica/regulatória. READ-ONLY.**
> **NÃO** altera código, banco, schema, UI, wiring, integração, nem **#117/#114/#119**. É o **primeiro** dos dois
> artefatos exigidos antes de qualquer alteração de banco/kernel (o segundo é `SINTERA-FHIR-CANONICAL-MODEL.md`).
> **Data:** 2026-08-19 · **Gate:** FECHADO (implementação só após aprovação desta matriz + do modelo canônico).

## Princípio arquitetural (decisão a preservar)
**SINTERA é FHIR-first, BR-Core-aligned e RNDS-ready — mas NÃO RNDS-dependent.**
```
SINTERA Canonical Health Model
   → FHIR R4 / BR-Core (modelo canônico interno)
   → projetores/adaptadores específicos
   → RNDS / OpenCare / outros parceiros (só quando houver IG/fluxo/contrato aplicável)
```
- **Não** modelar o banco segundo uma tela da SINTERA nem segundo um documento específico da RNDS.
- **Não** criar um "modelo SINTERA-RNDS" proprietário nem campos próprios para conceitos que já têm recurso FHIR.
- **Pedido de exame = `ServiceRequest`** (semântica de solicitação), independente de existir fluxo RNDS para aquele exame.
- O rótulo de interface **"Pedido de …"** é **decisão de produto** [BEST PRACTICE], **não** exigência FHIR/RNDS. A semântica interoperável vive nos **recursos e códigos FHIR**, não na string.

## Categorias de requisito (para não confundir padrão com obrigação legal)
| Tag | Significado |
|---|---|
| **[LEGAL]** | Obrigação decorrente de lei/regulamento (ex.: LGPD, Lei 13.787/2018). |
| **[REGULATORY]** | Obrigação de órgão regulador (ANVISA, CFM, ANPD). |
| **[RNDS]** | Obrigação de perfil/contrato/IG da RNDS. |
| **[FHIR]** | Requisito do padrão HL7 FHIR R4. |
| **[BR-CORE]** | Diretriz do núcleo brasileiro de interoperabilidade (HL7 Brasil). |
| **[OPENCARE]** | Regra/arquitetura do ecossistema OpenCare (não normativo). |
| **[BEST PRACTICE]** | Boa prática técnica. |

## Legenda de status / evidência
- **Implementado:** ❌ ausente · 🟡 parcial/local · ✅ presente. Coluna reflete o **estado atual do repositório** (`feat/mobile-inc4-perfil`).
- **[R]** verificado no repositório (arquivo:linha). **[Ev#]** evidência documental (ver §Fontes). **[NC]** não confirmado por artefato. **[NC-artefato]** exigência confirmada, StructureDefinition/cardinalidade bruta pendente.
- **Confiança:** alta para FHIR R4/LGPD/BR-Core e caracterização da RNDS; **moderada** para cobertura futura de casos RNDS específicos (sobretudo imagem), que depende dos IGs/fluxos vigentes.

---

## 1. Matriz de conformidade
| # | Requisito | Cat. | Fonte · versão/data | Obrigatório? | Aplicável à SINTERA? | Implementado (estado atual) | Evidência | Gap · Prioridade |
|---|---|---|---|---|---|---|---|---|
| 1 | **FHIR R4** como modelo canônico interno | [FHIR][BR-CORE] | HL7 FHIR R4; BR-Core R1 | Sim (p/ interop adotada) | **Sim** | ❌ (existe só projetor puro #119, gated/fixture) | projetor `src/lib/fhir/*` (#119) [R] | Adotar FHIR como canônico · **P0** |
| 2 | **BR-Core** como base semântica nacional | [BR-CORE] | HL7 Brasil — Core do Brasil R1 [Ev7] | Conforme caso de interop | **Sim** | ❌ | — | Alinhar perfis BR-Core antes de extensões próprias · **P0/P1** |
| 3 | **`ServiceRequest`** = semântica do PEDIDO | [FHIR] | HL7 FHIR R4 [Ev1] | Sim (semântica) | **Sim** | 🟡 (convenção `document_type='medical_order'`; sem `code`/DDL) | `classification.ts:5`; `orderTitle.ts` [R] | Projeção `medical_order→ServiceRequest` com `code` · **P0** |
| 4 | **`DiagnosticReport`** = laudo/resultado | [FHIR] | HL7 FHIR R4 [Ev2] | Sim | **Sim** | 🟡 (modelo interno de resultado; sem recurso) | biomarkers/clinical_results [R] | Projeção resultado→DiagnosticReport · **P0** |
| 5 | **`Observation`** = resultado atômico | [FHIR] | HL7 FHIR R4 [Ev2] | Sim | **Sim** | 🟡 (`biomarkers`/`current_biomarkers`) | `biomarkers.ts` [R] | Mapear valor/unidade/ref/interpretação → Observation · **P0** |
| 6 | **`ImagingStudy`** = estudo de imagem | [FHIR] | HL7 FHIR R4 [Ev2] | Quando aplicável | **A avaliar** | ❌ | — | Modelar imagem em FHIR (independe de RNDS) · **P1** |
| 7 | **`DocumentReference`/`Media`** = documento original | [FHIR] | HL7 FHIR R4 | Sim | **Sim** | 🟡 (`exams.file_url`; `exam_documents` proposto em #117) | `provenance/index.ts`; #117 [R] | Projeção documento→DocumentReference · **P1** |
| 8 | **Vínculo Pedido→Resultado** (`basedOn`) estrutural | [FHIR][BEST PRACTICE] | HL7 FHIR R4 [Ev2] | Sim | **Sim** | 🟡 (`fulfills_order_id` **sem DDL/FK**) | `update.ts:16-17`; **0 migração** [R] | DDL+FK+cardinalidade+auditoria do vínculo · **P0** |
| 9 | **Terminologia** (LOINC) p/ exame | [BR-CORE][RNDS] | REL usa LOINC/`code` [Ev5]; MS×Abramed 2025 [Ev6]; `BRNomeExameLOINC` ativo 10/2025 [Ev8] | Conforme perfil/caso | **A mapear** | 🟡 (coluna `biomarker_catalog.loinc_code` **vazia**) | `026_*loinc_code.sql` [R] | Camada de terminologia (não inventar código) · **P1** |
| 10 | **SNOMED CT** quando aplicável | [BR-CORE] | BR-Core (mapeamentos) [Ev7] | Conforme caso | **A avaliar** | 🟡 (coluna vazia) | `027_*snomed_ct.sql` [R] | Mapear onde houver conceito · **P2** |
| 11 | **UCUM** p/ unidades | [FHIR][BR-CORE] | HL7 FHIR (Quantity/UCUM) | Para unidades quantitativas | **Sim** | 🟡 (`ucum_unit` vazia; unidade = texto) | `086_catalog_v2` [R] | Unidade com system/código · **P1** |
| 12 | **GAL / Tabela SUS / TUSS** p/ procedimentos | [RNDS] | REL distingue GAL [Ev5] | Conforme perfil | **A validar** | ❌ | — | Avaliar contra perfil vigente · **P2/backlog** [NC-artefato] |
| 13 | **Identificadores do Paciente** (CPF/CNS + local) | [RNDS][LEGAL] | REL 2025 exige CPF/CNS [Ev4]; credenc. RNDS [Ev11] | Conforme perfil | **A validar (T2)** / estrutura **Sim** | ❌ (só `patient_name` texto; sem CPF/CNS/nascimento/sexo) | `profiles`; `035_*patient_name.sql` [R] | Estrutura de identifiers (system/value/período/origem/status) · **P1** (P0 T2) |
| 14 | **Practitioner/PractitionerRole** (CRM/UF/CNS) | [RNDS][BR-CORE] | REL 2025 resp. técnico [Ev4]; credenc. [Ev11] | Conforme perfil/ator | **A validar (T2)** | ❌ (`requesting_physician` texto) | `114_*requesting_physician.sql` [R] | Entidade + identificadores · **P1** |
| 15 | **Organization** (CNES/CNPJ) | [RNDS][BR-CORE] | CNES central na RNDS [Ev4][Ev11] | Conforme perfil/ator | **A validar (T2)** | ❌ (`issuer` texto) | `103_*issuer.sql` [R] | Entidade + CNES/CNPJ · **P1** |
| 16 | **`Provenance`** (proveniência do dado importado) | [FHIR][BEST PRACTICE] | HL7 FHIR R4 | Recomendado/necessário conforme uso | **Sim** | ✅ base rica (não como recurso FHIR) | `provenance/index.ts`, `PipelineAudit`, `extraction_versions`, `fingerprint` [R] | Formalizar cadeia original→extraído→normalizado→FHIR · **P1** |
| 17 | **`AuditEvent` / trilha de auditoria** | [LEGAL][BEST PRACTICE] | LGPD (registro de operações) [Ev-LGPD] | Sim (controle) | **Sim** | 🟡 (`ai_processing_log`, RLS; sem trilha de acesso/CRUD completa) | RLS + logs [R] | Trilha quem criou/viu/alterou/excluiu · **P1** |
| 18 | **LGPD** — dados de saúde = sensíveis | [LEGAL] | Lei 13.709/2018 [Ev-LGPD] | **Sim** | **Sim** | 🟡 (RLS/escopo por usuário; governança formal parcial) | RLS [R] | Finalidade/base legal/minimização/retenção/direitos · **P0 (governança)** |
| 19 | **RIPD** (Relatório de Impacto) | [REGULATORY] | ANPD — RIPD [Ev-ANPD] | Conforme risco/contexto | **Sim (tratar como entregável obrigatório interno)** | ❌ | — | Elaborar RIPD antes de tratamento de alto risco · **P1** |
| 20 | **Controlador × Operador × Suboperadores** | [LEGAL][REGULATORY] | LGPD; ANPD | Sim | **Sim** | ❌ (não formalizado) | — | Definir papéis jurídico+contratual+arquitetural · **P1** |
| 21 | **Consentimento ≠ base legal**; finalidade por operação | [LEGAL][FHIR][OPENCARE] | LGPD; FHIR `Consent`; OpenCare [Ev12] | Sim | **Sim** | ❌ (não há `Consent`; sem separação de finalidades) | — | Entidade de consentimento/autorização (titular/finalidade/escopo/destinatário/período/revogação/evidência) · **P1** |
| 22 | **Documento original preservado** (integridade/autenticidade) | [LEGAL] | Lei 13.787/2018 [Ev-13787] | Sim (se guarda de prontuário) | **A classificar** | 🟡 (`file_url` preserva; hash/fingerprint existem) | `fingerprint`, `document_sha256` [R] | Separar original × derivado × proveniência × auditoria · **P1** |
| 23 | **RNDS REL** (Resultado de Exame Laboratorial) | [RNDS] | Portaria GM/MS 8.276/2025 — envio nacional [Ev3][Ev4] | **Sim, quando caso aplicável** | **A validar (T2)** — labs aplicável; **conflito documental** (docs antigos) | ❌ | — | Perfil/cardinalidades REL vigente · **P2 (T2)** [NC-artefato] |
| 24 | **RNDS RAC** (Registro de Atendimento Clínico) e outros (RIA/RIRA…) | [RNDS] | Modelos RNDS (evolutivos) | Conforme caso aplicável | **A validar (T2)** | ❌ | — | Avaliar aplicabilidade por caso de uso · **backlog (T2)** [NC-artefato] |
| 25 | **RNDS — resultado/imagem diagnóstica (Doppler)** | [RNDS] | roadmap federal histórico [Ev10]; IG **estadual** SES-GO [Ev9] | **NÃO CONFIRMADO** | **A confirmar (T2)** | ❌ | — | **`[NC]`**: confirmar IG/contrato federal vigente ANTES de qualquer transmissão · **T2** |
| 26 | **RNDS — credenciamento/segurança de acesso** | [RNDS][REGULATORY] | Guia RNDS: CNES, CNS prof., cert. **ICP-Brasil A1** (e-CPF/e-CNPJ), **mTLS**, homolog→prod [Ev11] | Sim (p/ transmissão) | **Só na T2** | ❌ | — | Gateway de integração; certificados fora do mobile · **P2 (T2)** |
| 27 | **ANVISA — enquadramento SaMD** | [REGULATORY] | RDC 657/2022 (+ manual 2025/26) [Ev-ANVISA] | Conforme função do software | **A manter fora de SaMD** | ✅ (produto não faz diagnóstico) | definição de produto | Preservar limite: organiza/contextualiza, não diagnostica · **P1 (compliance)** |
| 28 | **CFM — SRES/telemedicina** | [REGULATORY] | Resolução CFM 2.314/2022 [Ev-CFM] | Se uso assistencial profissional | **A avaliar (condicional)** | — | — | Avaliar se/quando houver registro assistencial profissional · **condicional** |
| 29 | **OpenCare** — ecossistema de interoperabilidade | [OPENCARE] | InovaHC/HCFMUSP + B3/PDtec [Ev12] | **Não normativo** | **Referência/parceiro potencial** | ❌ | — | Considerar como camada complementar (privado), não substituto da RNDS · **P2/estratégico** |

---

## 2. Prioridades (síntese)
**P0 — antes de qualquer integração RNDS (arquitetura/modelo canônico):**
definir modelo canônico FHIR R4 (#1); `ServiceRequest` para pedidos (#3); `DiagnosticReport`/`Observation` para resultados (#4,#5); `DocumentReference` para documentos (#7); vínculo `basedOn` estrutural (#8); `Patient`/`Practitioner`/`Organization` + identifiers (#13–15, estrutura); terminologia (#9); provenance (#16); consentimento (#21); auditoria (#17); **revisar #117 à luz do modelo (§4)**. Governança LGPD (#18).

**P1 — depois:** LOINC (#9), SNOMED (#10), UCUM (#11); mapeamentos nacionais; relacionamento pedido↔resultado; deduplicação; matching de paciente; validação FHIR; geração de Bundle; FHIR Validator; testes de conformidade; RIPD (#19); papéis controlador/operador (#20); Provenance/AuditEvent formalizados; preservação documental (#22).

**P2 — integrações (só depois):** RNDS por adaptador específico por IG/caso (#23–26); OpenCare quando houver contrato/spec/governança (#29); FHIR API própria da SINTERA.

## 3. Gate de fases (nenhuma implementação agora)
```
FASE A — Arquitetura   : esta matriz + modelo canônico (auditar schema × FHIR/BR-Core/RNDS/LGPD/terminologia/proveniência/auditoria)
   ↓ (aprovação da fundadora dos DOIS documentos)
FASE B — Canonical Model: definir Patient/ServiceRequest/DiagnosticReport/Observation/ImagingStudy/DocumentReference/Practitioner/Organization/Consent/Provenance/AuditEvent
   ↓
FASE C — Implementação : só após aprovação da arquitetura (inclui reavaliar #117)
   ↓
FASE D — Validação     : dados sintéticos → FHIR Validator → BR-Core → perfis RNDS aplicáveis → testes de interop
   ↓
FASE E — RNDS          : somente fluxos oficialmente suportados/vigentes
```
**Regra de ouro:** conceito clínico → recurso FHIR → perfil BR-Core/RNDS aplicável → terminologia → modelo canônico → banco → API → UI. **Nunca** criar campo "porque a tela precisa" quando ele representa informação clínica.

## 4. Reavaliação obrigatória do #117 (Fase 0) — NÃO executar por já ter sido validado localmente
Antes de qualquer merge, `exam_documents` deve atender: documento original; múltiplos documentos; relação com resultado; relação com pedido; proveniência; tipo semântico; integridade; auditoria; **futura projeção para `DocumentReference`**. E `fulfills_order_id` deve ser revisado como parte da modelagem **`ServiceRequest`→resultado** (DDL, FK, cardinalidade, resultados parciais, pedido com múltiplos procedimentos, auditoria do vínculo). Detalhe em `SINTERA-FHIR-CANONICAL-MODEL.md` §Reavaliação #117.

## 5. Itens `[NC]` / pendências de artefato bruto
1. **StructureDefinition/JSON do perfil REL vigente** (recursos, cardinalidades, must-support, extensões) — `[NC-artefato]`.
2. **Perfil/fluxo federal RNDS para resultado/imagem diagnóstica (Doppler)** — `[NC]` (roadmap histórico + IG estadual **não** comprovam vigência federal; **não** afirmar "RNDS não suporta imagem").
3. **ValueSets** exatos vinculados por elemento (LOINC/GAL/SNOMED) — `[NC-artefato]`.
4. **Regras de consentimento por destinatário e log de acesso** no contexto RNDS — `[NC-artefato]`.

## 6. Fontes (evidência documental)
Referência da pesquisa documental da fundadora + verificação no repositório. Confiança conforme §Legenda.
- **[Ev1]** HL7 FHIR R4 — `ServiceRequest` (solicitação de procedimento/serviço). [FHIR] · alta.
- **[Ev2]** HL7 FHIR R4 — `DiagnosticReport` (`basedOn`), `Observation`, `ImagingStudy`. [FHIR] · alta.
- **[Ev3]** Portaria GM/MS nº 8.276, de 29/09/2025 — novo modelo REL; envio nacional de resultado laboratorial (art. 3º). [RNDS][LEGAL] · alta.
- **[Ev4]** Documentação REL 2025 — CPF/CNS, CNES, responsável técnico, dados/datas, valores de referência, interpretação, assinatura eletrônica. [RNDS] · alta (cardinalidades `[NC-artefato]`).
- **[Ev5]** Modelo computacional REL — LOINC no `code` do exame; distinção GAL. [RNDS] · alta.
- **[Ev6]** MS × Abramed (2025) — padronização de códigos laboratoriais + LOINC + novo REL. [RNDS] · alta.
- **[Ev7]** BR-Core (Core do Brasil Release 1) — FHIR R4; interop técnica+semântica; mapeamentos LOINC/SNOMED CT. [BR-CORE] · alta.
- **[Ev8]** Servidor oficial de Terminologias do Brasil — FHIR + LOINC; `BRNomeExameLOINC` ativo desde 10/2025. [BR-CORE][RNDS] · alta.
- **[Ev9]** IG FHIR **estadual** SES-GO (2026) — "Informações Sobre a Solicitação do Exame" (ServiceRequest) usada por Laudo/Imagens; perfis p/ solicitação, laudo, imagens, `Media`. [D estadual] · alta (**não federal**).
- **[Ev10]** Comitê Gestor de Saúde Digital — "Registro de Imagem Diagnóstica" em roadmap federal (histórico). [RNDS] · inferência (não vigência).
- **[Ev11]** Guia de Integração RNDS — CNES, CNS do profissional, identificador do solicitante fornecido pela RNDS, certificado ICP-Brasil (e-CPF/e-CNPJ, A1), ambientes homologação→produção. [RNDS] · alta.
- **[Ev12]** OpenCare Interop (InovaHC/HCFMUSP + B3/PDtec) — FHIR, tokenização, consentimento granular, auditoria, arquitetura descentralizada, integração planejada à RNDS; cooperação MS/ANS/Abramed/HCFMUSP. [OPENCARE] · alta (existência) / não normativo.
- **[Ev-LGPD]** Lei nº 13.709/2018 (LGPD) — dados de saúde = sensíveis; registro de operações. [LEGAL] · alta.
- **[Ev-13787]** Lei nº 13.787/2018 — digitalização/guarda de prontuário: integridade, autenticidade, confidencialidade. [LEGAL] · alta.
- **[Ev-ANPD]** ANPD — RIPD (elaborar antes do tratamento de alto risco; conteúdo mínimo). [REGULATORY] · alta.
- **[Ev-ANVISA]** ANVISA RDC 657/2022 (+ manual 2025/26) — SaMD; software que só organiza/contextualiza pode não ser SaMD. [REGULATORY] · alta.
- **[Ev-CFM]** Resolução CFM 2.314/2022 — telemedicina/SRES: representação, terminologia, interoperabilidade, sigilo, assinatura digital. [REGULATORY] · alta (aplicabilidade condicional ao uso).

> **Gate FECHADO.** Nenhum código, migração, UI ou integração iniciado. Próximo passo = aprovação desta matriz **e** do `SINTERA-FHIR-CANONICAL-MODEL.md`; só então (Fase C) começa qualquer alteração de banco/kernel.

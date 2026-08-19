# RNDS-002 — Parecer consolidado de interoperabilidade FHIR R4 + Matriz de gaps priorizada

> **Fase A (gate atual) — AUDITORIA READ-ONLY.** Não altera código, banco, wiring nem UI.
> Consolida **#114** (RNDS-001, auditoria) e **#119** (camada FHIR pura) contra o **schema/domínio atual**
> (`feat/mobile-inc4-perfil`). Produz a matriz de gaps e a **recomendação de ordem** — não corrige nada.
> **Data:** 2026-08-19 · **Próximo passo:** Gate de decisão (você aprova a ordem) → Fase B (implementação).

## 0. Método e nível de evidência
Três frentes de leitura independentes: (a) camada FHIR de #119 (`origin/feat/fhir-projector`); (b) auditoria
RNDS-001 de #114 (`origin/docs/rnds-fhir-audit`); (c) schema real em `supabase/` + domínio em `packages/`.

Classificação de evidência usada abaixo:
- **[R]** verificado no **repositório** (arquivo:linha) — alta confiança.
- **[H#114]** afirmação da auditoria #114 — parte **auto-rotulada como hipótese** pendente do IG vivo.
- **[⛔IG]** depende do **Guia de Implementação da RNDS ao vivo**, hoje **bloqueado pelo proxy** (`rnds-fhir.saude.gov.br`, `rnds-guia.saude.gov.br`, `hl7.org.br`). **Não congelar** sem confirmação.
- **[NC]** **Não confirmado pelo artefato fornecido** — usado no GATE-0 (§8) para todo requisito que **não** esteja demonstrado nos artefatos oficiais entregues. Vale a **regra de evidência estrita:** não preencher lacunas por conhecimento geral; ausência de artefato ⇒ registrar `[NC]`, nunca inferir.

## 1. Veredito executivo
1. **Interoperabilidade implementada hoje = ZERO** em produção. Existe apenas a **camada FHIR pura de #119** (projetor determinístico validado por *fixtures*), **não ligada a banco** e **gated atrás da Fase 0 (#117)**. [R][H#114]
2. **#114 e #119 são mutuamente consistentes**: #119 implementa exatamente a "Camada B — projetor SINTERA→FHIR R4" que #114 recomendou (ServiceRequest/DiagnosticReport/Observation/Provenance/DocumentReference, 1 `DiagnosticReport` por exame, `basedOn` a partir de `fulfills_order_id`, ids **locais**). Ambos **deixam identificadores oficiais e terminologia deliberadamente fora** (adiados a um adaptador RNDS posterior). [R]
3. **A consistência com a arquitetura ATUAL é apenas de intenção, não executável:** #119 lê tabelas/colunas da **Fase 0** (`exam_documents`, `exam_document_id`, `fulfills_order_id`/`order_status` formalizados) que **não existem no schema atual** — só na migração **137 proposta em #117 (não mesclada)**. [R]
4. **O ponto semântico do PEDIDO (seu destaque) está apenas PARCIALMENTE resolvido.** A separação pedido≠resultado existe como **convenção de aplicação** (`document_type ∈ {medical_order, insurance_guide}`), mas **o procedimento solicitado não tem representação estruturada**: não há entidade "serviço solicitado" nem `ServiceRequest.code` com sistema de códigos — o "o que foi pedido" é **reconstruído de strings livres** dos biomarcadores (`deriveOrderTitle`/`deriveOrderDisplayTitle`). O projetor de #119 emite `ServiceRequest.code = { text: display_title }` — **texto livre, sem coding**. [R]
5. **Decisão estrutural recomendada (herdada de #114 §10, confirmada pela evidência): DESACOPLAR duas trilhas.**
   - **Trilha 1 — Compatibilidade FHIR R4 (viável agora, aditiva):** deixar o modelo interno projetável para FHIR correto.
   - **Trilha 2 — Transporte RNDS (gated):** depende de existir um **documento federal aplicável** ao caso da SINTERA. ⚠️ **PREMISSA A CONFIRMAR, NÃO PERPETUAR:** a alegação de #114 de que **não haveria fluxo/perfil federal para imagem** e de que o **REL** seria **restrito a notificáveis (COVID/Monkeypox)** é **hipótese auto-rotulada de #114**, ainda **`[NC]` — não confirmada por artefato**. Será **confirmada ou refutada documentalmente no GATE-0** (§8), não tratada como fato. **A aplicabilidade só se decide após o GATE-0.** [H#114][⛔IG][NC]
   - **Invariante arquitetural (independe da RNDS):** ausência de contrato/endpoint RNDS para um domínio **NÃO** autoriza modelá-lo fora de FHIR. A SINTERA permanece estruturada semanticamente conforme **FHIR R4** onde aplicável, **independentemente** de existir transporte RNDS — em particular, o **pedido de exame é uma SOLICITAÇÃO** e `ServiceRequest` é a **referência semântica principal** (nunca confundir com `DiagnosticReport`/`Observation`).

## 2. Achado semântico central — a Solicitação (ServiceRequest)
Em FHIR R4, `ServiceRequest` representa a **solicitação de um serviço/procedimento**, e seu `code` identifica **o que foi solicitado**; o resultado (`DiagnosticReport`/`Observation`) referencia a solicitação via `basedOn`. Auditando a estrutura interna contra essa semântica:

| Elemento FHIR | Como a SINTERA representa hoje | Evidência | Situação |
|---|---|---|---|
| `ServiceRequest` (existência) | Linha de `exams` com `document_type='medical_order'` (sem enum/CHECK; valor **nem consta** do vocabulário documentado da coluna) | `classification.ts:5`; `101/102_*document_*.sql` [R] | 🟡 parcial (informal) |
| `ServiceRequest.code` (o serviço pedido) | **Texto livre** derivado de nomes de biomarcadores (`deriveOrderTitle`), sem sistema de código | `orderTitle.ts:43-68`; projetor #119 `code:{text}` [R] | ❌ ausente (sem coding) |
| `ServiceRequest.status/intent` | `order_status` (TS-only: pendente/realizado/finalizado) | `orderStatus.ts:10`; **sem DDL** [R] | 🟡 parcial (não persistido com integridade) |
| `ServiceRequest.requester` | `exams.requesting_physician` (texto) | `114_*requesting_physician.sql` [R] | 🟡 parcial (sem CRM) |
| `basedOn` (resultado→pedido) | `exams.fulfills_order_id` (self-ref) | `update.ts:16-17`; **sem DDL/FK** [R] | 🟡 parcial (não migrado) |

**Conclusão:** a estrutura interna **sinaliza** a solicitação, mas **não a representa de forma interoperável** — falta um **serviço solicitado de primeira classe com código** e a **persistência com integridade** do vínculo. Este é o gap que dá continuidade direta ao PEDIDO-002 recém-corrigido (que resolveu a **exibição**, não a **representação**).

## 3. Matriz de gaps priorizada

Legenda conformidade: ✅ aderente · 🟡 parcial · ❌ ausente · 🔵 validar contra perfil RNDS.
Prioridade ancorada nas **duas trilhas**: `P0` bloqueia interoperabilidade · `P1` necessário à adequação · `P2` importante não bloqueante · `backlog`.

### 3.1 Identificação
| # | Gap | Situação | Evidência | Prioridade |
|---|---|---|---|---|
| ID-1 | **Paciente sem CPF/CNS**, sem data de nascimento (só `age_range`), sem sexo | ❌ | `profiles` `schema.sql:8-22`; `exams.patient_name` `035` [R] | **P1** Trilha 1 · **P0** Trilha 2 (sem CNS não há envio à RNDS) [H#114] |
| ID-2 | **Profissional sem CRM/CNS** (texto livre) | ❌ | `114_*requesting_physician.sql` [R] | **P1** / **P0** Trilha 2 |
| ID-3 | **Organização sem CNES** (texto livre) | ❌ | `103_*issuer.sql` [R] | **P1** / **P0** Trilha 2 |
| ID-4 | Patient/Practitioner/Organization **não são entidades de 1ª classe** (campos soltos em `exams`) | ❌ | agentes A/B [R] | **P1** |

### 3.2 Modelo semântico (Pedido/Resultado/Documento)
| # | Gap | Situação | Evidência | Prioridade |
|---|---|---|---|---|
| SM-1 | `fulfills_order_id`/`order_status` **sem DDL/FK** (vínculo `basedOn` e ciclo do pedido não persistidos com integridade) | 🟡 | `map.ts:19-20`, `update.ts:16-17`; **0 migração** [R] | **P0** Trilha 1 (espinha ServiceRequest→DiagnosticReport) — resolvido pela **Fase 0 #117** |
| SM-2 | `document_type` **sem enum/CHECK**; `medical_order`/`insurance_guide` fora do vocabulário documentado da coluna | 🟡 | `classification.ts:5`; `101/102` [R] | **P0/P1** (a bifurcação semântica repousa em string não restrita) |
| SM-3 | **Serviço solicitado sem código** (ServiceRequest.code = texto) | ❌ | `orderTitle.ts`; projetor #119 [R] | **P1** |
| SM-4 | 1 exame = 1 `DiagnosticReport` mesmo com N documentos (preliminar/final) | ✅ (em #119, fixture) | projetor `localId:exam.id`; `validate.ts` [R] | — (validar pós-Fase 0) |
| SM-5 | `exam_documents` (multi-documento + proveniência por doc) **proposto, não construído** | ❌ | Fase 0 #117 (migração 137, não mesclada) [R] | **P1** (pré-requisito de #119) |

### 3.3 Terminologia
| # | Gap | Situação | Evidência | Prioridade |
|---|---|---|---|---|
| TERM-1 | **LOINC 0% populado** (coluna `biomarker_catalog.loinc_code` existe, nasce NULL) | 🟡 (coluna) / ❌ (dado) | `026_*loinc_code.sql:14` [R] | **P1** (P0 Trilha 2 se o perfil exigir) [⛔IG] |
| TERM-2 | **SNOMED CT** idem (coluna existe, vazia) | 🟡/❌ | `027_*snomed_ct.sql:15` [R] | **P2** |
| TERM-3 | Unidades em **texto livre, não UCUM** (`ucum_unit` existe, vazia) | 🟡/❌ | `086_catalog_v2` [R] | **P2** |
| TERM-4 | Sem **TUSS/CBHPM/SIGTAP** para procedimentos (código do serviço pedido) | ❌ | agente B; #114 §2 [R][H#114] | **P2/backlog** (depende do perfil) [⛔IG] |
| TERM-5 | Resultado carrega só `name`+`catalog_id` local; sem código padrão na linha do resultado | 🟡 | `biomarkers.ts:11-31` [R] | **P1** |
| TERM-6 | `clinical_results` já tem `code/code_system/value_code` (BI-RADS/PI-RADS…) mas **0 linhas** no ambiente | 🟡 | `110/111_clinical_results_*.sql` [R] | **P2** |

### 3.4 Relacionamentos FHIR (na camada #119, hoje fixture)
| # | Relação | Situação | Evidência | Prioridade |
|---|---|---|---|---|
| REL-1 | `DiagnosticReport.basedOn → ServiceRequest` | ✅ (fixture) | projetor `basedOn:[ref(...)]` [R] | validar pós-Fase 0 |
| REL-2 | `DiagnosticReport.result → Observation` | ✅ (fixture) | projetor `result:map(ref)` [R] | idem |
| REL-3 | `Observation.derivedFrom → DocumentReference` (proveniência por resultado) | ✅ (fixture) | projetor [R] | idem |
| REL-4 | `Provenance` por documento (agente/entidade = extraction_version) | ✅ (fixture) | projetor `provenanceResource` [R] | idem |
| REL-5 | `performer → Organization`, `requester → Practitioner`, `subject → Patient` | ✅ estrutural / ❌ identificadores | projetor [R] | ver 3.1 |
| REL-6 | Referências internas consistentes; 1 evento clínico; sem acoplamento RNDS | ✅ | `validate.ts` [R] | — |

### 3.5 Consentimento, segurança e governança
| # | Gap | Situação | Evidência | Prioridade |
|---|---|---|---|---|
| GOV-1 | **Consentimento por destinatário** ausente | ❌ | #114 §2/§5 [H#114] | **P1** (P0 antes de qualquer envio externo) |
| GOV-2 | **Log de acesso** ausente | ❌ | #114 §5 [H#114] | **P1** |
| GOV-3 | Proveniência interna rica (`provenance`, `PipelineAudit`, `extraction_versions`, `fingerprint`) → base de `Provenance`/`DocumentReference` | ✅ | #114 §2; projetor #119 [R][H#114] | — (aproveitar) |
| GOV-4 | RLS user-scoped nas tabelas de exame | ✅ | migrações Fase 0 / RLS existente [R] | — |
| GOV-5 | Autenticação RNDS: **certificado ICP-Brasil A1 + mTLS**, credenciamento por **CNES** | ❌ (Trilha 2) | #114 §3-bis [H#114][⛔IG] | **P0 Trilha 2** (só se aplicável) |

### 3.6 Conformidade / aplicabilidade RNDS (a validar no IG vivo)
| # | Questão a confirmar | Situação | Prioridade |
|---|---|---|---|
| CONF-1 | **Escopo do REL** cobre exames **laboratoriais gerais** ou segue restrito a notificáveis (COVID/Monkeypox)? | 🔵 | **P0-decisão** [⛔IG] |
| CONF-2 | Existe **documento/perfil federal para resultado de IMAGEM** (caso Doppler), incluindo **ServiceRequest** para pedido de exame? Alegação de #114 ("não existe") é **`[NC]` — a confirmar/refutar por artefato**, não premissa. | 🔵 | **P0-decisão** [H#114][⛔IG][NC] |
| CONF-3 | **Perfil/versão** vigente (REL V2 × `BRResultadoExameLaboratorial-3.2.1` × outro), recursos e **cardinalidades** obrigatórios | 🔵 | **P0-decisão** [⛔IG] |
| CONF-4 | **LOINC obrigatório** em todo cenário? (RNDS usa GAL/terminologias próprias) | 🔵 | **P0-decisão** [⛔IG] |
| CONF-5 | Identificadores exigidos por perfil (CNS/CNES obrigatórios; CPF/CNPJ conforme) e processo de homologação/certificado | 🔵 | **P0-decisão** [⛔IG] |

## 4. Consistência #114 × #119 × arquitetura atual (resposta ao gate)
- **#114 ↔ #119: consistentes.** #119 é a materialização da Camada B proposta por #114; nenhuma contradição de direção. Ambos adiam identificadores/terminologia por desenho. [R]
- **#119 ↔ schema atual: dependência não satisfeita.** #119 pressupõe a **Fase 0 (#117)**; sem ela, `supabaseExamSource` lê tabelas/colunas inexistentes. #119 é **validado só por fixture** (Doppler), sem dado real (declarado em FHIR-005 §3.2). [R]
- **#114 ↔ realidade RNDS: parcialmente confirmado, várias hipóteses abertas.** #114 já se **auto-rebaixou** ("REL V2/LOINC obrigatório/lista de recursos" viraram hipóteses) por causa do **bloqueio de egresso** aos hosts oficiais. [H#114][⛔IG]

## 5. Recomendação de ORDEM de implementação (para o gate — não executar agora)
Respeita o desacoplamento (§1.5) e a pré-condição de #114 ("confirmar o IG antes de qualquer implementação").

```
GATE-0  (P0-decisão, agora) — confirmar o IG vivo da RNDS: escopo REL (labs gerais?), perfil de imagem,
        perfis/cardinalidades, LOINC, identificadores, homologação/certificado.  ⛔ exige egresso liberado
        (rnds-guia/rnds-fhir/hl7.org.br) OU artefatos oficiais fornecidos por você.  → decide se a Trilha 2 existe.
   ↓
── TRILHA 1 · Compatibilidade FHIR R4 (aditiva, independe da RNDS) ──────────────────────────────────
1. (P0) Reconciliação de schema — Fase 0 #117: DDL de document_type (restrição), fulfills_order_id/order_status
        (+FK), exam_documents. Pré-requisito compartilhado de #119 e de qualquer projeção fiel.  [SM-1,SM-2,SM-5]
2. (P1) Solicitação de 1ª classe (ServiceRequest.code): representar o procedimento solicitado com slot de código
        (mesmo que NULL no início), dando continuidade estrutural ao PEDIDO-002.  [SM-3]
3. (P1) Entidades Patient/Practitioner/Organization + identificadores (CPF/CNS/CNES/CRM/nascimento/sexo).  [ID-1..4]
4. (P1) Terminologia: popular LOINC/UCUM (e SNOMED onde couber) via curadoria — colunas já existem.  [TERM-1..5]
5. (—) Camada B (projetor #119): revisar/mesclar e validar com dado real APÓS 1–4 (gate próprio, preview).
   ↓
── TRILHA 2 · Transporte RNDS (SÓ se GATE-0 confirmar aplicabilidade) ───────────────────────────────
6. (P1) Consentimento por destinatário + log de acesso (LGPD/RNDS) — pré-requisito de qualquer envio.  [GOV-1,2]
7. (P0-T2) Camada C — Bundle document + Composition conforme perfil vigente + cliente (ICP-Brasil A1, mTLS, CNES).  [GOV-5]
8. (P0-T2) Testes de conformidade (validador FHIR + perfis) → homologação RNDS.  [CONF-*]
```

**Princípio-guia:** a Trilha 1 entrega valor técnico já (representação FHIR correta, aproveitável para exportação/portabilidade) e **não deve ser ditada pela RNDS**; a Trilha 2 só avança quando o GATE-0 provar que há contrato federal aplicável ao caso da SINTERA.

## 6. Riscos / limitações desta auditoria
- **Egresso bloqueado:** o contrato RNDS (perfis, cardinalidades, escopo REL, terminologia obrigatória) **não pôde ser lido no IG oficial** — os itens 🔵/[⛔IG] são **decisão de GATE-0**, não conclusões.
- **#114 contém hipóteses auto-rebaixadas**; não congelar sua lista de recursos.
- Esta Fase A **não implementa nem corrige** nenhum gap. A ordem acima é recomendação sujeita à sua aprovação no gate de decisão.

## 7. Decisão do gate — REGISTRADA (2026-08-19)
- ✅ **Ordem (§5) e desacoplamento Trilha 1 × Trilha 2: APROVADOS.**
- ✅ **GATE-0:** será fechado contra **artefatos oficiais do IG fornecidos pela fundadora** (o proxy deste ambiente bloqueia os hosts oficiais). A matriz de conformidade (§3.6, CONF-1..5) **permanece 🔵 a validar** até os artefatos chegarem.
- ⏸️ **Primeiro passo executável da Trilha 1: a DEFINIR após o GATE-0.** Nada da Trilha 1 (inclusive Fase 0 #117) é iniciado antes de fechar o GATE-0. **#114/#119 seguem draft.**
- ⛔ **Nenhuma implementação autorizada nesta fase.**

### 7.1 Artefatos do IG necessários para fechar o GATE-0
Para resolver CONF-1..5 (§3.6), preciso dos seguintes artefatos oficiais (PDF/HTML/JSON — como você tiver):
1. **Escopo do REL** — Manual de Integração / IG do *Resultado de Exame Laboratorial* vigente: quais exames são aceitos (só notificáveis/COVID/Monkeypox × laboratório geral). Base do CONF-1.
2. **Resultado de Imagem** — confirmação de existir (ou não) documento/perfil federal para resultado de **imagem** (ex.: Doppler). CONF-2.
3. **StructureDefinitions dos perfis aplicáveis** — página do perfil (ex.: `BRResultadoExameLaboratorial` versão vigente): recursos obrigatórios, **cardinalidades**, *must-support*. CONF-3.
4. **Terminologia obrigatória** — quais *value sets*/sistemas o perfil vincula (LOINC? GAL? `BRNomeExameLOINC`) e se **LOINC é exigido**. CONF-4.
5. **Identificadores por perfil** — obrigatoriedade de **CNS/CNES/CPF/CNPJ**. CONF-5.
6. **Homologação/credenciamento** — ambientes, credenciamento por **CNES**, certificado **ICP-Brasil A1** + mTLS.

Com esses artefatos eu: (a) fecho a matriz de conformidade §3.6, (b) determino se a **Trilha 2 é aplicável** ao caso da SINTERA, (c) proponho o **primeiro passo executável da Trilha 1**.

## 8. GATE-0 — worksheet de verificação documental (AGUARDANDO ARTEFATOS)
**Estado:** ⏳ nenhum artefato oficial recebido ainda → todas as respostas abaixo estão **`[NC]` (não confirmado pelo artefato fornecido)**.
**Regra de evidência (estrita):** cada resposta cita o **artefato + trecho/seção**. Requisito não demonstrado no artefato ⇒ **`[NC]`**; **proibido** preencher por conhecimento geral ou perpetuar hipótese de #114 como fato. A verificação é **estritamente documental** contra os artefatos entregues.

### 8.1 Perguntas que o GATE-0 deve responder (com evidência)
| # | Pergunta | Resposta | Evidência (artefato · seção) |
|---|---|---|---|
| Q1 | Quais recursos/perfis FHIR R4 da RNDS são **efetivamente aplicáveis** à SINTERA? | `[NC]` | — |
| Q2 | Existe **contrato RNDS para PEDIDO de exame** — especialmente semântica de **`ServiceRequest`**? | `[NC]` | — |
| Q3 | Quais **perfis, StructureDefinitions, extensões e terminologias** são obrigatórios? | `[NC]` | — |
| Q4 | Quais **identificadores** exigidos para **Patient / Practitioner / Organization**? | `[NC]` | — |
| Q5 | Quais **terminologias** exigidas p/ exames/procedimentos (**LOINC / SNOMED CT / UCUM / GAL / outras**)? | `[NC]` | — |
| Q6 | Existe **transporte RNDS** para **imagem/Doppler** e para **laboratório geral**, distinguindo de **notificações/REL**? | `[NC]` | — |
| Q7 | Quais requisitos são **FHIR estrutural** (Trilha 1) × **integração/transporte RNDS** (Trilha 2)? | `[NC]` | — |

### 8.2 Entrega final do GATE-0 (somente isto, após os artefatos)
- **A. Evidências do GATE-0** — respostas Q1–Q7 com citação de artefato.
- **B. Matriz de conformidade/gaps atualizada** — §3 e §3.6 reclassificadas (✅/🟡/❌/🔵/`[NC]`) conforme os artefatos.
- **C. Gaps P0/P1/P2** — reordenados à luz da evidência.
- **D. Dependências e bloqueios.**
- **E. Recomendação do primeiro passo da Trilha 1** (a executar só após nova aprovação).

**Não** implementar nenhum gap no GATE-0. Próximo gate = aprovação da fundadora sobre a matriz e a ordem.

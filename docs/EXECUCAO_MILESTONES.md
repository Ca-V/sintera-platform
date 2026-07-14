# Execução — Milestones por CAPACIDADE (documento vivo)

> Fundadora (13/07/2026): acompanhar a plataforma por **capacidades entregues**, não por tarefas
> isoladas. Cada milestone tem **critérios objetivos de conclusão · testes obrigatórios · casos do CRC ·
> % · bloqueadores · previsão relativa**. Atualizado a cada entrega. Foco: executar/auditar/validar/
> consolidar (arquitetura congelada). Ver `GOVERNANCA.md` (pipeline de 9 etapas) e
> `docs/QA/GOLD_STANDARD_CASES.md` (CRC).
>
> **🔁 MUDANÇA DE EIXO (13/07):** de "construir infraestrutura" → "entregar **inteligência clínica
> utilizável**". A pergunta diária deixa de ser "qual componente implemento hoje?" e passa a ser "**qual
> modalidade clínica fica completamente funcional hoje?**". M1–M4 e o Clinical Processing Engine são
> **infraestrutura** (habilitam); as ENTREGAS de valor são **modalidades completas** (Mamografia, Pentacam,
> EEG…), cada uma **dirigida por um caso do CRC** — ver o 3º painel `COBERTURA_CLINICA.md`. Regra
> arquitetural permanente: **nenhum processador do CPE conhece PDF/Bundle/OCR — só `CertifiedCDU`**
> (garantido por `ARCH-processor-decoupling`).

**Legenda:** ✅ concluído · 🔄 em execução · ⬜ não iniciado · ⛔ bloqueado.
**Convenção de previsão (relativa):** *E* = 1 entrega de execução; *E+n* = n entregas adiante.

---

## 🗺️ Roadmap Estratégico por FASES (fundadora 14/07 — estrutura definitiva)

A **unidade de entrega** deixa de ser o componente técnico e passa a ser a **modalidade clínica completa**. A
infraestrutura (CPE/Registry/Validator) continua, mas não é mais a unidade de valor. Uma modalidade só está
**concluída** quando atinge os **5 níveis**: Identificação · Representação · Validação · Cobertura · UCDA.

| Fase | Nome | Conteúdo | Critério de saída |
|---|---|---|---|
| **1** | **Engenharia da Informação Clínica** *(atual)* | Capture Hub · Bundle · Análise Estrutural · Segmentação · CDU · Identity Validator · Clinical Identity Registry · CPE · Representation Validator · Cobertura · UCDA | **A plataforma compreende corretamente QUALQUER documento clínico** |
| **2** | **Capacidades Clínicas** | Modalidades uma a uma, **dirigidas por CRC** (Laboratório · Mamografia · US · RM · TC · ECG · EEG · Holter · MAPA · Pentacam · Anatomopatológico…) | cada modalidade nos 5 níveis (ver `COBERTURA_CLINICA.md`) |
| **3** | **Consolidação da Representação Longitudinal** | Timeline definitiva · evolução temporal · tendências · comparações · **correlação entre modalidades** · eventos clínicos | a **história clínica** está consolidada (pré-requisito do CARE) |
| **4** | **CARE-001 — Espaço Colaborativo** | Care Space · Snapshot · Dossiê · Compartilhamento Inteligente · Sugestões · Colaboração · Continuidade | `CARE-001_ESPACO_COLABORATIVO.md` |
| **5** | **Ecossistema** | Clínicas · Hospitais · Laboratórios · Convênios · Telemedicina · APIs · FHIR · RNDS · DICOM | conectores de aquisição/interoperabilidade |

> **Por que a Fase 3 vem ANTES do CARE:** *o CARE-001 não compartilha exames — compartilha a história
> clínica.* Essa história precisa estar consolidada (longitudinal, correlacionada) antes do compartilhamento.
> Os milestones M1–M9 abaixo detalham a **Fase 1**; o painel `COBERTURA_CLINICA.md` acompanha a **Fase 2**.

> **🔧 PRIORIDADE DE EXECUÇÃO (fundadora 14/07): PRIMEIRO A PLATAFORMA, depois as modalidades.** Sequência:
> **1)** consolidar o **CPE** como fachada única ✅ (`processClinical`) · **2)** **Laboratory Adapter** ✅
> (`laboratory-adapter.ts`) · **3)** validar o Engine com os **446 biomarcadores reais** ✅ (adapter cobre 100%
> da distribuição real: 352 numeric·89 qualitative·5 missing·116 sem-ref·8 materiais·79 grupos) · **4)**
> consolidar a **UCDA** como contrato único de saída ✅ **dados** (escrita: processador→UCDA→persistência ·
> leitura: persistência→UCDA · Laboratory Adapter: biomarkers→UCDA — todos convergem no contrato) 🔄 **falta
> ligar os consumidores VISUAIS** (Timeline/Evolução/Care lerem UCDA = UI, depois) · **5)** só então as
> modalidades (todas via CPE, dirigidas por CRC). O **Pentacam** volta a ser **validação (CRC), não prioridade**.
>
> **✅ Integração aditiva do pipeline (14/07):** o `analyze` **deixou de conter QUALQUER decisão de modalidade**
> (grep zero de `isNarrativeLaudo`/`imaging`/`laboratory`) — a decisão migrou para `planRepresentation` no
> Engine (equivalência provada, `FUNC-representation-plan`). Caminho laboratorial INTACTO; legado só aposenta
> com equivalência provada (funcional/cobertura/persistência/evolução/reprodutibilidade/performance). Ver
> `GOVERNANCA.md` (Princípio da Delegação de Modalidade ao CPE + critério de aposentadoria).
>
> **⚠️ Convergência PROGRESSIVA (princípio constitucional — `GOVERNANCA.md`):** a **UCDA é o ponto de
> convergência** (contrato único de saída), **não** `clinical_results`. `clinical_results` (canônico, migration
> 110) e `biomarkers` são **backends de persistência**. Domínio maduro (laboratório) **não migra** — o CPE o
> **consome** via **Adapter transitório** (`laboratory-adapter.ts`: biomarkers → UCDA, sem tocar nos 446 nem no
> caminho `current_biomarkers`→evolução). Ver [[principio_convergencia_progressiva]] ·
> [[feedback_plataforma_antes_modalidades]]. **Sem decisões de UI agora** — persistir correto; interface depois.

---

## Painel (visão rápida)

| # | Capacidade | % | Estado | Previsão |
|---|---|---|---|---|
| **M1** | Compreensão documental (Bundle → CertifiedCDUs) | **100%** ✅ | ✅ | ligado ao analyze |
| **M2** | Cobertura ligada (fim da falsa completude) | **70%** | 🔄 | E (confiab. plena em M5) |
| **M3** | Split de CDUs no fluxo real (1 upload → N registros) | **70%** | 🔄 | UX de confirmação (produto) |
| **M4** | Identidade robusta (Clinical Identity Registry + estados) | **90%** | 🔄 | fusão LLM no M5 |
| **M5** | Clinical Processing Engine (INFRA: motor único + contrato + desacoplamento) | **35%** | 🔄 | habilita as modalidades |
| **C·** | **CAPACIDADES CLÍNICAS (CRC-driven)** → ver `COBERTURA_CLINICA.md` | — | 🔄 | Pentacam→Mamografia→US→EEG |
| **M6** | Datas semânticas (CEF §5) | **75%** | 🔄 | E (ligada) |
| **M7** | Captura de evidência completa (laudo + imagens) | **0%** | ⬜ | E+4 |
| **M8** | Robustez operacional (timeout/retries/perf) | **0%** | ⬜ (backlog) | — |
| **M9** | Certificação RI-001 (homologação + merge) | ⛔ pausada | ⛔ | após M1+M2 |
| **D·** | **DOMÍNIO — Evento Assistencial** (admin·recorrência·duplicados·estado binário) | registrado | ⬜ | consolidação (não interrompe) → `EVENTO_ASSISTENCIAL.md` |
| **CARE·** | **PILAR — Espaço Colaborativo de Cuidado (CARE-001 · Care Space)** — orquestra a continuidade | registrado | ⬜ | **após** estabilidade do núcleo clínico → `CARE-001_ESPACO_COLABORATIVO.md` |

---

## M1 — Compreensão documental (Bundle → CertifiedCDUs) · 90% · 🔄
**Capacidade:** transformar qualquer Bundle em **CDUs certificadas** (contrato único), compreendendo a
estrutura ANTES de extrair.
**Critérios de conclusão:** (a) Análise Estrutural, Segmentação, Identity Validator, Orquestrador como
funções puras ✅; (b) `processBundle` devolve só `CertifiedCDU` ✅; (c) fail-safe: revisão técnica bloqueia
✅; (d) **`analyze` chama `processBundle` e opera por CDU** ⬜.
**Testes obrigatórios:** `FUNC-structural-analysis` ✅ · `FUNC-segmentation` ✅ · `FUNC-identity-validator`
(via pipeline) ✅ · `INT-analyze-pipeline` (a criar) ⬜.
**CRC:** GS-010 (identidade) · GS-011 (unidades) · bundle 3-laudos.
**Bloqueadores:** nenhum técnico. **Falta:** critério (d) — a integração ao `analyze`.

## M2 — Cobertura ligada (fim da falsa completude) · 50% · 🔄
**Capacidade:** a plataforma **nunca** apresenta um exame incompleto como completo.
**Critérios:** (a) `computeCoverage` puro ✅; (b) `analyze` calcula cobertura por CDU (descoberto×
estruturado); (c) exame vira `partial` quando `structured<discovered`; (d) UI mostra parcial + original.
**Testes:** `FUNC-coverage` ✅ · `INT-coverage-lab` (laudo 6 exames → partial) ⬜.
**CRC:** GS-011 (6 descobertos × 4 estruturados → partial 67%).
**Progresso:** ✅ Cobertura conservadora LIGADA ao `analyze` (só rebaixa `structured→partial` quando
descoberto > estruturado — direção segura, §4.0.1). Confiabilidade PLENA depende de o extrator do CEF
(M5) reportar unidades alinhadas com a Análise Estrutural.
**Bloqueadores:** confiabilidade plena depende de M5 (unidades alinhadas).

## M3 — Split de CDUs no fluxo real (1 upload → N registros) · 70% · 🔄
**Capacidade:** um upload com N exames distintos cria N registros (o PDF de 3 laudos → 3 registros).
**Critérios:** (a) `analyze` cria 1 registro por CertifiedCDU, com vínculo ao Bundle de origem ✅ (raiz vira
CDU#1; CDUs 2..N viram registros-irmãos `pending`); (b) CDUs em revisão técnica ficam retidas ✅ (o
planejador NÃO divide quando há revisão técnica); (c) proveniência do Bundle preservada ✅
(`source_bundle_exam_id` + `bundle_cdu_index/count` + `bundle_page_start/end`); (d) **extração ISOLADA por
CDU** ✅ (cada registro processa só o seu intervalo de páginas — `restrictPages`; CDU restrita força o
caminho de texto); (e) idempotência ✅ (raiz já-dividida não recria irmãos).
**Feito:** planejador puro `planBundleSplit` (10 testes FUNC) · migration 108 (proveniência) · fiação no
`analyze` (planejar antes de extrair · restrição de páginas · materialização dos irmãos).
**Testes:** `FUNC-bundle-split` ✅ (10) · `INT-split-cdus` ⬜ (homologação com IA real).
**CRC:** bundle 3-laudos (AXIAL).
**Falta (30%):** **PASSO DE CONFIRMAÇÃO** (fundadora corrigiu: não é "só UX", é **governança**). Antes de
criar N registros, o usuário vê o que a Segmentação encontrou e confirma:
> Encontramos 3 exames neste documento:
> ✓ Mamografia bilateral · ✓ Ultrassom mama direita · ✓ Ultrassom mama esquerda — **[Confirmar]**

Isso resolve de uma vez OCR ruim, documento ambíguo, confiança, governança e evita registros errados —
confirmação rápida que reforça "o documento é a fonte da verdade". Só **após confirmar** os irmãos são
materializados/disparados. (Hoje o backend já materializa + isola por página; falta inserir esse gate de
confirmação, que é a decisão de produto/UX remanescente.) Sem fan-out automático no servidor.

## M4 — Identidade robusta (Clinical Identity Registry + estados) · 90% · 🔄
**Capacidade:** identificar a modalidade por **ensemble de evidências** (auditável), com estados
`draft/validated`.
**Critérios:** (a) registry por modalidade (nomes/sinônimos/evidências com peso/extrator) ✅ **13
modalidades** (mamografia, US, Pentacam, EEG, laboratório, RM, TC, ECG, ecocardiograma, Holter,
anatomopatológico, OCT, densitometria); (b) score de identidade + auditoria (evidências que casaram) ✅;
(c) `document_identity_status` (draft/validated) — migration 107 aplicada + fiado no `analyze` write-once ✅;
(d) LLM = 1 evidência (conflito → revisão) — **arquitetura pronta (registry é o ensemble); a FUSÃO efetiva
do LLM acontece no M5**, onde o LLM roda na extração (dependência técnica real, não decisão de produto).
**Testes:** `FUNC-clinical-identity-registry` ✅ (11 casos) · `INT` ⬜ (com M5). **CRC:** GS-004 · GS-010.
**Bloqueadores:** nenhum para o escopo determinístico; item (d) segue naturalmente no M5.

## M5 — Clinical Processing Engine · INFRAESTRUTURA · 35% · 🔄
**Papel:** NÃO é uma entrega de valor — é o MOTOR que habilita as modalidades. UM mecanismo, processadores
especializados, todos consumindo `CertifiedCDU` (nunca PDF) e produzindo o modelo de resultado da modalidade.
**Critérios de infra:** (a) **fachada ÚNICA** `processClinical(cdu)` ✅ — Identidade Clínica seleciona o
**MODELO CLÍNICO** e só então o processador; o `analyze` conhece só o Engine (zero acoplamento a modalidade);
(b) sem modelo/ambíguo → `document_only` (revisão clínica, não bloqueia) ✅ (CEF §4.0);
(c) **CertifiedCDU AUTOSSUFICIENTE** ✅ — carrega o conteúdo (`content: CduContent`); o processador não
volta a páginas/PDF/OCR; (d) **desacoplamento garantido por teste** ✅ `ARCH-processor-decoupling`;
(e) **modelos por MODALIDADE, não fabricante** ✅ (Pentacam/Galilei/Orbscan → `corneal-tomography`);
(f) **Modelo Clínico (estrutura/conhecimento) SEPARADO do Processador (implementação)** ✅ —
`clinical-processors/models.ts` declara campos/unidades/por-região; o processador só preenche; roteamento =
identidade → modelo → processador; (g) contrato de processador (`ProcessorResult`, `extractedUnits`) ✅.
**Feito:** `clinical-processing-engine.ts` (13 modelos mapeados + `processClinical`) · `clinical-processors/`
(contrato + 1º modelo) · `FUNC-clinical-processing-engine` (9) · `ARCH-identity-processor-coverage` ·
`ARCH-processor-decoupling`.
**Falta:** fusão do LLM como 1 evidência (item d do M4); ligar a Cobertura por grupo no `analyze`.

## C — CAPACIDADES CLÍNICAS (dirigidas por CRC) · painel próprio: `COBERTURA_CLINICA.md`
**Eixo de valor.** Cada modalidade é uma ENTREGA completa (upload PDF+imagens → segmentação → identificação
→ título fiel → data → emissor → **resultado estruturado da modalidade** → original → cobertura →
reprodutibilidade → **CRC verde**). Sobe para ✅ só quando o caso do CRC passa.
Maturidade por modalidade em `COBERTURA_CLINICA.md` (5 estágios: Identificação → Representação → Validação →
Cobertura → UCDA).
**Em andamento — `corneal-tomography` (GS-004) · Representação LIGADA:** modelo `runCornealTomography` ✅ +
fachada `processClinical` **ligada ao `analyze`** ✅ — os parâmetros por olho são persistidos em
`clinical_results` (migration 109, tabela não-biomarcador; região OD/OE; RDC 657 — transcreve, não interpreta).
`FUNC-corneal-tomography-processor` (8) + **Representation Validator** (4ª camada, `representation-validator.ts`,
`FUNC-representation-validator` 7) integrado à `processClinical` — Validação ✅ + Cobertura ✅ (completude contra
o esqueleto do modelo; `certified`×`complete` separados, nunca falsa completude). **Falta para utilizável:**
UCDA (persistência canônica/longitudinal) · fixture real GS-004 (`expected.json`) na homologação · **exibição
por olho + evolução OD×OE = decisão de PRODUTO** (não bloqueia; CARE Fase 4 / Fase 3 longitudinal).
**Fila (CRC dirige):** Mamografia (GS-012) → Ultrassom (GS-013) → EEG (GS-003) → Ecocardiograma (GS-007)…
**Testes:** `FUNC-corneal-tomography-processor` ✅ · por modelo: 1 FUNC (processador) + regressão CRC.

## M6 — Datas semânticas (CEF §5) · 5% · ⬜
**Capacidade:** data de realização correta por tipo; baixa confiança não sobrescreve.
**Testes:** `FUNC-semantic-dates` ⬜. **CRC:** GS-003 (EEG "2002") · laudo 2009.
**Bloqueadores:** nenhum; pode ser paralelo.

## M7 — Captura de evidência completa (laudo + imagens) · 0% · ⬜
**Capacidade:** exame de imagem = laudo + imagens em 1 CDU (reusa multipágina). **Bloqueadores:** M1/M3.

## M8 — Robustez operacional (timeout/retries/perf) · 0% · ⬜ (backlog)
Timeout 60→120s, retry em `provider_timeout`. **Não prioridade** (fundadora).

## M9 — Certificação RI-001 (homologação + merge) · ⛔ pausada
**Critérios:** M1+M2 fechados (compreensão + cobertura, sem falsa completude no laboratório); RI-001A/B
homologados; verificação do banco + Relatório RI-001. **Bloqueador:** M1(d) + M2.

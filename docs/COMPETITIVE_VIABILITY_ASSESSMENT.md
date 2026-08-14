# SINTERA — Competitive & Viability Assessment

**Status:** análise estratégica (não é backlog). **Não altera código, arquitetura ou a V1.**
**Objetivo:** determinar o espaço de mercado defensável da SINTERA diante dos players existentes e potenciais, **falsificando** (não confirmando) a hipótese de moat, antes de definir o escopo da V2.
**Fundamento do processo:** V1 → fechamento → homologação → aprovação → **este assessment** → **Wedge Validation (validação comercial — §10)** → decisão estratégica → V2 → gap analysis técnico → implementação.

---

## 0. Método, fontes e limitações (ler primeiro)

- **Pesquisa web com fontes**, priorizando docs oficiais → docs técnicas → literatura revisada → reguladores → institucionais → imprensa (complemento). URLs preservadas no material de pesquisa que originou este documento.
- **Limitação material de coleta:** o proxy de egresso do ambiente **bloqueou o acesso direto (WebFetch)** aos domínios oficiais primários (sites das empresas, gov.br, hl7.org.br, b3.com.br etc.). A pesquisa se apoiou em **resumos indexados de busca** + imprensa + agregadores. Consequência: **trechos "entre aspas" e números não foram verificados palavra-a-palavra na fonte primária.** Confiança rebaixada onde a afirmação dependeria de texto legal/técnico literal.
- **Números de escala/funding/receita** (ex.: "220M pacientes", "US$5,3B valuation", "99% de dedup") são **auto-reportados pelas empresas ou de agregadores de terceiros (Tracxn/Crunchbase/Sacra)** — **não auditados**. Tratar como `[FATO reportado]`, não `[FATO verificado]`.
- **Tags de evidência:** `[FATO]` verificável · `[INFERÊNCIA]` análise · `[HIPÓTESE]` a testar · `[NÃO CONFIRMADO]`.
- **Recomendação:** antes de decisão/publicação, revalidar diretamente em open.epic.com, oracle.com/health, intersystems.com, zushealth.com, icanbwell.com, planalto.gov.br (Decreto 12.560/2025), hl7.org.br/fhir/core e as fontes B3/InovaHC.

### Controles metodológicos aplicados (a pedido)
1. **A combinação "patient-centric + provenance + grounded-AI" é HIPÓTESE, não achado.** Hipótese nula explícita: *"ninguém empacotou hoje" ≠ "existe moat"* — pode ser combinação **ainda não empacotada por incentivo/economia**, não por incapacidade. Testada player a player (§3, §7).
2. **Substitute Stack Analysis** (§7B): quais combinações de tecnologias existentes reproduzem 70–90% do valor da SINTERA.
3. **Regulação ≠ moat.** Cada capacidade é classificada em *requisito regulatório · requisito operacional · barreira de execução · diferencial · potencial moat · moat comprovado* (§7A). E **"patient-*" é desmembrado**: *patient-centric (design) · patient-controlled (quem decide) · patient-owned (quem detém) · patient-paid (quem paga)* — conceitos distintos (§5, §7C).

---

## 1. Executive Summary

**Problema (real e comprovado).** `[FATO]` A fragmentação dos dados de saúde do indivíduo é real; e a evolução do mercado a transforma de "falta de dados" em **excesso de informação sem contexto**. O problema existe. **Mas** a *disposição a pagar* por resolvê-lo — sobretudo pelo consumidor — **não** está comprovada (§5).

**Mercado.** `[INFERÊNCIA]` A cadeia converge para: fragmentação → interoperabilidade → registro longitudinal normalizado → contexto → IA → experiência. As camadas de **interoperabilidade e registro longitudinal já estão ocupadas e comoditizando-se** (Health Gorilla, Particle, 1up, Zus, Oracle, InterSystems, TEFCA/RNDS). O valor migra para cima — mas as camadas de cima (contexto/IA com citação de fonte) **também** estão sendo empacotadas (Abridge, Zus GPS).

**Concorrência.** `[FATO/INFERÊNCIA]` Ninguém entrega **comercialmente** a combinação exata "longitudinal + contexto + IA ancorada **controlada pelo paciente e source-agnostic**". Porém isso **não prova moat** (Controle 1). Nos EHRs a lacuna é **estrutural** (modelo institution-first) e por isso durável contra Epic/Oracle/MV/Tasy; mas **não** é durável contra **b.well** (Patient-360 B2B2C) e **InterSystems Personal Community** (portal multi-fonte, **presente no Brasil desde 2001**), nem contra **substitute stacks** (§7B).

**Diferenciação.** `[HIPÓTESE — não comprovada]` A tese SINTERA (source-agnostic + patient-controlled + proveniência por atributo + IA não-diagnóstica ancorada + Brasil) é **real como posicionamento**, mas **fraca/não comprovada como defensabilidade**: cada componente é individualmente comoditizável, e a combinação é reprodutível onde há acesso a dado.

**Riscos (do mais grave ao menor).** (1) **Ninguém paga como consumidor** por PHR — evidência histórica robusta. (2) **Verticalização/absorção** por EHR/HIS (Epic MyChart Central) e pelo **substituto gratuito estatal (Meu SUS Digital/RNDS)**. (3) **Comoditização por IA** ("wrapper de LLM sobre FHIR"). (4) **Acesso a dado barrado no Brasil** (RNDS exige CNES/ICP-Brasil; OpenCare é POC fechada) — a "source-agnostic ingestion" esbarra em fontes que não estão abertas.

**Viabilidade (veredito honesto).** `[INFERÊNCIA]` A tese **passa no teste de "problema real e direção correta"** e **NÃO passa, ainda, no teste de "diferenciação economicamente defensável"**. As duas portas de viabilidade (§6) **não têm resposta comprovada hoje**. Não há evidência suficiente para declarar moat.

**Principais implicações para a V2.** `[INFERÊNCIA]` A V2 **não** deve começar por arquitetura (FHIR/MPI/Event-Graph). Deve começar **de-riscando o modelo de negócio**: (a) **quem paga** (provável B2B2C: operadora/hospital/pharma, não consumidor); (b) **como obter dado** (vetor realista = o **titular**, via portabilidade/upload/Meu SUS, não B2B com RNDS/OpenCare hoje). Arquitetura vem **depois** de provado o wedge.

---

## 2. Mapa do mercado (camadas)

| Camada | O que é | Players (evidência) | Estado |
|---|---|---|---|
| **1. Interop / infraestrutura** | mover/rotear/linkar dado entre fontes | Health Gorilla (QHIN), Redox, Datavant, **OpenCare (BR, POC)**, **RNDS (BR, produção)** | comoditizando (TEFCA/RNDS como *utility*) |
| **2. EHR / HIS (sistema-fonte)** | onde o dado nasce | Epic, Oracle Health, InterSystems, MEDITECH; **MV, Tasy/Philips (BR)** | dominado; lock-in institucional |
| **3. Registro longitudinal / Patient 360** | agregar + dedup + normalizar → registro único | Health Gorilla, Particle, 1up, **Zus**, Oracle (Seamless Exchange), InterSystems (Unified Care Record), **b.well** | comoditizando |
| **4. IA / contexto / inteligência clínica** | sumarizar, contextualizar, citar fonte, orquestrar | Abridge, Nabla, Innovaccer, Commure, Zus (GPS), Epic (Emmie/Art) | fronteira ativa; **grounding já é table-stakes** |
| **5. Experiência do paciente / PHR** | app do indivíduo | **Apple Health, Google Health**, PicnicHealth, b.well, Seqster; **Nav Dasa, Meu Einstein, Fleury, Rede D'Or, Meu SUS Digital (BR)** | histórico de **baixa adoção/monetização** |

**Categoria adicional relevante (não prevista):** `[FATO]` **Substituto gratuito estatal** — *Meu SUS Digital / RNDS* entrega ao cidadão brasileiro um registro longitudinal público e **gratuito**. É concorrente-substituto direto do "job" básico da SINTERA (ver §5, §6B).

**Onde a SINTERA joga:** camada 5 (experiência) reivindicando a **fatia source-agnostic + patient-controlled** que os silos (camada 5 institucionais) e os agregadores institucionais (camadas 1–3) não ocupam. **O espaço existe; a questão é se é defensável e pagável (§6, §7).**

---

## 3. Players relevantes (10 perguntas — forma condensada)

> Formato: **camada · cliente · modelo · moat dele · moat possível da SINTERA · verão de verticalização/ameaça**. Detalhe completo (as 10 perguntas por player) está no material de pesquisa que originou este doc.

### Camada 1–3 (infra + longitudinal)
- **Health Gorilla** `[FATO]` — QHIN/QHIO (TEFCA); MPI, Record Locator, Patient360, "Patient Access". *Cliente:* digital health/labs/payers (B2B). *Moat:* **designação QHIN** (barreira regulatória) + rede. *Verticalizando:* **sim** (Patient Access + "AI-ready"). *Ameaça à SINTERA:* alta **nos EUA**; **geograficamente presa** (não BR).
- **Particle Health** `[FATO]` — agregação/dedup/normalização/imputation via Carequality; **Insights Platform** (IA). *Moat:* motor de qualidade de dado + acesso via rede — **frágil** (litígio antitruste com Epic expõe dependência de acesso). *Verticalizando:* **sim**.
- **Redox** `[FATO]` — middleware de integração EHR↔apps (12k+ orgs). *Moat:* rede de integrações/switching cost. *Verticalizando:* fraco. **Mais parceiro potencial que concorrente.**
- **1upHealth** `[FATO]` — plataforma FHIR lakehouse, foco **payer/CMS compliance**. *Moat:* compliance CMS + endpoints. *Enterprise/payer-cêntrico.*
- **Datavant** `[FATO]` — record retrieval + tokenização (linkagem de-identificada), líder RWD. *Moat:* **rede massiva** (poucos vencedores). Não patient-facing. Sinal: a camada de rede tende a **concentração**.
- **Zus Health** `[FATO]` — ZAP (registro agregado) + CPR + **GPS (sumário com evidence-linking)**; store **FHIR-native com proveniência**; **candidate QHIN (2026)**. *Cliente:* builders de digital health/VBC (B2B, US-only). *Moat:* rede + posição de infraestrutura. **Analogia mais próxima na camada de dados; provider-centric; não BR.**

### Camada 4 (IA/contexto)
- **Abridge** `[FATO]` — ambient scribe com **Linked Evidence** (cada trecho → transcript/áudio). **Comercial, escala enterprise** (Kaiser/Mayo/Duke). *Prova que evidence-grounding já é produto, não moat.*
- **Nabla / Innovaccer / Commure** `[FATO]` — ambient/agêntico e data-activation/intelligence; **todos B2B/enterprise**, narrativa de "agentes/orquestração à frente do produto".
- **Conclusão da camada** `[INFERÊNCIA, alta]` **Evidence-grounding e sumarização longitudinal = table-stakes** (comercial em Abridge/Zus; pesquisa acadêmica ativa em "verifiable EHR summarization"). **Não pode ser o moat central da SINTERA.**

### Camada 5 (experiência/PHR)
- **b.well Connected Health** `[FATO]` — **Patient-360 FHIR-native**, agrega provider/payer/lab/pharma; Gartner MQ. *Cliente que paga:* **empregador/operadora/health system (B2B2C, white-label)** — a marca é do cliente, não do paciente. **É o benchmark competitivo mais direto da tese SINTERA.**
- **PicnicHealth** `[FATO]` — retrieval de prontuário em nome do paciente + IA; **quem paga = pharma (RWD)**; consumidor só paga **US$499/ano** se não doar dado. **Prova que o dinheiro está em pharma/payer, não no consumidor.**
- **Apple Health Records** `[FATO]` — agrega registro clínico via FHIR, **on-device**; **disponível só EUA/UK/Canadá — NÃO no Brasil**. *Moat:* ecossistema/hardware + marca de privacidade. *Ameaça BR:* **média-baixa hoje**, média-alta se abrir no BR.
- **Google Health / Fitbit** `[FATO]` — wellness-first + Gemini (Health Coach). *Histórico de descontinuar saúde (Google Health morreu 2012).* Distribuição Android forte no BR; agregação clínica BR **inexistente hoje**.
- **Nav Dasa / Meu Einstein / Fleury / Rede D'Or** `[FATO/INFERÊNCIA]` — apps de paciente **presos a um provider/rede**: acessam/organizam/compartilham exames **da própria rede**; **sem** agregação source-agnostic, contexto/proveniência ou IA ancorada. **Nav Dasa é o mais próximo no consumer, mas Dasa-centric.**

### Brasil — infra/regulação (não são "concorrentes-produto", mas definem o campo)
- **OpenCare Interop (InovaHC/HCFMUSP + B3/PDtec)** `[FATO]` — **POC anunciada (dez/2025), piloto 2026, NÃO produção**; barramento de troca institucional inspirado no open finance; **sem armazenamento central**; consentimento **opt-in por finalidade** (declarado). *Cliente:* instituições (BP, Sírio, Fleury, Dasa, Sabin, RD). **Não é consumível por startup hoje** (ambiente fechado, sem API pública). **Complementar à RNDS.** → **parceiro/canal futuro, não concorrente nem fonte hoje.**
- **RNDS (Ministério da Saúde)** `[FATO]` — barramento nacional **em produção**, troca **FHIR**; cidadão acessa via **Meu SUS Digital** (registro longitudinal público **gratuito**). Consentimento **opt-out**. **Formulação factual precisa (corrigida):** a RNDS **não constitui hoje um on-ramp B2B genérico** para uma startup acessar livremente o conjunto de dados de saúde do cidadão. O **Decreto 12.560/2025** define finalidades específicas de tratamento e **veda uso para outros fins**; o acesso por estabelecimentos/profissionais (públicos e privados) é **restrito e vinculado ao contexto de atendimento**. Os serviços FHIR são estruturados por estabelecimento/CNES — mas o ponto sólido para nossa análise é o **enquadramento jurídico de finalidade**, não uma regra universal de credenciamento. `[CONFLITO registrado]` fontes divergem sobre "acesso do privado" — reconciliação: **enviar** (privado→público, unidirecional) ≠ **consumir** (restrito). → **fonte oficial poderosa, mas hoje inacessível via B2B; vetor viável = o titular (portabilidade/Meu SUS).**
- **BR-Core (HL7 FHIR R4 BR, v1.0.0)** `[FATO]` — padrão nacional de perfis. **Adotá-lo é requisito para ser "RNDS/OpenCare-ready" sem dependência** — baixo custo, alto valor de opção.

### 3-bis. Contraexemplo forte à hipótese de lacuna: InterSystems HealthShare

`[FATO]` A própria InterSystems descreve o **HealthShare** como uma família que já combina, comercialmente, quase todos os elementos da tese SINTERA:

```
Fontes → Health Connect → Patient Index/MPI → Unified Care Record (agrega/normaliza/dedup, patient-centric data model, FHIR, consentimento)
       → Clinical Viewer → Personal Community (app do PACIENTE conectado ao registro unificado) → Care Community → Health Insight (analytics/IA)
```

`[INFERÊNCIA — confiança alta]` **Isto refuta a formulação ingênua "ninguém oferece a combinação da SINTERA".** A combinação *longitudinal + patient-centric data model + MPI + consentimento + FHIR + app do paciente + analytics/IA* **já existe empacotada** — e a InterSystems **tem presença real no Brasil desde 2001**. A diferença remanescente é de **governança/modelo** (Personal Community é *institution-governed*, o paciente é usuário e não proprietário; não é source-agnostic independente do deploy institucional), **não de capacidade técnica**.

**→ O teste do moat fica, portanto, muito mais exigente. A pergunta não é mais "quem já junta essas peças?", e sim:**

> **O que a SINTERA faria que uma plataforma como o HealthShare NÃO poderia simplesmente incorporar?**

`[HIPÓTESE]` Se a resposta honesta for *"tecnicamente, nada"*, então a diferenciação **não pode estar na arquitetura funcional** — terá de vir de **modelo de produto, distribuição, relação/dados proprietários, UX, efeitos cumulativos ou posição regulatória** que a InterSystems teria *desincentivo* (não incapacidade) para replicar. **Essa pergunta permanece aberta neste assessment** — é o teste central que a decisão estratégica precisa responder.

---

## 4. Competitive matrix (posição estratégica, não features)

Escala: ●●● forte · ●● médio · ○ fraco/ausente · — n/a. **SINTERA = estado atual (pré-conectores).**

| Dimensão | SINTERA | Health Gorilla | Particle | Zus | b.well | Epic | Oracle H. | InterSystems | MV | Nav Dasa | RNDS/Meu SUS |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Infra/rede de fontes | ○ | ●●● | ●● | ●● | ●● | ●●● | ●●● | ●●● | ●● (BR) | ●● (Dasa) | ●●● (BR) |
| Interoperabilidade/FHIR | ○→● | ●●● | ●●● | ●●● | ●●● | ●●● | ●●● | ●●● | ●● | ●● | ●●● |
| Patient matching/MPI | ● | ●●● | ●● | ●● | ●● | ●●● | ●●● | ●●● | ●● | ●● | ●●● |
| Longitudinal/Patient-360 | ●● | ●●● | ●●● | ●●● | ●●● | ●●● (Cosmos, de-ident.) | ●●● | ●●● | ●● | ● (Dasa) | ●● |
| Proveniência por atributo | ●●● | ●● | ●● | ●●● | ●● | ●● | ●● | ●● | ○ | ○ | ● |
| Contexto/curadoria | ●● | ○ | ● | ●● | ●● | ●● | ●● | ●● | ● | ○ | ○ |
| IA ancorada em evidência | ●● | ● | ● | ●● | ● | ●● (roadmap) | ●● | ● | ● (anúncio) | ○ | ○ |
| Consentimento granular | ●● | ●● | ● | ●● | ●● | ●● | ●● | ●●● | ●● | ● | ● (opt-out) |
| **Patient-controlled** | ●●● | ● | ○ | ○ | ●● | ● (Share Everywhere) | ○ | ● | ● | ● | ●● (bloqueio) |
| **Patient-owned** | ●●● | ○ | ○ | ○ | ● | ○ | ○ | ○ | ○ | ○ | ○ |
| Experiência (UX) | ●● | ○ | ○ | ● | ●● | ●● | ●● | ● | ●● | ●●● | ●● |
| Distribuição | ○ | ●● | ●● | ●● | ●● | ●●● | ●●● | ●●● | ●●● (BR) | ●●● (BR) | ●●● (BR) |
| Modelo pagador | patient? | B2B | B2B | B2B | **B2B2C** | B2B | B2B | B2B | B2B | provider | estatal/grátis |
| Integração EHR | ○ | ●●● | ●● | ●● | ●● | ●●● | ●●● | ●●● | ●●● | ●● | ●●● |
| Posição institucional | ○ | ●● | ● | ● | ●● | ●●● | ●●● | ●●● | ●●● | ●●● | ●●● |
| **Presença Brasil** | ●● | ○ | ○ | ○ | ○ | ○ | ● | ●●● | ●●● | ●●● | ●●● |

**Leitura crítica:** a SINTERA lidera **apenas** em *proveniência por atributo · patient-controlled · patient-owned*, e empata em *contexto/IA-ancorada*. Perde em **tudo que é rede, distribuição, integração e posição institucional** — que é onde os moats da categoria efetivamente estão (§7). No Brasil, **InterSystems, MV, Nav Dasa e RNDS** já têm distribuição e presença; a SINTERA não.

---

## 5. Viabilidade

| Dimensão | Achado (evidência) | Confiança |
|---|---|---|
| Tamanho/maturidade | Digital health funding US 2025 alto mas concentrado em mega-rounds AI; **PHR consumer é categoria madura e de baixo sucesso**. | média |
| **Quem paga** | **Consumidor historicamente não paga** (Markle ~10% de uso; Google Health morto; PHR sem efeito clínico comprovado). Pagadores viáveis: **pharma (RWD), payer/empregador/provider (B2B2C)**. | **alta** |
| B2B vs B2C | B2C puro = CAC/churn altos. **B2B2C** é o padrão dos sobreviventes (b.well, PicnicHealth). | alta |
| Comprador (BR) | `[INFERÊNCIA]` operadora (retenção/contenção de custo), hospital privado (diferenciação), pharma (RWD, menor e mais regulado). **Não o cidadão.** | média |
| Distribuição | deles = via CIO/provider; da SINTERA teria de ser D2C (caro) ou via parceiro que já "possui" o paciente. | média |
| **Aquisição de dado (BR)** | `[CORRIGIDO]` **A RNDS não é um on-ramp B2B genérico** (Decreto 12.560/2025 restringe finalidade; acesso vinculado ao contexto de atendimento); OpenCare é POC fechada; sem TEFCA-equivalente privado. **A "source-agnostic ingestion" não tem on-ramp aberto no Brasil hoje.** Pergunta de produto (não de arquitetura): *conseguimos dado SUFICIENTE, AUTOMÁTICO e com FRICÇÃO baixa o bastante para um produto que o usuário realmente use?* — upload/portabilidade resolve acesso mas cria fricção; conectar cada fonte reintroduz o problema de integração. | **alta** |
| Dependência de terceiros | alta (fontes/EHRs controlam a origem; direitos de acesso do titular são o vetor legal). | alta |
| Regulação | LGPD (dado sensível) + **Decreto 12.560/2025** (veda uso secundário) + **ANPD Mapa 2026-2027** (saúde+IA+uso secundário na mira). | alta |
| **RDC-657 (SaMD)** | `[CORREÇÃO]` **Não afirmar que o não-diagnóstico "elimina" a incidência.** O enquadramento SaMD depende da **função pretendida** do software (diagnóstico/terapêutica/apoio à decisão clínica) e **exige análise regulatória específica**. Manter-se não-diagnóstica é **candidata** a evitar o enquadramento, **não garantia**. "IA de apoio à decisão clínica" é a fronteira que reenquadra como SaMD. | alta (do princípio) / a determinar (do enquadramento) |
| Segurança/LGPD | requisito (NGS2/ICP-Brasil, RIPD, minimização) — **custo de entrada, não vantagem** (Controle 3). | alta |
| Network effects | **fracos no lado consumidor** (meu registro não melhora com o de outro). O efeito de rede real é **institucional** (mais fontes) e já capturado por QHIN/RNDS. | alta |
| Possibilidade de moat | ver §7 — **não comprovada**. | — |
| **Risco de comoditização por IA** | **alto:** agregação FHIR + sumarização viram commodity (HG API grátis, TEFCA/RNDS, LLMs). Risco de "wrapper de LLM sobre FHIR". | alta |
| **Risco de absorção por EHR/HIS + Estado** | **alto:** Epic MyChart Central (agregador patient-facing); no BR, **Meu SUS Digital grátis** + MV/InterSystems podem absorver a categoria. | alta |
| Risco de execução | alto: obter dado + construir relação direta com o paciente + achar pagador simultaneamente. | alta |

---

## 6. As duas portas de viabilidade (resposta explícita)

### Porta A — *Por que comprar SINTERA em vez de combinar infra (Health Gorilla/Particle/OpenCare) + app próprio + IA?*
`[INFERÊNCIA — confiança média]` **Resposta honesta hoje: não há resposta decisiva.**
- Nos **EUA**, o substitute stack (HG/Particle + app + LLM) reproduz a maior parte do valor → a SINTERA **não** teria wedge lá.
- No **Brasil**, o substitute stack é **temporariamente mais fraco** porque **não há on-ramp aberto** (RNDS barrado, OpenCare fechado) — o que **protege a SINTERA e a todos** igualmente, mas também **impede a própria SINTERA** de montar a agregação. Ou seja: a "proteção" atual é *ausência de dado acessível*, não diferenciação da SINTERA.
- O único fator que **não** é trivialmente combinável: **relação direta + confiança + consentimento do titular** e **conformidade RDC-657/LGPD nativa**. Isso é **barreira de execução**, não moat comprovado.
- **Veredito:** Porta A **não está respondida**. Depende de a SINTERA provar que a *montagem para o indivíduo brasileiro* + *relação de confiança* vale mais que a soma dos componentes — o que ainda não foi demonstrado.

### Porta B — *Por que SINTERA sobrevive se EHRs/HIS (Epic/Oracle/MV/Tasy/InterSystems) + Estado (RNDS) incorporarem longitudinalidade/contexto/IA patient-facing?*
`[INFERÊNCIA — confiança média]`
- **Contra os EHRs institution-first (Epic/Oracle/MV/Tasy):** a lacuna é **estrutural** (o cliente deles é a instituição; patient-owned/source-agnostic canibaliza o modelo). Isso é **durável** — mas eles **verticalizam parcialmente** via portais (MyChart Central, MV Personal Health/Linha da Vida) que cobrem o "ver meus dados" sem serem source-agnostic.
- **Contra InterSystems (Personal Community, já no BR):** a lacuna **não é estrutural** — eles já têm portal paciente multi-fonte. Diferenciação teria de ser *modelo (patient-owned) + experiência + proveniência*, não capacidade técnica.
- **Contra o Estado (Meu SUS Digital, grátis):** cobre o job básico gratuitamente para dados do SUS. A SINTERA só sobrevive se agregar **além** do SUS (privado + documentos + wearables) **com contexto/curadoria** que o Meu SUS não faz.
- **Veredito:** Porta B tem uma **resposta parcial e condicional** (a lacuna estrutural vs Epic/MV é real), mas **fraca** contra InterSystems e contra o substituto gratuito estatal.

### Porta C (adicionada) — o substituto gratuito estatal: *por que o cidadão usaria a SINTERA se parte relevante da sua história pública já está disponível de graça pelo Meu SUS Digital/RNDS?*
`[INFERÊNCIA]` **Resposta fraca (insuficiente):** "porque a SINTERA organiza melhor / tem UX melhor". **Resposta potencialmente defensável (a demonstrar):** a SINTERA agrega o que o Meu SUS **não** faz — **público + privado + documentos externos + laboratório + imagem + wearables + dados informados pelo indivíduo**, com **contexto longitudinal transversal, controle de compartilhamento entre organizações e experiência independente da instituição**. `[FATO]` O Meu SUS cobre os dados do **SUS**; a fatia privada, documental e de wearables está **fora** do seu escopo. **Mas o assessment não pode presumir que essa soma justifica a existência — precisa ser demonstrada com disposição a pagar (§5) e acesso real ao dado privado (barrado hoje — §5).**

> **Se a resposta às Portas A, B e C é "não sabemos / depende / diferenciação insuficiente" — este é o achado, e ele aparece aqui sem narrativa otimista, como pedido.**

---

## 7. Teste do candidato a moat (falsificação)

**Hipótese H1 (a testar, não a confirmar):** *o moat da SINTERA está na composição de componentes commoditizáveis, orientada ao indivíduo, com contexto longitudinal verificável, IA ancorada em evidência, governança de acesso/consentimento e posição patient-centric.*
**Hipótese nula H0:** *essa composição não é moat — é apenas ainda-não-empacotada, e reprodutível por quem tiver acesso a dado + capital.*

### 7A. Classificação de cada capacidade (Controle 3)

| Capacidade | Classificação | Justificativa (evidência) |
|---|---|---|
| Interop/FHIR/BR-Core | **requisito operacional** | padrão aberto; obrigatório para trocar dado |
| Agregação/dedup/normalização | **commoditizável** | HG/Particle/Oracle/InterSystems fazem melhor e em escala |
| Registro longitudinal | **commoditizável / pré-requisito** | Zus/b.well/1up/EHRs já entregam |
| Patient matching/MPI | **requisito operacional** | maduro em Oracle/HG; não diferencia |
| **Proveniência por atributo** | **diferencial (fraco→médio)** | mais granular que a média; **mas Zus já faz "detailed provenance"** → não único |
| IA ancorada/grounding | **table-stakes** | Abridge (comercial), Zus GPS, papers de verifiable summarization |
| Consentimento/governança | **requisito regulatório** | LGPD/RDC-657 — obrigação, não vantagem (por padrão) |
| Segurança (NGS2/ICP/RIPD) | **requisito regulatório + barreira de execução** | custo de entrada |
| Conformidade RDC-657 (não-diagnóstico) | **requisito regulatório (enquadramento a determinar pela função) + barreira de execução** | `[CORREÇÃO]` NÃO afirmar que elimina a incidência de SaMD; exige análise regulatória específica da função pretendida. Não-diagnóstico é *candidato* a evitar o enquadramento — não moat, não garantia. |
| **Patient-owned / patient-controlled** | **potencial moat (estrutural vs EHRs) — não comprovado** | colide com o modelo institution-first; **mas não com b.well/InterSystems** |
| **Relação direta + confiança do titular (BR)** | **barreira de execução → potencial moat (se atingir escala)** | difícil e caro de construir; fraco network effect |
| Experiência/UX | **diferencial (raso, copiável)** | não defensável isoladamente |
| **Montagem específica p/ o ecossistema BR** | **barreira de execução → potencial moat** | acesso a fontes BR é difícil; quem montar primeiro larga na frente |

**Resultado do teste:** `[INFERÊNCIA — confiança média-alta]` **Nenhuma capacidade isolada é "moat comprovado".** Os candidatos reais a moat **não são tecnológicos**: (1) lacuna **estrutural** vs EHRs institution-first (durável, mas parcial e não vale contra b.well/InterSystems/Meu SUS); (2) **relação direta + confiança do titular em escala** (barreira de execução, network effect fraco); (3) **montagem para o ecossistema BR** (barreira de execução temporária). **H1 é largamente falsificada como moat de *tecnologia/composição*; sobrevive apenas como *possível moat de execução/posição*, ainda não comprovado.**

### 7B. Substitute Stack Analysis (Controle 2)

**Metodologia (importante):** o "% do valor reproduzível" **NÃO é uma métrica observável** — é uma **estimativa analítica estruturada**, calculada como a **cobertura ponderada por capacidade**. Pesos atribuídos às capacidades da SINTERA (soma 100): ingestão multi-fonte (25) · registro longitudinal/dedup (15) · proveniência por atributo (10) · contexto/curadoria (15) · IA ancorada (10) · consentimento/governança (10) · experiência/UX (10) · relação/confiança com o titular (5). Para cada stack, estima-se quanto de cada capacidade ele já cobre (0–100%) e soma-se ponderado. Os pesos são **premissas discutíveis** — mudá-los muda o resultado; por isso o número deve ser lido como *ordem de grandeza*, não medida. Exemplo trabalhado (**InterSystems + Personal Community + IA, no BR**): ingestão ●●● (~90%), longitudinal ●●● (~95%), proveniência ●● (~60%), contexto ●● (~60%), IA ● (~50%), consentimento ●●● (~90%), UX ●● (~60%), relação-titular ○ (~10%) → **≈ 72%**. O que ele **não** cobre bem: *patient-owned*, IA-grounding madura, relação direta com o titular e UX consumer — os 10–30% que teriam de ser o diferencial.

| Stack substituto | % do valor reproduzível | Comentário crítico |
|---|---|---|
| **Health Gorilla + app + LLM (EUA)** | **~80–90%** | acesso a dado (QHIN) + longitudinal + LLM-grounding; falta só UX+relação. **Comoditização alta nos EUA.** |
| **Particle + app + LLM (EUA)** | ~75–85% | idem, com risco de acesso (litígio Epic). |
| **OpenCare/RNDS + app + IA (BR)** | **~70–85% — SE/QUANDO abrir** | hoje **bloqueado** (POC/CNES). O que segura o substituto é **ausência de acesso**, não superioridade da SINTERA. |
| **EHR (InterSystems Personal Community) + camada IA** | **~70–80% (BR)** | InterSystems já tem multi-fonte + BR; faltaria patient-owned + IA-grounding + UX. **Ameaça mais concreta.** |
| **Apple/Google Health + APIs + IA** | ~50–70% | forte em distribuição/UX; fraco em source-agnostic clínico BR e proveniência; **Apple não está no BR.** |
| **Interop genérica + LLM + UX própria** | ~60–75% | reproduz o "wrapper"; falta proveniência rigorosa + relação + conformidade. |

**Conclusão (Controle 2):** `[INFERÊNCIA — alta]` **Onde há acesso a dado, o substitute stack reproduz 70–90% do valor → risco de comoditização explícito e alto.** No Brasil, o que **temporariamente** reduz o substituto é a **falta de on-ramp de dado aberto** — proteção frágil, que **também limita a SINTERA**. **A defesa real teria de estar nos 10–30% não comoditizáveis: relação/confiança do titular + montagem BR + rigor de proveniência/conformidade** — e isso é **execução**, não tecnologia.

### 7C. Desmembramento "patient-*" (Controle 3)

| Conceito | Pergunta | Situação típica no mercado | Posição SINTERA |
|---|---|---|---|
| **patient-centric** | o design serve o indivíduo? | raro (maioria institution/provider-facing) | **sim** (design) |
| **patient-controlled** | quem **decide** o acesso? | RNDS opt-out (institucional); OpenCare opt-in; EHR portal (instituição) | **sim** (titular decide) |
| **patient-owned** | quem **detém** o dado? | quase ninguém (dado fica na origem/instituição) | **reivindica sim** — mas *deter cópia* ≠ controlar a fonte |
| **patient-paid** | quem **paga**? | **quase ninguém paga como consumidor** | **maior risco** — se depender do paciente pagar, é frágil |

**Insight crítico:** a SINTERA é forte em *centric/controlled/owned* e **frágil em *paid***. **Confundir esses quatro é onde a tese falha** — "o paciente controla" **não** implica "o paciente paga". O pagador realista é institucional (B2B2C), o que **muda o produto** (o comprador é a operadora/hospital, mesmo que o usuário seja o paciente).

---

## 8. Respostas A / B / C / D

**A — Qual problema real a SINTERA resolve?**
`[INFERÊNCIA]` Dar ao **indivíduo** uma representação **única, source-agnostic, contextualizada e auditável** da sua trajetória de saúde, atravessando silos (público + privado + documentos + wearables) que **nenhuma instituição isolada** cobre. O problema é real; a **demanda paga por ELE especificamente** (vs. o "ver meus exames" que apps de provider e o Meu SUS já dão de graça) **não está comprovada**.

**B — Quem já resolve (mesmo que parcialmente)?**
`[FATO/INFERÊNCIA]` (1) **Silos de provider** (Nav Dasa, Meu Einstein, Fleury, Rede D'Or, MyChart) — parcial, não source-agnostic. (2) **Estado (Meu SUS Digital/RNDS)** — grátis, dados do SUS. (3) **Agregadores institucionais** (Zus, b.well, InterSystems Personal Community, Oracle Seamless Exchange) — longitudinal, mas institution-governed. (4) **Substitute stacks** (infra + LLM + app). **Ninguém entrega a combinação exata da SINTERA — mas isso é H1, não moat (§7).**

**C — Por que a SINTERA é diferente e por que essa diferença pode ser defensável?**
`[HIPÓTESE — não comprovada]` **Diferente:** source-agnostic + patient-owned/controlled + proveniência por atributo + IA não-diagnóstica ancorada + nativa ao marco BR. **Defensável?** **Fracamente e não comprovadamente.** A diferenciação **tecnológica** é comoditizável (§7A/7B). O que resta como **candidato a moat** é **não-tecnológico e de execução**: (i) lacuna estrutural vs EHRs institution-first (durável, parcial); (ii) relação/confiança direta com o titular em escala; (iii) montagem para o ecossistema BR enquanto o acesso é difícil. **Nenhum é moat comprovado hoje.**

**D — O que realmente precisa entrar na V2 (em função desta conclusão)?**
`[INFERÊNCIA — e explicitamente NÃO um backlog de implementação]` A conclusão **não** aponta para "implementar FHIR/MPI/Event-Graph agora". Aponta para **de-riscar as duas incógnitas existenciais antes da arquitetura**:
1. **Quem paga** — validar um **wedge B2B2C** (operadora/hospital/pharma) com disposição a pagar real, OU comprovar disposição a pagar do consumidor (contra a evidência histórica).
2. **Como obter dado** — validar o **vetor do titular** (portabilidade/upload/Meu SUS Digital) como caminho real de ingestão, já que RNDS/OpenCare estão fechados ao B2B.
FHIR/BR-Core, MPI, Event-Graph, Evidence Engine passam a ser **capacidades candidatas**, priorizadas **pelo wedge validado e pelos primeiros casos reais de acesso a dado** — não por completude arquitetural. **A arquitetura é consequência da resposta às Portas A e B, não pré-requisito dela.**

---

## 9. Conclusão estratégica (sem backlog)

`[INFERÊNCIA — síntese]`
1. **A tese SINTERA está certa sobre o problema e a direção, e não comprovada sobre a diferenciação.** O relatório de mercado original confundia "problema real / tendência real" com "moat" — este assessment separa os dois e conclui que **o moat não está demonstrado**.
2. **Os moats da categoria são de rede, distribuição, integração e posição institucional** — exatamente onde a SINTERA é fraca. **Registro longitudinal e IA-com-citação são table-stakes, não diferencial.**
3. **A diferenciação plausível é de *modelo + execução + posição BR* (patient-owned, source-agnostic, proveniência, conformidade nativa), vendida provavelmente B2B2C** — e precisa ser **provada**, não presumida.
4. **As duas maiores ameaças** são: **(a) o pagador-consumidor inexistente** e **(b) a absorção por EHR/HIS + substituto gratuito estatal**. Ambas atacam a viabilidade *antes* da tecnologia.
5. **Recomendação de sequência (decisão, não implementação):** **fechar a V1**; **não** iniciar arquitetura de V2; **decidir primeiro o wedge de pagador e o vetor de acesso a dado** (de-risk das Portas A e B). Só com essa decisão estratégica tomada, escrever a V2 e, depois, o gap analysis técnico.

### 9.1 Veredito de cenário

Dos três cenários possíveis:
- **Cenário A — Tese forte** (lacuna clara + disposição a pagar + barreira de entrada suficiente): **NÃO sustentado pela evidência.**
- **Cenário B — Tese viável, mas precisa mudar** (há mercado, mas a proposta atual não é suficientemente diferenciada → reposicionar produto/cliente/modelo): **parcialmente sustentado.**
- **Cenário C — Tese não suficientemente defensável hoje** (a maior parte do valor é reproduzível por infra existente + EHR + IA; sem moat convincente demonstrado): **o mais sustentado pela evidência atual.**

`[INFERÊNCIA — confiança média]` **Veredito — leia com precisão (correção importante):** o estado atual **"mais próximo de C"** deve ser lido como **ESTADO DE RISCO ATUAL, não como conclusão de inviabilidade**. A formulação correta é:

> **A SINTERA está hoje em estado de TESE NÃO COMPROVADA, com risco elevado de comoditização e sem moat demonstrado. Isso NÃO equivale a demonstrar inviabilidade.**

A diferença não é semântica — governa a próxima decisão. O Cenário C afirma *"a proposta não é suficientemente defensável"*; a situação real da SINTERA é *"ainda não sabemos se existe uma proposta suficientemente defensável"* — **incerteza estratégica, não prova de inviabilidade** (o próprio documento mostra: Porta A não respondida, B parcial, C fraca, moat não comprovado — tudo isso é *ausência de prova*, não *prova de ausência*). **O assessment provou a ausência de moat demonstrado; NÃO provou que não se pode construir um negócio defensável.** A passagem para B/A depende de **provar um wedge** (§10). **Isto não é fracasso do assessment — é o resultado que queríamos obter se fosse verdadeiro.**

**Estado de viabilidade (destilado):**

| Pergunta | Estado |
|---|---|
| O problema existe? É importante? O mercado evolui nessa direção? | **Sim / Sim / Sim** |
| A tecnologia necessária existe? | **Sim** |
| A tecnologia é diferenciadora? Longitudinalidade/IA-com-evidência/source-agnostic são moat? | **Não** |
| Patient-centric / patient-controlled são moat? | **Não comprovado** |
| Existe comprador claro + disposição a pagar comprovada? | **Ainda não / Não** |
| Existe acesso escalável ao dado no Brasil? | **Não comprovado** |
| **Existe moat?** | **Não demonstrado** |
| **A SINTERA é inviável?** | **Também NÃO demonstrado** ← a linha decisiva |

### 9.2 Ordem de leitura deste documento (para a decisão)

Ao reavaliar, **não** comece por *"quais funcionalidades entram na V2?"*. A ordem correta é:
1. **Qual é a razão econômica para a SINTERA existir?** (§8A, §9)
2. **Quem pagaria por isso?** (§5, §7C — provável B2B2C, não o consumidor)
3. **Por que esse comprador não resolveria com tecnologia existente?** (§6, §7B, §3-bis — a pergunta do HealthShare)
4. **Só então: o que precisamos construir?** (§8D — e mesmo isso é *candidato*, não backlog)

> **Frase de fechamento:** a SINTERA tem um **problema real** e um **posicionamento coerente**, mas **ainda não tem uma diferenciação comprovadamente defensável**. O próximo passo não é construir mais plataforma — é **provar quem paga e como o dado entra**. Sem isso, qualquer arquitetura de V2 corre o risco de ser um wrapper elegante sobre um dado que a SINTERA não consegue obter, para um cliente que não paga.

---

## 10. Próxima fase: WEDGE VALIDATION (validação comercial — NÃO backlog técnico)

`[DECISÃO DE FASE]` O maior achado do assessment **não é tecnológico, é econômico**: *o problema pode ser real, mas isso não significa que alguém pagará para resolvê-lo.* Portanto a próxima etapa **não** é uma V2 de arquitetura, **nem** FHIR/MPI/Event-Graph/Evidence-Engine/conectores — mesmo que façam sentido técnico. É **encontrar UMA situação (não dez) em que alguém pagaria pela SINTERA.**

A pergunta muda de *"como fazer o melhor produto para o paciente?"* para **"quem tem um problema econômico grande o suficiente para pagar para que o paciente tenha essa experiência?"**

### 10.1 O gap que o assessment ainda não fechou: o JOB ECONÔMICO por comprador
"Provavelmente B2B2C" é **hipótese de modelo, não validação**. Operadora, hospital e pharma são **jobs econômicos diferentes** — precisam ser testados separadamente, cada um com ROI mensurável:

| Comprador-hipótese | Por que pagaria (job econômico a testar) |
|---|---|
| **Operadora** | reduzir sinistralidade · reduzir duplicidade de exames · reduzir internações · melhor coordenação · retenção do beneficiário · experiência |
| **Hospital** | aquisição/fidelização de paciente · continuidade pós-alta · redução de retrabalho · integração da jornada · diferenciação |
| **Pharma / RWD** | real-world data/evidence · pesquisa · recrutamento · patient journey (compatível com LGPD/consentimento) |

### 10.2 A hipótese central a testar (a mais promissora)
Não *"o paciente pagará pela SINTERA?"* (a evidência histórica torna isso fraco), e sim:

> **"Uma organização pagará para oferecer ao seu paciente/beneficiário uma camada INDEPENDENTE de continuidade da informação que ela própria não consegue construir ou controlar integralmente?"**

Isso preserva **B2B2C no modelo econômico + patient-centric/patient-controlled na experiência**:
```
PAGADOR (operadora/hospital) → SINTERA → PACIENTE (controla seus dados: SUS + privado + pessoal) → HISTÓRIA ÚNICA
```
É muito diferente de vender um PHR direto ao consumidor.

### 10.3 "Contexto" precisa ser vendido como RESULTADO, não como tecnologia
`[INFERÊNCIA]` Sem um resultado mensurável, "contextualização" continua sendo *feature*. Deve ser vendido como: *"reduz X min de reconstrução de histórico"* · *"reduz duplicidade"* · *"melhora continuidade pós-alta"* · *"aumenta retenção do beneficiário"*. A oportunidade escondida: quanto **mais** interoperável o Brasil ficar, **menor** a necessidade de uma empresa cuja função é *"conseguir o dado"* — e **maior** a de uma empresa cuja função é *"transformar volume de dado em uma representação útil da trajetória"*. Mas só se isso virar resultado econômico.

### 10.4 O que testar, por hipótese de comprador
Quem compra · qual problema · como resolve hoje · quanto custa hoje · qual benefício econômico · quem decide · orçamento existente · disposição a pagar · tempo de implantação · qual dado é necessário · quem controla esse dado · como a SINTERA o obtém (com que fricção) · barreira de implantação.

### 10.5 Critério de decisão (a fase termina em uma destas três)
- **A — Wedge comprovado:** existe comprador + problema econômico + disposição a pagar → **definir a V2**.
- **B — Wedge promissor, não comprovado:** há problema e interesse, mas falta prova econômica ou acesso ao dado → **novo teste antes da V2**.
- **C — Wedge não encontrado:** proposta tecnicamente interessante, mas sem evidência de mercado suficiente → **reavaliar a tese** (não é fracasso — é informação).

**Regra:** esta fase **NÃO produz backlog técnico**. Produz uma **decisão** sobre *qual problema específico alguém pagará para a SINTERA resolver*. Só então a V2 de produto passa a fazer sentido — e a V1 tem o papel restrito de provar que **a experiência funciona e o valor é compreensível**, não de provar o negócio inteiro.

---

### Registro de hipóteses a testar (para a decisão estratégica)
- **H1** (moat por composição): **largamente falsificada** como tecnologia; sobrevive só como possível moat de execução — *a testar com um wedge real*.
- **H2** (pagador): o comprador é B2B2C (operadora/hospital/pharma), não o consumidor — *a validar*.
- **H3** (acesso a dado BR): o vetor viável é o titular (portabilidade/Meu SUS/upload), não B2B com RNDS/OpenCare — *a validar juridicamente e na prática*.
- **H4** (absorção): Meu SUS Digital e/ou InterSystems/MV estreitam a lacuna — *monitorar; definir o "além-do-SUS" que só a SINTERA faz*.
- **H5** (a mais importante — a testar no wedge): *uma organização paga para oferecer ao seu paciente/beneficiário uma camada independente de continuidade que ela mesma não consegue construir/controlar* — B2B2C no pagador, patient-centric/controlled na experiência.
- **H6** (fricção de dado): existe um caminho de ingestão **automático e de baixa fricção** suficiente para um produto usável — *a validar (produto/distribuição, não arquitetura)*.
- **H7** (HealthShare): existe algo que a SINTERA faria que o InterSystems teria **desincentivo** (não incapacidade) de replicar — *a responder na decisão estratégica*.

### Fontes e confiança
Material de pesquisa com URLs por afirmação (6 frentes: infra US · longitudinal+IA US · EHR giants · Brasil infra/regulação · Brasil EHR/consumer · PHR/viabilidade). **Confiança geral: média** — coleta via resumos de busca (egresso bloqueou fontes primárias); números de escala/funding **auto-reportados, não auditados**. Revalidar em fonte primária antes de decisão irreversível.

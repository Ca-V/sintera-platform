# SINTERA — V2 Strategic Product & Architecture Readiness

**Status:** documento **estratégico e de prontidão arquitetural**. **NÃO é implementação, NÃO é backlog, NÃO altera código nem a V1.**
**Regra absoluta:** nada aqui vira código. Decisões marcadas como **AGORA** são de *compatibilidade/não-dívida* (design intent), não de construção.
**Precede:** a decisão da V2, que depende da convergência de duas trilhas (produto/arquitetura + wedge de mercado).
**Base:** `COMPETITIVE_VIABILITY_ASSESSMENT.md`, `WEDGE_VALIDATION_FRAMEWORK.md`.

---

## 0. Enquadramento (as duas trilhas e a sequência revisada)

O assessment mostrou que **construir tecnologia, por si só, não cria vantagem competitiva suficiente**. Logo, a V2 precisa nascer de um **wedge comercial comprovado**, não de uma lista de capacidades tecnicamente desejáveis. Mas isso **não** exige parar o trabalho estratégico/arquitetural em nível de **planejamento**.

**Duas trilhas em paralelo:**
- **Trilha A — Produto/Arquitetura (agora, só planejamento):** este documento + gap analysis conceitual.
- **Trilha B — Mercado (agora, mundo real):** Wedge Validation (entrevistas), instrumentado por `WEDGE_VALIDATION_*`.

**Sequência revisada (substitui a anterior):**
```
V1 → congelamento → definição estratégica da V2 + arquitetura CONCEITUAL (este doc)
                                    ║ (em paralelo)
                              Wedge Validation
                                    ↓
                            DECISÃO DA V2 (convergência)
                                    ↓
                     arquitetura técnica DEFINITIVA → implementação
```
> Benefício: ao conversar com uma operadora/hospital, já teremos **clareza do que a SINTERA pretende ser** — sem ter decidido **o que ela vai construir**. Isso evita **tanto a paralisia quanto a construção prematura**.

**O que este doc responde:** posição estratégica · o que é / o que não é · relações com o ecossistema · camadas conceituais · capacidades a preservar/reformular/adicionar/evitar · decisões de compatibilidade AGORA × decisões condicionadas ao wedge.
**O que NÃO responde (e não deve fingir responder):** quem paga (Trilha B) e qual wedge (Trilha B). **Prontidão arquitetural ≠ viabilidade de negócio.**

---

## 1. Posição estratégica

### 1.1 O que a SINTERA É (hipótese estratégica, não conclusão)
`[HIPÓTESE]` Uma **camada independente de contextualização e continuidade da informação sobre a trajetória do indivíduo**, construída **sobre** um ecossistema de dados interoperáveis — não dentro de uma instituição. Seu valor é **transversal ao indivíduo** e **independente do provedor/fonte**.

### 1.2 O que a SINTERA NÃO É (decisão de posicionamento — firme)
- **Não** é um prontuário/EHR (isso é de MV/Tasy/Epic/Oracle).
- **Não** é um integrador/HIE nem uma rede de interoperabilidade (isso é de InterSystems/OpenCare/RNDS).
- **Não** é "uma InterSystems brasileira mais simples" — replicar HealthShare/Unified Care Record seria **erro estratégico**: eles já fazem isso melhor e em escala.
- **Não** é uma plataforma universal de saúde interoperável ("vamos conectar tudo") — esse é exatamente o risco que o assessment nos ajudou a evitar.

### 1.3 Mapa de camadas (quem tende a dominar × espaço potencial da SINTERA)
| Camada | Quem tende a dominar |
|---|---|
| Prontuário hospitalar | MV · Tasy/Philips · Epic · Oracle |
| Integração/agregação | InterSystems · integradores · OpenCare |
| Interoperabilidade nacional | **RNDS** |
| Padrão | **FHIR / BR-Core** |
| Dados (origem) | hospitais · laboratórios · dispositivos |
| **Contexto transversal do indivíduo** | **espaço potencial SINTERA** |
| **Experiência independente do provedor** | **espaço potencial SINTERA** |
| **IA sobre a trajetória individual** | **espaço potencial SINTERA** |

`[INFERÊNCIA]` A defensabilidade **não** está na camada de integração (perde-se para os incumbentes) — está nas **três últimas linhas**, condicionadas a existir um **pagador** (Trilha B).

---

## 2. Relações com o ecossistema (consumir, não competir)

### 2.1 RNDS — infraestrutura pública nacional (consumir; não competir)
- `[FATO]` RNDS é a plataforma nacional de interoperabilidade do Ministério da Saúde, **baseada em FHIR**, com ambientes de homologação/produção, APIs FHIR, credenciamento vinculado a estabelecimento/CNES + certificado ICP-Brasil, e modelos como RAC e Resultado de Exames.
- `[FATO/INFERÊNCIA — confiança média]` A RNDS está em **consolidação/expansão** (federalização para estados/municípios) como infraestrutura pública. *(Referências específicas de 2026 a revalidar em fonte primária — egresso bloqueou acesso direto.)*
- **Risco:** quanto mais a RNDS evolui, **mais a função "unificar dados" vira utility pública** (parte do job básico já é servida de graça pelo Meu SUS Digital).
- **Oportunidade:** isso **libera** a SINTERA para atuar **acima** da infraestrutura — contexto/trajetória/experiência/IA.
- **Postura:** **RNDS como fonte, não concorrente.** Acesso B2B direto é restrito (Decreto 12.560/2025 limita finalidade) → o vetor viável é o **titular** (portabilidade/Meu SUS) até que haja base legal/parceira. **Consumir quando acessível; não depender.**

### 2.2 OpenCare — três posições possíveis (investigar a parceria)
`[FATO]` POC institucional (InovaHC/HCFMUSP + B3/PDtec), 2025→piloto 2026, fechada, sem onboarding público, **complementar à RNDS**.
- **A. Concorrente** — se subir de integração para *agregação + longitudinalidade + contexto + paciente + IA*.
- **B. Fornecedor/fonte** — se permanecer em *hospital → prontuário → interoperabilidade → dado*.
- **C. Parceiro/canal** — `[HIPÓTESE a investigar]` `Hospital → OpenCare/HIS/integrador → FHIR/API → SINTERA`, **reduzindo o custo de aquisição de dado** da SINTERA em vez de eliminá-la. A SINTERA **não precisa** conectar diretamente a todos os hospitais.
- **Postura:** **OpenCare-ready, não OpenCare-dependent.** Monitorar a evolução (posição A) e explorar a posição C.

### 2.3 FHIR / BR-Core — contrato arquitetural, não feature
- `[FATO]` BR-Core é o núcleo brasileiro de implementação FHIR R4; a RNDS troca em FHIR. É padrão consolidando-se.
- **Decisão AGORA (compatibilidade):** garantir que as decisões atuais **não criem dívida** que impeça FHIR/BR-Core depois — o **modelo canônico interno deve ser mapeável** a FHIR R4/BR-Core.
- **Decisão DEPOIS (wedge):** construir FHIR server / endpoints / integração RNDS. **Não** implementar FHIR inteiro agora.
- **Distinção-chave:** *FHIR compatibility = decisão arquitetural imediata; FHIR implementation/integration = posterior, condicionada ao wedge.*

### 2.4 InterSystems / HealthShare — benchmark, não modelo a copiar
`[FATO]` HealthShare já combina Unified Care Record + MPI + consentimento + FHIR + Personal Community (patient-facing) + analytics, **e tem presença no Brasil**. **Não construir uma versão simplificada disso.** A SINTERA precisa estar **acima** dessa camada (contexto/experiência/independência de fonte). A pergunta em aberto (do assessment) permanece: *o que a SINTERA faria que o HealthShare teria **desincentivo** — não incapacidade — de replicar?* → responder na decisão da V2.

### 2.5 HIS/EHR (MV, Tasy, Epic, Oracle) — consumir; cuidado no wedge hospital
`[INFERÊNCIA]` São donos do dado de origem e têm apps de paciente presos ao ecossistema. **Não competir.** No wedge Hospital, o **HIS incumbente é o substituto mais forte** (Trilha B testa isso de frente).

---

## 3. Camadas conceituais da plataforma (apenas arquitetura conceitual — não construir)

```
┌───────────────────────────────────────┐
│           EXPERIÊNCIA SINTERA         │  ← independente do provedor; patient-centric/controlled
├───────────────────────────────────────┤
│       CONTEXTO / TRAJETÓRIA           │  ← o "espaço SINTERA"; resultado, não feature
├───────────────────────────────────────┤
│       EVIDENCE / PROVENANCE           │  ← já é força da V1 (Sourced/Decision Log)
├───────────────────────────────────────┤
│       CANONICAL HEALTH MODEL          │  ← UCDA hoje; mapeável a FHIR/BR-Core
├───────────────────────────────────────┤
│       IDENTITY / PATIENT MATCHING     │  ← Clinical Identity hoje; preparar p/ multi-fonte
├───────────────────────────────────────┤
│       INTEROPERABILITY LAYER          │  ← adaptadores; consumir, não ser
├───────────────────────────────────────┤
│ RNDS │ OpenCare │ HIS │ Lab │ Wearable│  ← fontes (não construir)
└───────────────────────────────────────┘
```
> As camadas de baixo (interoperabilidade/fontes) são **consumidas**. O valor defensável, se existir, vive nas de cima — e depende do pagador (Trilha B).

---

## 4. Capacidades — preservar · reformular · adicionar (conceitual) · evitar

### 4.1 PRESERVAR (a V1 já tem e serve à tese)
- **Source-agnostic ingestion** (base de ingestão já existente).
- **DUE / compreensão de documento** com diagnóstico auditável.
- **Clinical Identity** (contratos congelados, Decision Log, ResolvedFact).
- **Proveniência por atributo** (`Sourced`/`SourceRef`) + **Pipeline Audit**.
- **Clinical Knowledge com fontes citadas** (C6) e **projeção ClinicalContext**.
- **UCDA (modelo canônico)**.
- **IA ancorada em evidência e NÃO-diagnóstica** (fronteira RDC-657) — **invariante de produto**.
- **Orientação patient-centric/patient-controlled** e **health_events** canônicos.

### 4.2 REFORMULAR (preparar, sem construir)
- **Modelo de identidade** → capaz de **anexar múltiplas identidades-de-fonte a um mesmo paciente** (envelope de identidade), mesmo que hoje a resolução seja de fonte única/manual. **MPI completo: não. Modelo pronto para multi-fonte: sim.**
- **Modelo de eventos** → tratar dados como **fatos datados de primeira classe, com esquema capaz de relações**, não como "lista de documentos". **Event Graph: não agora. Não ficar preso a lista: sim.**
- **Modelo canônico (UCDA)** → **mapeável a FHIR R4/BR-Core**. **FHIR server: não. Mapeabilidade: sim.**

### 4.3 ADICIONAR CONCEITUALMENTE (design intent — não implementar)
- **Contrato de mapeamento FHIR/BR-Core** (como o canônico se projeta em FHIR).
- **Contrato de adaptador de conector** (HIP-001 já esboçado) — RNDS/OpenCare/HIS/Lab/wearable como adaptadores para o canônico.
- **Camada de consentimento/compartilhamento/auditoria de acesso** como conceito de primeira classe.
- **Camada de contexto/trajetória** e **camada de evidência** (formalizar o que já existe embrionário).

### 4.4 EVITAR EXPLICITAMENTE (agora)
Construir: EHR/prontuário · rede de interoperabilidade nacional · **FHIR server completo** · **MPI completo** · **Event Graph** · **conectores sem caso de uso** · nova camada de IA · PHR "universal" · integração RNDS/OpenCare · qualquer item da lista competitiva "porque é tecnicamente interessante". **Nenhum destes sem wedge que o justifique.**

---

## 5. Decisões arquiteturais: AGORA (compatibilidade) × DEPOIS (wedge)

### 5.1 AGORA — decisões de compatibilidade/não-dívida (planejamento; nada de código)
Estas são **restrições de design** que evitam dívida, sem expandir escopo:
1. **Canônico mapeável a FHIR/BR-Core** — qualquer evolução do modelo interno deve ter um mapeamento plausível para recursos FHIR R4/BR-Core (Patient, Encounter, Observation, Condition, Procedure, DiagnosticReport, DocumentReference…). *Decisão de compatibilidade, não FHIR server.*
2. **Identidade preparada para multi-fonte** — o modelo deve permitir **N identidades-de-fonte → 1 indivíduo**, mesmo com resolução trivial hoje. *Não é MPI.*
3. **Eventos como fatos datados relacionáveis** — não modelar a saúde do indivíduo como "lista de documentos" fechada. *Não é Event Graph.*
4. **Proveniência e finalidade em todo fato** — já verdadeiro; manter como invariante.
5. **Consentimento/acesso como conceito de primeira classe** — mesmo mínimo, não deixá-lo como afterthought.
6. **Fronteira não-diagnóstica (RDC-657) como invariante** — nenhuma decisão de produto pode empurrar a plataforma para "apoio à decisão clínica" sem análise regulatória específica.

> **Como aplicar "agora" sem implementar:** estas decisões são **critérios de revisão** para qualquer mudança futura da V1/V2 — um checklist de "isto fecha alguma porta FHIR/multi-fonte/eventos/consentimento?". Não geram tarefa de construção.

### 5.2 DEPOIS — condicionadas ao wedge (não decidir agora)
FHIR server/endpoints · integração RNDS · integração/parceria OpenCare · conectores HIS/lab reais · **MPI** determinístico+probabilístico · **Event Graph** · **Evidence Engine** · nova camada de IA. **Cada um só entra com um caso de uso do wedge que o justifique** (ex.: *se* o wedge exigir 3 fontes independentes com o mesmo paciente → MPI ganha justificativa; *se* o valor depender de reconstruir episódios → Event Graph ganha prioridade; *se* exigir intercâmbio estruturado → FHIR sobe).

---

## 6. Prontidão × viabilidade (a pergunta que este doc NÃO fecha)

`[INFERÊNCIA]` Mesmo que esta arquitetura seja tecnicamente excelente, permanece a pergunta que só a Trilha B responde: **quem paga pela camada superior?** Por isso **não eliminamos o Wedge Validation** — apenas o **paralelizamos** com o trabalho estratégico/arquitetural. **Prontidão arquitetural comprovada ≠ negócio defensável comprovado.** A decisão da V2 exige as **duas** trilhas.

---

## 7. Convergência → decisão da V2

Quando as duas trilhas retornarem:
- **Trilha B (mercado)** entrega: wedge validado (A) / incerto (B) / rejeitado (C) + o comprador, o job econômico e as fontes de dado que aquele comprador realmente exige.
- **Trilha A (este doc + gap analysis conceitual)** entrega: o que preservar/reformular/adicionar e quais compatibilidades já garantimos.
- **A decisão da V2** cruza os dois: *"para ESTE comprador e ESTE job, com ESTAS fontes, o produto mínimo é X; as capacidades técnicas necessárias são Y; os gaps do código atual são Z."* → **só então** arquitetura técnica definitiva → implementação.

> **Frase-guia:** não vamos entrevistar o mercado para descobrir se a SINTERA **que já construímos** é vendável; vamos descobrir **qual posição da SINTERA dentro do novo ecossistema interoperável merece ser construída** — com a arquitetura já preparada para não criar dívida qualquer que seja a resposta.

---

## 8. O que NÃO fazer a partir deste documento
- Não implementar FHIR/BR-Core/MPI/Event Graph/Evidence Engine/conectores/nova IA.
- Não abrir integração RNDS/OpenCare/HIS.
- Não transformar nenhuma "capacidade a adicionar" em backlog antes da decisão da V2.
- Não expandir a V1 com itens do assessment competitivo.
- **A V1 só recebe correção de defeito até o congelamento.**

**Próximo entregável possível (documento, sem código):** *Gap Analysis conceitual* — comparar as decisões de compatibilidade da §5.1 com o estado atual do código (UCDA, Clinical Identity, proveniência, health_events) e apontar, **em nível de planejamento**, onde já estamos prontos e onde há risco de dívida — **sem implementar nada**. A fazer somente se/quando você aprovar.

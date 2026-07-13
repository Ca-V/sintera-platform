# SINTERA — Narrativa Estratégica (camada de refinamento)

> **Este documento REFINA e FORTALECE. Não substitui nada.**
> Fontes canônicas permanecem: **Constituição** (`SINTERA_ESTRATEGIA_MASTER.md`, v2.2 — tese,
> posicionamento, moat, unidade fundamental, monetização, princípios invioláveis) e **Branding**
> (`../branding/SINTERA_BRANDING.md`, v1.0 — propósito, missão, visão, valores, proposta de valor,
> voz). Este arquivo consolida, numa camada única, os **refinamentos conceituais que a própria
> implementação revelou** durante a evolução do Capture Hub / CEF / UCDA.
>
> **Método (Princípio da Evidência Arquitetural):** identidade e estratégia evoluem por
> **refinamento compatível, fundamentado pela implementação e pela evidência — nunca por recomeço.**
> Nenhum conceito abaixo altera o eixo, a missão, a visão ou a proposta de valor já aprovados.
> Todos entram como **camadas complementares** que tornam mais explícito o valor que a plataforma
> já buscava construir desde o início.
>
> **Origem:** revisão cruzada fundadora + pareceres (12–13/07/2026). **Change-control:** como a
> Constituição — evolui por evidência, não por nova ideia.

---

## Por que este documento existe

Durante a construção da inteligência (Capture Hub → CEF → UCDA → CRC → SRL → KG), alguns conceitos
que estavam **implícitos** na estratégia ficaram maduros o suficiente para serem **nomeados**. Nomeá-los
não muda o produto: muda a **precisão com que a SINTERA se descreve** para usuário, médico, hospital,
operadora, investidor e regulador. A tese ganha uma frase que qualquer um desses públicos entende — e
que resiste mesmo que a tecnologia dominante deixe de ser LLM.

**O que este documento NÃO faz:** não revisa missão/visão/proposta de valor (canônicas no Branding);
não altera a Constituição; não abre novo domínio arquitetural (respeita o freeze).

---

## Os quatro níveis da narrativa

A narrativa se separa em quatro níveis, do mais externo (por que existimos) ao mais interno (como a
tecnologia serve). Cada nível fala a um público e **aponta para sua fonte canônica**.

### 1. Missão — por que a empresa existe *(externa; canônico: Branding §3)*
> A SINTERA existe para construir a **história longitudinal — completa, confiável, interoperável e
> governada — da saúde de cada pessoa**, preservando a **continuidade do cuidado ao longo da vida**.

*Refinamento:* a **continuidade** não é só diferencial — é a razão de existir (já é a missão no
Branding). A palavra **longitudinal** torna explícito que o objeto é a **trajetória**, não o documento.

### 2. Proposta de valor — o que o usuário sente *(concreta; canônico: Branding §2 e §12)*
> **Todo o seu histórico de saúde, de todas as fontes, organizado, estruturado e num só lugar —
> preservando a evolução do seu cuidado ao longo do tempo.**

*Refinamento:* linguagem que qualquer pessoa entende. Coerente com o hero já congelado (09/07) e com o
termo de marca **"história de saúde"** (não "representação", que é linguagem de arquitetura).

### 3. Tese estratégica — o ativo econômico *(investidor; canônico: Constituição — tese/moat)*
> A SINTERA constrói um **patrimônio longitudinal de evidências clínicas estruturadas, governadas e
> interoperáveis**. Esse patrimônio **cresce continuamente pela evolução governada de conhecimento —
> nunca pela reutilização de dados identificáveis dos pacientes.**

*Por que esta frase é forte:* resolve **LGPD**, **efeito de rede**, **moat**, **governança** e o papel
da **IA** numa única formulação. O ativo **não é a IA** (que se comoditiza) nem o **documento** (que é
do paciente e é passivo, não ativo). O ativo é a **capacidade** de transformar qualquer documento em
conhecimento estruturado, longitudinal e governado — **capacidade que compõe conforme a plataforma cresce.**

### 4. Princípio tecnológico — o papel da IA *(interno; coerente com Branding §6 e a Visão Cognitiva)*
> A inteligência artificial é um **mecanismo** para ampliar a **captura, estruturação, contextualização
> e recuperação** do patrimônio de evidências. Ela **nunca substitui** a proveniência, a rastreabilidade,
> a validação científica ou o **julgamento clínico**.

*Refinamento:* esta frase deve permanecer verdadeira **mesmo que, em dez anos, a tecnologia dominante
deixe de ser LLM.** IA é meio; o produto é o patrimônio longitudinal governado.

---

## Refinamentos que a implementação revelou (camadas complementares)

### A. Longitudinalidade como ativo *(explicitação, não conceito novo)*
Na medicina, o significado quase nunca está no valor isolado — está na **trajetória**. Ferritina
`300 → 180 → 90 → 40`: o valor está na **curva**. O mesmo vale para pressão, peso, DEXA, Pentacam, EEG,
ECG, espirometria. A SINTERA não organiza apenas documentos — organiza a **evolução clínica ao longo do
tempo**. Isto **já era a missão (continuidade)**; agora é reconhecido também como **ativo estratégico e
econômico**: a trajetória multi-fonte, ao longo de anos, estruturada e governada, só existe onde há
continuidade — e é o que mais dificilmente se replica.

### B. Escada semântica *(precisão conceitual — protege o enquadramento regulatório)*
```
Documento → Dados estruturados → Evidências → Contexto longitudinal e científico → Suporte cognitivo
```
A escada descreve a **evolução da informação** — não altera o comportamento regulatório. Pontos fixos:
- **"Evidência" ≠ "conhecimento":** conhecimento pressupõe interpretação; evidência, não. A plataforma
  fala em **evidências estruturadas** e no **contexto** sobre elas.
- **A plataforma não para na evidência** — ela oferece **contexto longitudinal e científico** sobre as
  evidências. **O teto é o julgamento clínico**, que ela nunca substitui.
- O **"suporte cognitivo"** (camada futura) permanece **organizacional e contextual — nunca
  interpretativo/diagnóstico** (RDC 657/2022; ver `../VISION_SISTEMA_COGNITIVO_CLINICO.md`).

> Redação de referência: *"a SINTERA transforma documentos em evidências estruturadas e oferece contexto
> longitudinal e científico sobre essas evidências, preservando a distinção entre fatos observados,
> correlações identificadas, evidências científicas e julgamento clínico."*

### C. Governed Knowledge Evolution *(nomenclatura — efeito de rede compatível com privacidade)*
Evita-se a palavra **"Learning"** (remete a aprendizado autônomo de modelo opaco). O que evolui é o
**patrimônio de conhecimento**, de forma **governada, auditável e versionada** — o ciclo do CRC:
`caso novo → observação → corpus → nova versão do extrator → testes → validação → produção`.

Cada usuário melhora a plataforma, mas o reutilizado são **modelos, regras, extractors e conhecimento
validado — nunca informações identificáveis do indivíduo.** É um efeito de rede **poderoso e LGPD-safe**.
(Coerente com o "aprendizado governado" da Visão Cognitiva e com a Evidência Arquitetural.)

### D. Capacidade (externa) vs. componente (interna) *(linguagem)*
- **Internamente** seguimos nomeando: Capture Hub · CEF · UCDA · CRC · KG · SRL.
- **Externamente** comunicamos **capacidades**: *incorporar qualquer informação clínica · estruturar
  automaticamente · preservar continuidade · organizar longitudinalmente · recuperar contexto científico.*

O mercado não compra um "Capture Hub"; compra a **capacidade de ingerir qualquer evidência clínica de
qualquer origem**. Muda a comunicação, **não** a arquitetura.

### E. Leveza regulatória como pilar de moat *(inversão de perspectiva)*
A restrição regulatória (RDC 657: **estruturar, não interpretar**) é tratada como **vantagem
competitiva**, não custo. Empresas de "IA diagnóstica" enfrentam registro de dispositivo médico,
responsabilidade clínica e barreiras por jurisdição — e **não escalam** facilmente. A SINTERA, factual
por design, é **regulatoriamente leve** → escala entre clínicas, planos e países com fricção muito menor.
Poucos conseguem construir **efeito de rede em saúde sem virar dispositivo médico** — esse é um fosso
difícil de copiar. (Reforça a separação já exigida entre **fatos observados / correlações / evidências
científicas / hipóteses**.)

---

## Marca: uma nota sobre a palavra

- **"representação"** — correta e mantida na **arquitetura** (UCDA representa qualquer evidência).
- **"história de saúde"** — o termo de **marca** (já canônico no Branding §12b), agora com a dimensão
  **longitudinal / ao longo da vida** explícita. Linguagem humana: paciente, médico e investidor
  entendem de imediato. **"memória"** não é adotado — o padrão é **"história"**.
- O **patrimônio cognitivo/longitudinal** é linguagem **interna** (moat/tese) — **consequência**, não a
  promessa. A promessa externa é a **história longitudinal da saúde da pessoa**.

---

## Fonte única de verdade (o que está onde)

| Conteúdo | Documento canônico |
|---|---|
| Propósito · Missão · Visão · Valores · Proposta de valor · Voz · Termo de marca ("história de saúde") | **Branding** `../branding/SINTERA_BRANDING.md` |
| Tese · Posicionamento · Unidade fundamental · Moat · Monetização · Princípios invioláveis | **Constituição** `SINTERA_ESTRATEGIA_MASTER.md` |
| Narrativa em 4 níveis + refinamentos (este arquivo) | **Esta camada** — refina as duas acima, não as substitui |
| Visão de longo prazo (Sistema Cognitivo Clínico, aprendizado governado) | `../VISION_SISTEMA_COGNITIVO_CLINICO.md` |
| Representação técnica de qualquer evidência | `../UCDA-001_UNIVERSAL_CLINICAL_DATA_ARCHITECTURE.md` |

**Regra de coerência:** havendo qualquer divergência, prevalecem Constituição e Branding. Este documento
existe para **fortalecer a precisão conceitual**, jamais para abrir uma terceira fonte de verdade sobre
missão/visão/proposta.

---

## Change-control

Evolui **por evidência** (validação/refutação de hipótese, dado de usuário, mudança regulatória ou de
mercado) — nunca por nova ideia. Refinamentos que afetem missão/visão/proposta pertencem ao **Branding**;
os que afetem tese/moat/posicionamento pertencem à **Constituição**. Este arquivo apenas os **integra**.

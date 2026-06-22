# SINTERA — Implementation Roadmap

**Roadmap de implementação orientado por marcos (não datas).** Define as fases de agora até
a fase final, com objetivo, entregáveis, dono e **critério de passagem (gate)** de cada uma.
**Versão:** v2 · **Data:** 2026-06-16

> **Fonte de verdade única.** Esta v2 reconcilia e **substitui** os documentos divergentes
> "Full Implementation Blueprint" e "Investor Roadmap & Value Creation Plan" (que tinham
> numeração inconsistente). Incorpora deles o que era bom — **Design Partners (F1.5)** e a
> **visão de value-creation** (§ ao final) — sobre a base disciplinada (gates, dependência
> de dados, critérios de revisão).

> **Princípio de sequência (não-negociável):** nenhuma fase de conteúdo clínico ou de motor
> avança antes da governança estar validada. O risco que governa a ordem é **governança**,
> não tecnologia. Gates são condições de saída — não se pula fase.

---

## Visão geral das fases

```
F0 Fundação (✅ concluída)
   ↓  gate: documentação + plataforma demo prontas
F1 Validação externa (mercado + jurídico + RC)
   ↓  gate: tese validada + decisões de governança tomadas
F1.5 Design Partners (converter interessados em parceiros de validação)
   ↓  gate: 1–3 parceiros ativos fornecendo dado/feedback
F2 Fundação de governança clínica formal
   ↓  gate: RC/Comitê ativos + precedência + personalização definidas
F3 Life Course Governance Engine (motor vazio, governado)
   ↓  gate: engine em produção rodando vazio + auditável
F4 Onda 1 — prevenção universal (conteúdo ativado)
   ↓  gate: compliance/timeline reais para a Onda 1
F5 Ondas 2–3 + integrações de dados
   ↓  gate: cobertura por valor de mercado + dados confiáveis
F6 Escala (operadoras, ocupacional, marketplace de protocolos)
```

---

## F0 — Fundação ✅ (concluída)

- **Objetivo:** base técnica segura + tese estratégica/governança documentadas.
- **Entregáveis:** extração + catálogo 83 biomarcadores; motor vazio seguro; governança
  científica (proveniência, LOINC/SNOMED, fluxo de status, ondas, escala); demo factual;
  documentos Master Strategy, Value Proposition v1.1, Governança Operacional v2, Checklist,
  One-Pager; pacote clínico Onda 1 (guia RC, rascunho LOINC, ledger, Termo).
- **Dono:** Engenharia.
- **Gate de saída:** ✅ documentação completa + plataforma demonstrável.

## F1 — Validação externa

- **Objetivo:** descobrir se o mercado paga e se o enquadramento se sustenta. *Maior
  retorno atual.*
- **Entregáveis:**
  - Entrevistas: 5–10 RHs/gestores de saúde ocupacional, operadoras, usuárias potenciais.
  - Parecer jurídico/regulatório (RDC 657, nível do "pendente", cadeia de responsabilidade).
  - Engajamento do futuro Responsável Clínico.
  - **Decisão das 14 questões** do `GOVERNANCE-DECISIONS-CHECKLIST`.
- **Dono:** Fundadora (+ jurídico, + RC).
- **Gate de saída:** evidência de disposição a pagar (≥ 1 segmento) **e** decisões 3, 4, 5,
  6, 8 do checklist assinadas **e** verificação dos **critérios de revisão da tese**
  (Master Strategy §12.2) — registrar decisão seguir/revisar/pivotar.

## F1.5 — Design Partners

- **Objetivo:** converter os interessados das entrevistas (F1) em **parceiros ativos de
  validação** — early adopters que fornecem dado real, feedback e co-desenvolvimento antes
  do produto completo. Reduz risco de mercado e já inicia a aquisição de dados.
- **Entregáveis:** 1–3 design partners (preferencialmente B2B ocupacional); acordo de
  piloto; fluxo inicial de dados (upload/ocupacional) com proveniência.
- **Dono:** Fundadora (+ Negócio).
- **Gate de saída:** ao menos 1 parceiro ativo fornecendo dado/feedback recorrente.

## F2 — Fundação de governança clínica formal

- **Objetivo:** instalar quem governa o conteúdo.
- **Entregáveis:** contratar/identificar RC (CRM); instanciar Comitê Clínico (faseado);
  ratificar Aprovações 1–2; definir **política de precedência** entre fontes; ratificar as
  **dimensões de personalização**; cadência de revisão.
- **Dono:** RC / Comitê Clínico.
- **Gate de saída:** RC formalizado + precedência e personalização aprovadas + Aprovações
  1–2 ratificadas.

## F3 — Life Course Governance Engine (motor vazio, governado)

- **Objetivo:** construir a infraestrutura do motor — **sem conteúdo clínico**.
- **Entregáveis (engenharia, estrutura vazia):** `protocol_sources`; `protocol_items` (com
  aplicabilidade, proveniência, status, evidência); `resolution_policies` (precedência);
  `provenance`/Provenance Viewer; **Compliance Engine** (aritmético, com proveniência por
  dado); **Health Timeline**. Inclui já: política de precedência e agregação de compliance.
- **Dono:** Engenharia.
- **Gate de saída:** engine em produção **rodando vazio**, auditável; demo factual evolui
  para o motor real (ainda sem conteúdo aprovado).

## F4 — Onda 1: prevenção universal (conteúdo ativado)

- **Objetivo:** primeiro conteúdo clínico real, de baixo risco e alto valor universal.
- **Entregáveis:** curadoria das fontes **Nível 1** (MS, INCA, PNI); aprovação item a item
  pelo RC/Comitê; ativação; compliance/timeline reais; Provenance Viewer populado.
- **Dono:** RC/Comitê (conteúdo) + Engenharia (ativação).
- **Gate de saída:** Onda 1 ativa, com HCR mensurável em coorte real.

## F5 — Ondas 2–3 + integrações de dados

- **Objetivo:** expandir por valor de mercado e melhorar a qualidade do dado.
- **Entregáveis:** Onda 2 (saúde da mulher — FEBRASGO/INCA); Onda 3 (cardiometabólico —
  SBC/SBD/SBEM); integrações (RNDS/Conecte SUS, labs, clínicas ocupacionais) com
  proveniência; aquisição de dados via canal ocupacional.
- **Dono:** RC/Comitê + Engenharia + Parcerias.
- **Gate de saída:** cobertura crescente justificada por valor + dado confiável alimentando
  o HCR.

## F6 — Escala

- **Objetivo:** crescimento comercial e amplitude científica.
- **Entregáveis:** B2B2C com operadoras; produto de saúde ocupacional (NR-1);
  **Marketplace de Protocolos** (Adulto geral, Saúde da Mulher, Hipertensão, Diabetes…,
  todos aprovados pelo RC/Comitê); demais especialidades AMB; observabilidade de extração
  por laboratório.
- **Dono:** Negócio + RC/Comitê + Engenharia.
- **Gate de saída:** operação multi-protocolo, multi-cliente, auditável e sustentável.

---

## Métricas por fase

| Fase | Métrica-chave |
|---|---|
| F1 | Nº de entrevistas + sinais de disposição a pagar; decisões fechadas |
| F1.5 | Nº de design partners ativos + 1º dado real fluindo |
| F2 | Governança instalada (RC/Comitê/precedência) |
| F3 | Engine em produção (vazio) + cobertura de auditoria |
| F4 | **HCR** começa a ser medido (coorte Onda 1) |
| F5 | HCR + cobertura preventiva da população (B2B) + qualidade do dado |
| F6 | Retenção/expansão B2B2C + nº de protocolos ativos |

## Dependências críticas (não burlar)

1. **Conteúdo clínico** depende de **RC + governança validada** (F2 antes de F4).
2. **Compliance/Timeline** dependem de **aquisição de dados** — que começa **cedo** (upload
   + canal ocupacional em F1.5), não só nas integrações pesadas (F5).
3. **"Pendente" na UI** depende de **parecer jurídico** (F1).
4. **Expansão de ondas** é governada por **valor de mercado**, não por completude (F5+).
5. **Lembrete por WhatsApp (para usuárias reais)** depende de **formalização da empresa
   (CNPJ) → verificação do negócio na Meta → número remetente próprio**. O código está
   pronto e validado; o canal só vai ao ar quando a Sintera for empresa formalizada. Até lá,
   **o lembrete por e-mail cobre a função** (não bloqueia nada).

## Visão de investidor (value-creation)

Mesma jornada, lida por marcos de **criação de valor** (deriva das fases acima; expande F5/F6
nos marcos comerciais que importam ao investidor):

| Marco de valor | Fase(s) | O que destrava |
|---|---|---|
| Tese validada + primeiros parceiros | F1–F1.5 | Risco de mercado cai; dado começa a fluir |
| Governança instalada (ativo defensável) | F2 | Moat regulatório/científico |
| Motor em produção (infraestrutura pronta) | F3 | Escalabilidade técnica comprovada |
| 1º conteúdo vivo + HCR mensurável | F4 | Prova de valor (continuidade real) |
| Saúde da Mulher (alinha à identidade) | F5 | Expansão com foco de marca |
| Cardiometabólico + integrações | F5 | Profundidade + dado confiável |
| Produto corporativo (dashboards populacionais) | F6 | Receita recorrente B2B |
| Operadoras (B2B2C) | F6 | Escala |
| Marketplace de protocolos | F6 | Efeito de ecossistema |
| *Visão 2035: infraestrutura de continuidade da saúde* | — | Categoria |

**Métricas de valor:** HCR · retenção · cobertura preventiva da população · eventos
rastreados · receita recorrente. (Health OS / "infraestrutura nacional" é **visão**, não
fase — não tem entregável próprio.)

## Frentes externas (paralelas, não bloqueiam o motor)

- FASE Wearables (Oura/Strava/Garmin) — depende de hardware/conta; alimenta dados futuros.
- Observabilidade de extração por laboratório — robustez operacional conforme o volume cresce.
- **Lembrete por WhatsApp** — código pronto (worker + template + fallback de idioma + admin
  de templates pelo backend). **Bloqueado para usuárias reais** até: CNPJ → verificação do
  negócio na Meta → número remetente próprio. Detalhes operacionais em `docs/WHATSAPP-SETUP.md`.

---

*Relacionado: SINTERA-MASTER-STRATEGY-GOVERNANCE · MODELO-GOVERNANCA-OPERACIONAL v2 ·
GOVERNANCE-DECISIONS-CHECKLIST · VALUE-PROPOSITION-NORTH-STAR v1.1.*

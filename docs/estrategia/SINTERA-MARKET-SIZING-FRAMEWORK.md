# SINTERA — Framework de Market-Sizing (TAM/SAM/SOM)

**Propósito:** estrutura para preencher o TAM/SAM/SOM do Investment Memo v3 **com dados
reais e fontes citadas** — sem números inventados. Os campos `[ = ]` são para você
preencher a partir das fontes indicadas.
**Data:** 2026-06-16

> **Regra de honestidade:** todo número entra **com fonte e ano**. Preferir **bottom-up**
> (unidades × preço) a top-down ("1% de um mercado gigante" — falácia que investidor
> desconta). Nenhum valor aqui foi estimado por IA.

---

## Definições

- **TAM** (Total Addressable Market): demanda total se 100% do segmento usasse a SINTERA.
- **SAM** (Serviceable Addressable Market): parcela do TAM que a SINTERA consegue atender
  (porte/região/canal/produto).
- **SOM** (Serviceable Obtainable Market): meta realista de captura em 1–3 anos.

**Método bottom-up padrão:** `Mercado = nº de unidades addressáveis × preço médio anual por
unidade (ARPU)`.

---

## Segmento 1 — B2B Saúde Ocupacional *(porta de entrada)*

**Unidade addressável:** trabalhadores formais / empresas com empregados (NR-1 e PCMSO são
obrigatórios → demanda estrutural).

| Variável | Valor | Fonte (preencher/confirmar) |
|---|---|---|
| Nº de trabalhadores formais (Brasil) | `[ = ]` | RAIS/CAGED (Min. Trabalho), eSocial, IBGE |
| Nº de empresas com empregados | `[ = ]` | RAIS, Mapa de Empresas (gov.br) |
| ARPU/ano por trabalhador (preço SINTERA) | `[ = ]` | Sua precificação |
| **TAM** = trabalhadores × ARPU | `[ = ]` | — |
| **SAM** = subset alcançável (porte/setor/região) | `[ = ]` | Definir critério de corte |
| **SOM** = meta 1–3 anos | `[ = ]` | Pipeline/capacidade comercial |

> Gatilho de demanda: atualização da **NR-1 (riscos psicossociais)** e PCMSO — reforça a
> compra institucional. Citar a norma e o ano.

## Segmento 2 — B2B2C Operadoras

**Unidade addressável:** beneficiários de planos de saúde / operadoras.

| Variável | Valor | Fonte |
|---|---|---|
| Nº de beneficiários de planos (Brasil) | `[ = ]` | **ANS** (dados abertos), IESS, Abramge |
| Nº de operadoras | `[ = ]` | ANS |
| ARPU/ano por beneficiário (preço SINTERA) | `[ = ]` | Sua precificação |
| **TAM** = beneficiários × ARPU | `[ = ]` | — |
| **SAM** = operadoras abertas a prevenção digital | `[ = ]` | Segmentação |
| **SOM** = meta 1–3 anos | `[ = ]` | Pipeline |

## Segmento 3 — Saúde da Mulher (B2C / co-marca)

**Unidade addressável:** mulheres adultas com acesso digital e renda-alvo.

| Variável | Valor | Fonte |
|---|---|---|
| Nº de mulheres adultas (Brasil, faixas-alvo) | `[ = ]` | **IBGE** (Censo, PNAD Contínua) |
| % com acesso digital + renda-alvo | `[ = ]` | PNAD TIC, segmentação de renda |
| ARPU/ano (assinatura B2C) | `[ = ]` | Sua precificação |
| **TAM / SAM / SOM** | `[ = ]` | — |

## Consolidado Brasil

- Somar os segmentos **sem dupla contagem** (um trabalhador formal também é beneficiária e
  mulher — evitar somar a mesma pessoa em ARPUs sobrepostos; consolidar por **canal de
  receita**, não por população).
- Apresentar TAM/SAM/SOM por segmento **e** o consolidado, com nota metodológica.

---

## Fontes oficiais recomendadas (Brasil)

- **IBGE** — população, PNAD Contínua, PNAD TIC.
- **ANS** — beneficiários e operadoras (dados abertos).
- **RAIS/CAGED / eSocial** (Min. Trabalho) — emprego formal.
- **IESS / Abramge** — saúde suplementar.
- **Mapa de Empresas (gov.br)** — empresas ativas.
- Relatórios de digital health (benchmark, não fonte primária).

## Boas práticas para o memo

1. Todo número **datado e com fonte** (rodapé).
2. **Bottom-up** como base; top-down só como sanity-check.
3. Mostrar **premissas de ARPU** explicitamente (investidor testa isso).
4. SOM **conservador e defensável** > TAM inflado.
5. Marcar o que é **estimativa** vs **dado oficial**.

> Quando você preencher os campos `[ = ]` (ou me passar os dados/fontes), eu insiro no
> Investment Memo v3 e ele deixa de ser *Vision Memo* e vira *Investment Memo* completo.

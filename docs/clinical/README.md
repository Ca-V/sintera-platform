# Regras Clínicas do Motor de Insights — guia de preenchimento

Este diretório contém a **estrutura da decisão clínica** que destrava o motor
determinístico (`src/lib/ai/insights/engine.ts`). O arquivo
[`regras-clinicas-template.csv`](./regras-clinicas-template.csv) lista os 83
biomarcadores do catálogo com as colunas **exatas** que o motor consome, para
um responsável clínico preencher.

> ⚠️ **Decisão clínica humana.** Nenhum limiar ou classificação foi preenchido
> por IA. Cada `clinical_flag` precisa de respaldo clínico e assinatura
> (`approved_by`). Enquanto não houver regras aprovadas, o motor não emite
> nenhum insight (comportamento seguro e intencional).

## Como a planilha está organizada

- **151 linhas de regra** (os 6 biomarcadores `is_critical` aparecem primeiro).
- Cada biomarcador **numérico** já vem com 2 linhas: uma para valor **abaixo**
  (`below`) e outra para **acima** (`above`) da faixa impressa no laudo.
- Cada biomarcador **qualitativo** vem com 1 linha (`always`) e um aviso: o
  motor v1 só avalia resultados numéricos; o tratamento de resultados textuais
  (ex.: "Reagente", "Positivo") ainda precisa ser definido.

## Colunas

| Coluna | Origem | Preencher? | Valores |
|---|---|---|---|
| `catalog_code` | motor (`InsightRule.catalogCode`) | **não alterar** | code do catálogo |
| `display_name`, `category`, `specimen`, `canonical_unit`, `measure_kind`, `is_critical` | referência | não | — |
| `condition_kind` | motor (`when.kind`) | ajustar se quiser | `rangeStatus` \| `numericThreshold` \| `always` |
| `condition_params` | motor (`when`) | ajustar se quiser | p/ `rangeStatus`: `below`/`above`/`within`/`no_reference` · p/ `numericThreshold`: `>=126`, `<3.5` etc. |
| `clinical_flag` | motor (`clinicalFlag`) | **sim** | `atencao_imediata` \| `acompanhar` \| `normal` |
| `template_key` | motor (`templateKey`) | **sim** | ex.: `hemoglobina_baixa_v1` |
| `insight_type` | motor (`insightType`) | sim (padrão `biomarker`) | `biomarker` \| `cluster` \| `longitudinal` \| `priority` |
| `priority` | motor (`priority`) | **sim** | `low` \| `medium` \| `high` |
| `clinical_rationale` | governança | **sim** | justificativa clínica |
| `approved_by`, `approved_at` | governança | **sim** | responsável + data |
| `notes` | livre | opcional | observações |

## Como preencher (passo a passo)

1. Comece pelos **6 críticos** (topo do arquivo): Cálcio iônico, Creatinina,
   Potássio, Sódio, Hemoglobina, Glicose.
2. Para cada linha, decida o `clinical_flag` e escreva uma `clinical_rationale`.
3. Se preferir um **limiar absoluto** em vez de "abaixo/acima da faixa do laudo",
   troque `condition_kind` para `numericThreshold` e ponha o operador+valor em
   `condition_params` (ex.: `>=126`).
4. Defina um `template_key` consistente (ele liga a regra ao texto narrativo
   futuro). Sugestão de padrão: `<code_minusculo>_<situacao>_v1`.
5. Linhas que **não** devem gerar insight: deixe `clinical_flag` em branco — elas
   serão ignoradas na conversão.
6. Preencha `approved_by` e `approved_at` ao validar.

## Da planilha para o código

Quando a planilha estiver preenchida e aprovada, as linhas com `clinical_flag`
viram entradas em `src/lib/ai/insights/rules.clinical.ts` (`CLINICAL_RULESET`).
Cada linha CSV mapeia para um `InsightRule`:

```
catalog_code      -> catalogCode
condition_kind +  -> when  (ex.: { kind: 'rangeStatus', status: ['below'] }
condition_params               ou { kind: 'numericThreshold', op: '>=', value: 126 })
clinical_flag     -> clinicalFlag
template_key      -> templateKey
insight_type      -> insightType
priority          -> priority
```

A conversão pode ser feita à mão (poucas dezenas de regras) ou por um pequeno
script. O importante para a governança é que o **CSV preenchido e assinado**
fique versionado junto, como registro da decisão clínica que originou o ruleset.

## Limitação conhecida (motor v1)

Biomarcadores **qualitativos** (resultado textual, não numérico) não são
avaliados pelo motor v1 — a coluna `value` é nula e só existe `value_text`.
Tratá-los exige estender a engine com uma condição sobre `value_text`. Isso está
sinalizado nas linhas correspondentes e deve ser decidido junto com a clínica.

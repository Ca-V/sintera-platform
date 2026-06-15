# Regras Clínicas para Revisão e Assinatura — Companion do `regras-clinicas-template.csv`

> **Propósito.** Este documento é uma **versão legível** do
> `docs/clinical/regras-clinicas-template.csv`, organizada por categoria,
> biomarcador e criticidade, para facilitar a revisão e a assinatura do
> **Responsável Clínico (RC)**.
>
> ⚠️ **Nada aqui foi preenchido por IA.** As colunas `clinical_flag`,
> `template_key`, `priority` e `justificativa_clínica` estão **em branco de
> propósito** — são decisão clínica humana. O `condition` (abaixo/acima/sempre)
> e a unidade vêm do laudo/cálculo aritmético, não de juízo clínico.
>
> **Fonte de verdade continua sendo o CSV.** Este `.md` é apoio de revisão; os
> valores aprovados aqui devem ser transcritos de volta para o CSV (que é o que
> o motor lê) com `approved_by`/`approved_at` preenchidos.

## Como preencher

Para cada linha, o RC define:

- **`clinical_flag`** — um de: `atencao_imediata` · `acompanhar` · `normal`.
- **`template_key`** — chave do texto educativo (ex.: `hemoglobina_baixa_v1`).
- **`priority`** — `low` · `medium` · `high`.
- **`justificativa_clínica`** — racional + referência, quando aplicável.

Legenda de **Condição**:
- **abaixo / acima** = valor fora do intervalo **impresso no laudo** (aritmético).
- **sempre** = biomarcador qualitativo; o **motor v1 avalia apenas numéricos** —
  o tratamento de resultados textuais (ex.: "Reagente", "Positivo") ainda
  precisa ser definido pela clínica.

🔴 = biomarcador marcado **crítico** no catálogo (`is_critical = true`) —
**lote prioritário** para as primeiras regras.

---

## Índice de criticidade (lote prioritário — 6 biomarcadores)

Definir estes primeiro (constam abaixo, em suas categorias, marcados 🔴):

| Biomarcador | Código | Categoria |
|---|---|---|
| Cálcio iônico | `CALCIO_IONICO` | funcao_renal_eletrolitos |
| Creatinina | `CREATININA_SERICA` | funcao_renal_eletrolitos |
| Potássio | `POTASSIO` | funcao_renal_eletrolitos |
| Sódio | `SODIO` | funcao_renal_eletrolitos |
| Hemoglobina | `HEMOGLOBINA_SANGUE` | hematologia_vermelha |
| Glicose (jejum) | `GLICEMIA` | metabolismo_glicose |

---

## funcao_renal_eletrolitos

| Biomarcador | Código | Condição | Unid. | clinical_flag | template_key | priority | justificativa_clínica |
|---|---|---|---|---|---|---|---|
| 🔴 Cálcio iônico | `CALCIO_IONICO` | abaixo | mmol/L |  |  |  |  |
| 🔴 Cálcio iônico | `CALCIO_IONICO` | acima | mmol/L |  |  |  |  |
| 🔴 Creatinina | `CREATININA_SERICA` | abaixo | mg/dL |  |  |  |  |
| 🔴 Creatinina | `CREATININA_SERICA` | acima | mg/dL |  |  |  |  |
| 🔴 Potássio | `POTASSIO` | abaixo | mEq/L |  |  |  |  |
| 🔴 Potássio | `POTASSIO` | acima | mEq/L |  |  |  |  |
| 🔴 Sódio | `SODIO` | abaixo | mEq/L |  |  |  |  |
| 🔴 Sódio | `SODIO` | acima | mEq/L |  |  |  |  |
| Cloretos | `CLORETOS` | abaixo | mEq/L |  |  |  |  |
| Cloretos | `CLORETOS` | acima | mEq/L |  |  |  |  |
| Fósforo | `FOSFORO` | abaixo | mg/dL |  |  |  |  |
| Fósforo | `FOSFORO` | acima | mg/dL |  |  |  |  |
| Magnésio | `MAGNESIO` | abaixo | mg/dL |  |  |  |  |
| Magnésio | `MAGNESIO` | acima | mg/dL |  |  |  |  |
| Ritmo de filtração glomerular | `RFG` | abaixo | mL/min/1,73m2 |  |  |  |  |
| Ritmo de filtração glomerular | `RFG` | acima | mL/min/1,73m2 |  |  |  |  |
| Ureia | `UREIA` | abaixo | mg/dL |  |  |  |  |
| Ureia | `UREIA` | acima | mg/dL |  |  |  |  |

## hematologia_vermelha

| Biomarcador | Código | Condição | Unid. | clinical_flag | template_key | priority | justificativa_clínica |
|---|---|---|---|---|---|---|---|
| 🔴 Hemoglobina | `HEMOGLOBINA_SANGUE` | abaixo | g/dL |  |  |  |  |
| 🔴 Hemoglobina | `HEMOGLOBINA_SANGUE` | acima | g/dL |  |  |  |  |
| CHCM | `CHCM` | abaixo | g/dL |  |  |  |  |
| CHCM | `CHCM` | acima | g/dL |  |  |  |  |
| HCM | `HCM` | abaixo | pg |  |  |  |  |
| HCM | `HCM` | acima | pg |  |  |  |  |
| Hemácias | `HEMACIAS_SANGUE` | abaixo | /mm3 |  |  |  |  |
| Hemácias | `HEMACIAS_SANGUE` | acima | /mm3 |  |  |  |  |
| Hematócrito | `HEMATOCRITO` | abaixo | % |  |  |  |  |
| Hematócrito | `HEMATOCRITO` | acima | % |  |  |  |  |
| RDW | `RDW` | abaixo | % |  |  |  |  |
| RDW | `RDW` | acima | % |  |  |  |  |
| VCM | `VCM` | abaixo | fL |  |  |  |  |
| VCM | `VCM` | acima | fL |  |  |  |  |

## metabolismo_glicose

| Biomarcador | Código | Condição | Unid. | clinical_flag | template_key | priority | justificativa_clínica |
|---|---|---|---|---|---|---|---|
| 🔴 Glicose (jejum) | `GLICEMIA` | abaixo | mg/dL |  |  |  |  |
| 🔴 Glicose (jejum) | `GLICEMIA` | acima | mg/dL |  |  |  |  |
| Hemoglobina glicada (HbA1c) | `HBA1C` | abaixo | % |  |  |  |  |
| Hemoglobina glicada (HbA1c) | `HBA1C` | acima | % |  |  |  |  |
| Insulina | `INSULINA` | abaixo | uUI/mL |  |  |  |  |
| Insulina | `INSULINA` | acima | uUI/mL |  |  |  |  |

## cardiometabolico

| Biomarcador | Código | Condição | Unid. | clinical_flag | template_key | priority | justificativa_clínica |
|---|---|---|---|---|---|---|---|
| Apolipoproteína A1 | `APO_A1` | abaixo | mg/dL |  |  |  |  |
| Apolipoproteína A1 | `APO_A1` | acima | mg/dL |  |  |  |  |
| HDL colesterol | `HDL` | abaixo | mg/dL |  |  |  |  |
| HDL colesterol | `HDL` | acima | mg/dL |  |  |  |  |
| Triglicerídeos | `TRIGLICERIDEOS` | abaixo | mg/dL |  |  |  |  |
| Triglicerídeos | `TRIGLICERIDEOS` | acima | mg/dL |  |  |  |  |

## coagulacao

| Biomarcador | Código | Condição | Unid. | clinical_flag | template_key | priority | justificativa_clínica |
|---|---|---|---|---|---|---|---|
| Atividade de protrombina | `ATIVIDADE_PROTROMBINA` | abaixo | % |  |  |  |  |
| Atividade de protrombina | `ATIVIDADE_PROTROMBINA` | acima | % |  |  |  |  |
| RNI (INR) | `RNI` | abaixo | — |  |  |  |  |
| RNI (INR) | `RNI` | acima | — |  |  |  |  |
| Tempo de protrombina | `TP_SEGUNDOS` | abaixo | segundos |  |  |  |  |
| Tempo de protrombina | `TP_SEGUNDOS` | acima | segundos |  |  |  |  |
| TTPA | `TTPA` | abaixo | segundos |  |  |  |  |
| TTPA | `TTPA` | acima | segundos |  |  |  |  |

## funcao_hepatica_proteinas

| Biomarcador | Código | Condição | Unid. | clinical_flag | template_key | priority | justificativa_clínica |
|---|---|---|---|---|---|---|---|
| Albumina | `ALBUMINA` | abaixo | g/dL |  |  |  |  |
| Albumina | `ALBUMINA` | acima | g/dL |  |  |  |  |
| Globulinas | `GLOBULINAS` | abaixo | g/dL |  |  |  |  |
| Globulinas | `GLOBULINAS` | acima | g/dL |  |  |  |  |
| Proteínas totais | `PROTEINAS_TOTAIS` | abaixo | g/dL |  |  |  |  |
| Proteínas totais | `PROTEINAS_TOTAIS` | acima | g/dL |  |  |  |  |
| Relação A/G | `RELACAO_AG` | abaixo | — |  |  |  |  |
| Relação A/G | `RELACAO_AG` | acima | — |  |  |  |  |

## funcao_tireoidiana

| Biomarcador | Código | Condição | Unid. | clinical_flag | template_key | priority | justificativa_clínica |
|---|---|---|---|---|---|---|---|
| T4 livre | `T4_LIVRE` | abaixo | ng/dL |  |  |  |  |
| T4 livre | `T4_LIVRE` | acima | ng/dL |  |  |  |  |
| TSH | `TSH` | abaixo | mUI/L |  |  |  |  |
| TSH | `TSH` | acima | mUI/L |  |  |  |  |

## hematologia_branca_plaquetas

| Biomarcador | Código | Condição | Unid. | clinical_flag | template_key | priority | justificativa_clínica |
|---|---|---|---|---|---|---|---|
| Basófilos | `BASOFILOS_ABS` | abaixo | /mm3 |  |  |  |  |
| Basófilos | `BASOFILOS_ABS` | acima | /mm3 |  |  |  |  |
| Basófilos (%) | `BASOFILOS_PCT` | abaixo | % |  |  |  |  |
| Basófilos (%) | `BASOFILOS_PCT` | acima | % |  |  |  |  |
| Eosinófilos | `EOSINOFILOS_ABS` | abaixo | /mm3 |  |  |  |  |
| Eosinófilos | `EOSINOFILOS_ABS` | acima | /mm3 |  |  |  |  |
| Eosinófilos (%) | `EOSINOFILOS_PCT` | abaixo | % |  |  |  |  |
| Eosinófilos (%) | `EOSINOFILOS_PCT` | acima | % |  |  |  |  |
| Leucócitos totais | `LEUCOCITOS_TOTAIS` | abaixo | /mm3 |  |  |  |  |
| Leucócitos totais | `LEUCOCITOS_TOTAIS` | acima | /mm3 |  |  |  |  |
| Linfócitos | `LINFOCITOS_ABS` | abaixo | /mm3 |  |  |  |  |
| Linfócitos | `LINFOCITOS_ABS` | acima | /mm3 |  |  |  |  |
| Linfócitos (%) | `LINFOCITOS_PCT` | abaixo | % |  |  |  |  |
| Linfócitos (%) | `LINFOCITOS_PCT` | acima | % |  |  |  |  |
| Monócitos | `MONOCITOS_ABS` | abaixo | /mm3 |  |  |  |  |
| Monócitos | `MONOCITOS_ABS` | acima | /mm3 |  |  |  |  |
| Monócitos (%) | `MONOCITOS_PCT` | abaixo | % |  |  |  |  |
| Monócitos (%) | `MONOCITOS_PCT` | acima | % |  |  |  |  |
| Neutrófilos bastonetes | `NEUTROFILOS_BAST_ABS` | abaixo | /mm3 |  |  |  |  |
| Neutrófilos bastonetes | `NEUTROFILOS_BAST_ABS` | acima | /mm3 |  |  |  |  |
| Neutrófilos bastonetes (%) | `NEUTROFILOS_BAST_PCT` | abaixo | % |  |  |  |  |
| Neutrófilos bastonetes (%) | `NEUTROFILOS_BAST_PCT` | acima | % |  |  |  |  |
| Neutrófilos segmentados | `NEUTROFILOS_SEG_ABS` | abaixo | /mm3 |  |  |  |  |
| Neutrófilos segmentados | `NEUTROFILOS_SEG_ABS` | acima | /mm3 |  |  |  |  |
| Neutrófilos segmentados (%) | `NEUTROFILOS_SEG_PCT` | abaixo | % |  |  |  |  |
| Neutrófilos segmentados (%) | `NEUTROFILOS_SEG_PCT` | acima | % |  |  |  |  |
| Plaquetas | `PLAQUETAS` | abaixo | /mm3 |  |  |  |  |
| Plaquetas | `PLAQUETAS` | acima | /mm3 |  |  |  |  |

## hormonios_sexuais_reprodutivo

| Biomarcador | Código | Condição | Unid. | clinical_flag | template_key | priority | justificativa_clínica |
|---|---|---|---|---|---|---|---|
| Beta-HCG | `BHCG` | abaixo | mUI/mL |  |  |  |  |
| Beta-HCG | `BHCG` | acima | mUI/mL |  |  |  |  |
| Estradiol | `ESTRADIOL` | abaixo | pg/mL |  |  |  |  |
| Estradiol | `ESTRADIOL` | acima | pg/mL |  |  |  |  |
| FSH | `FSH` | abaixo | mUI/mL |  |  |  |  |
| FSH | `FSH` | acima | mUI/mL |  |  |  |  |
| LH | `LH` | abaixo | mUI/mL |  |  |  |  |
| LH | `LH` | acima | mUI/mL |  |  |  |  |
| Paratormônio (PTH) | `PTH` | abaixo | pg/mL |  |  |  |  |
| Paratormônio (PTH) | `PTH` | acima | pg/mL |  |  |  |  |
| Progesterona | `PROGESTERONA` | abaixo | ng/mL |  |  |  |  |
| Progesterona | `PROGESTERONA` | acima | ng/mL |  |  |  |  |

## inflamacao_imunologia

| Biomarcador | Código | Condição | Unid. | clinical_flag | template_key | priority | justificativa_clínica |
|---|---|---|---|---|---|---|---|
| IgE específico — látex (K82) | `IGE_LATEX` | sempre (qualitativo) | kU/L |  |  |  |  |
| Proteína C reativa | `PCR` | abaixo | mg/dL |  |  |  |  |
| Proteína C reativa | `PCR` | acima | mg/dL |  |  |  |  |

## metabolismo_ferro

| Biomarcador | Código | Condição | Unid. | clinical_flag | template_key | priority | justificativa_clínica |
|---|---|---|---|---|---|---|---|
| Ferritina | `FERRITINA` | abaixo | ng/mL |  |  |  |  |
| Ferritina | `FERRITINA` | acima | ng/mL |  |  |  |  |
| Ferro sérico | `FERRO_SERICO` | abaixo | ug/dL |  |  |  |  |
| Ferro sérico | `FERRO_SERICO` | acima | ug/dL |  |  |  |  |

## urina_24h

| Biomarcador | Código | Condição | Unid. | clinical_flag | template_key | priority | justificativa_clínica |
|---|---|---|---|---|---|---|---|
| Cálcio (urina 24h) | `CALCIO_24H` | abaixo | mg/24h |  |  |  |  |
| Cálcio (urina 24h) | `CALCIO_24H` | acima | mg/24h |  |  |  |  |
| Citrato (urina 24h) | `CITRATO_24H` | abaixo | mg/24h |  |  |  |  |
| Citrato (urina 24h) | `CITRATO_24H` | acima | mg/24h |  |  |  |  |
| Potássio (urina 24h) | `POTASSIO_24H` | abaixo | mEq/24h |  |  |  |  |
| Potássio (urina 24h) | `POTASSIO_24H` | acima | mEq/24h |  |  |  |  |
| Sódio (urina 24h) | `SODIO_24H` | abaixo | mEq/24h |  |  |  |  |
| Sódio (urina 24h) | `SODIO_24H` | acima | mEq/24h |  |  |  |  |

## vitaminas_minerais

| Biomarcador | Código | Condição | Unid. | clinical_flag | template_key | priority | justificativa_clínica |
|---|---|---|---|---|---|---|---|
| Vitamina B12 | `VIT_B12` | abaixo | pg/mL |  |  |  |  |
| Vitamina B12 | `VIT_B12` | acima | pg/mL |  |  |  |  |
| Vitamina D (25-OH) | `VIT_D_25OH` | abaixo | ng/mL |  |  |  |  |
| Vitamina D (25-OH) | `VIT_D_25OH` | acima | ng/mL |  |  |  |  |

## urinalise_eas

### Numéricos (motor v1 avalia)

| Biomarcador | Código | Condição | Unid. | clinical_flag | template_key | priority | justificativa_clínica |
|---|---|---|---|---|---|---|---|
| Cilindros hialinos | `EAS_CILINDROS_HIALINOS` | abaixo | por campo |  |  |  |  |
| Cilindros hialinos | `EAS_CILINDROS_HIALINOS` | acima | por campo |  |  |  |  |
| Densidade urinária | `EAS_DENSIDADE` | abaixo | — |  |  |  |  |
| Densidade urinária | `EAS_DENSIDADE` | acima | — |  |  |  |  |
| Epitélios vias altas | `EAS_EPITELIOS_ALTAS` | abaixo | por campo |  |  |  |  |
| Epitélios vias altas | `EAS_EPITELIOS_ALTAS` | acima | por campo |  |  |  |  |
| Epitélios vias baixas | `EAS_EPITELIOS_BAIXAS` | abaixo | por campo |  |  |  |  |
| Epitélios vias baixas | `EAS_EPITELIOS_BAIXAS` | acima | por campo |  |  |  |  |
| Hemácias (sedimento) | `EAS_HEMACIAS_CAMPO` | abaixo | por campo |  |  |  |  |
| Hemácias (sedimento) | `EAS_HEMACIAS_CAMPO` | acima | por campo |  |  |  |  |
| pH urinário | `EAS_PH` | abaixo | — |  |  |  |  |
| pH urinário | `EAS_PH` | acima | — |  |  |  |  |
| Piócitos (sedimento) | `EAS_PIOCITOS` | abaixo | por campo |  |  |  |  |
| Piócitos (sedimento) | `EAS_PIOCITOS` | acima | por campo |  |  |  |  |

### Qualitativos — motor v1 NÃO avalia (tratamento de value_text a definir pela clínica)

| Biomarcador | Código | Condição | clinical_flag | template_key | priority | justificativa_clínica |
|---|---|---|---|---|---|---|
| Aspecto da urina | `EAS_ASPECTO` | sempre |  |  |  |  |
| Bilirrubina (urina) | `EAS_BILIRRUBINA` | sempre |  |  |  |  |
| Cilindros patológicos | `EAS_CILINDROS_PATOLOGICOS` | sempre |  |  |  |  |
| Cor da urina | `EAS_COR` | sempre |  |  |  |  |
| Corpos cetônicos (urina) | `EAS_CETONAS` | sempre |  |  |  |  |
| Cristais (urina) | `EAS_CRISTAIS` | sempre |  |  |  |  |
| Flora bacteriana (urina) | `EAS_FLORA` | sempre |  |  |  |  |
| Glicose (urina) | `EAS_GLICOSE` | sempre |  |  |  |  |
| Hemoglobina (urina) | `EAS_HEMOGLOBINA` | sempre |  |  |  |  |
| Leucócito esterase (urina) | `EAS_LEUCO_ESTERASE` | sempre |  |  |  |  |
| Muco (urina) | `EAS_MUCO` | sempre |  |  |  |  |
| Nitrito (urina) | `EAS_NITRITO` | sempre |  |  |  |  |
| Proteína (urina) | `EAS_PROTEINA` | sempre |  |  |  |  |
| Urobilinogênio (urina) | `EAS_UROBILINOGENIO` | sempre |  |  |  |  |

---

## Clusters (a definir pela clínica)

O conceito de **cluster** (combinação de biomarcadores que, juntos, merecem um
insight) **não existe no CSV nem no catálogo** — é decisão clínica a estruturar.
Tabela em branco para o RC propor, se aplicável:

| Cluster (nome) | Biomarcadores envolvidos | Condição combinada | clinical_flag | template_key | justificativa_clínica |
|---|---|---|---|---|---|
|  |  |  |  |  |  |

> Nota técnica: o `insight_type='cluster'` já existe no schema e o motor aceita
> `biomarker_ids` com múltiplos IDs, mas o *mecanismo* de avaliação de clusters
> (regras sobre combinações) ainda não foi implementado — depende primeiro da
> definição clínica acima.

---

## Assinatura

| Campo | Valor |
|---|---|
| Responsável Clínico (nome) |  |
| Registro profissional |  |
| Data de aprovação |  |
| Validade até |  |
| Observações |  |

> Após preenchimento e assinatura: transcrever os valores aprovados para
> `docs/clinical/regras-clinicas-template.csv` (colunas `clinical_flag`,
> `template_key`, `insight_type`, `priority`, `clinical_rationale`,
> `approved_by`, `approved_at`) — é o CSV que o motor consome.

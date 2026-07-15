# Homologação de Exames — como executar (você só EXECUTA)

Este diretório recebe **casos reais** de homologação do módulo Exames. A infraestrutura já está
pronta: os critérios de aprovação são **objetivos** (o teste passa/reprova sozinho, sem discussão).

## 1. Adicionar um caso
Crie um arquivo `.json` aqui (um por documento real), no formato:

```json
{
  "id": "hermes-pardini-sangue-urina-01",
  "crc": "CRC-LAB-003",
  "category": "multi_exame",
  "input": {
    "examType": "laboratorial",
    "text": "(texto do laudo, opcional)",
    "biomarkers": [
      { "name": "Hemoglobina", "sourceExamName": "HEMOGRAMA", "resultType": "numeric", "value": "13.1" },
      { "name": "Densidade",   "sourceExamName": "URINA ROTINA", "resultType": "numeric", "value": "1.02" }
    ]
  },
  "expected": {
    "documentType": "laboratory",
    "documentScope": "mixed",
    "displayTitle": "Exames laboratoriais",
    "minDistinctExams": 2
  }
}
```

`category` ∈ `laboratorio_unico · laboratorio_painel · imagem · qualitativo · multi_exame · pedido`.
Em `expected`, informe só os critérios que quer travar (`documentType`, `documentScope`,
`displayTitle` OU `displayTitleMatches` (regex), `minDistinctExams`).

## 2. Executar
```
HOMOLOG=1 npm run test:homolog
```
Cada caso vira um teste verde/vermelho por **critério objetivo**. Sem `HOMOLOG=1` ou sem casos, a
suíte se **auto-pula** (não bloqueia o desenvolvimento — homologação roda em PARALELO).

## Matriz mínima sugerida (CRC)
Preencher ao menos um caso por linha:

| Categoria | O que valida | Critério objetivo |
|---|---|---|
| `laboratorio_unico` | 1 exame no documento | `displayTitle` = nome do exame |
| `laboratorio_painel` | vários exames | `displayTitle` = "Exames laboratoriais" + `documentScope` panel/mixed |
| `multi_exame` | segmentação → N | `minDistinctExams` ≥ N |
| `imagem` | laudo de imagem | `documentType` = imaging + `displayTitleMatches` (nome fiel) |
| `qualitativo` | achados/qualitativo | não vira dado numérico (representação) |
| `pedido` | pedido/guia | `documentType` = medical_order/insurance_guide |

## Escopo
Esta homologação trava a **representação determinística** (classificação, nomenclatura, segmentação,
quant×qual) sobre a extração real. A parte **não-determinística** (PDF → IA → biomarcadores) é
validada pela **homologação de pipeline vivo** (ambiente com app + IA reais), registrada à parte.

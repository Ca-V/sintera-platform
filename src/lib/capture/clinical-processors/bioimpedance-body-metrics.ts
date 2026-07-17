// FB-003 — projeção ADITIVA: parâmetros do laudo de bioimpedância → indicadores de Composição Corporal.
//
// O EXAME é o FATO (fonte, em clinical_results/UCDA). A Composição Corporal (BOD-001) é VISUALIZAÇÃO: lê
// pontos de `body_metrics` com `source='bioimpedancia'`, RASTREÁVEIS ao exame via `exam_id`. Este mapeador é
// PURO — traduz o nome do parâmetro do modelo clínico no `metric` canônico de body_metrics (não inventa valor;
// não interpreta). A persistência (user_id, exam_id, measured_on, source) é responsabilidade do chamador (route).

import type { ProcessedParameter } from './types'

// Nome do parâmetro (modelo bioimpedance) → métrica canônica de body_metrics (constraint da tabela).
const METRIC_BY_PARAM: Record<string, string> = {
  'Peso': 'peso',
  'IMC': 'imc',
  'Percentual de gordura': 'gordura_corporal',
  'Massa muscular': 'massa_muscular',
  'Massa magra': 'massa_magra',
  'Massa óssea': 'massa_ossea',
  'Água corporal': 'agua_corporal',
  'Gordura visceral': 'gordura_visceral',
  'Metabolismo basal': 'taxa_metabolica',
}

export interface BodyMetricPoint {
  metric: string
  label: string        // rótulo humano (nome do parâmetro no laudo)
  value_text: string
  unit: string | null
}

/**
 * Converte os parâmetros extraídos de um laudo de bioimpedância em pontos de body_metrics.
 * Puro/determinístico. Ignora parâmetros sem métrica canônica correspondente (não força).
 */
export function bioimpedanceToBodyMetrics(parameters: ProcessedParameter[]): BodyMetricPoint[] {
  const points: BodyMetricPoint[] = []
  for (const p of parameters) {
    const metric = METRIC_BY_PARAM[p.name]
    if (!metric) continue
    if (p.value == null || String(p.value).trim() === '') continue
    points.push({
      metric,
      label: p.name,
      value_text: String(p.value),
      unit: p.unit ?? null,
    })
  }
  return points
}

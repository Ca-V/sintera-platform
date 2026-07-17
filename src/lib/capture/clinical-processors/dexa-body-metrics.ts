// FB-003 (extensão) — projeção ADITIVA: composição corporal de um laudo DEXA (densitometria de corpo inteiro)
// → indicadores da Composição Corporal (`body_metrics`, source='dexa').
//
// SEGURO e CONSERVADOR: NÃO modela densitometria (densidade óssea/T-score continua sendo outro domínio). Só
// HARVEST-a os valores de COMPOSIÇÃO quando o laudo é DEXA/DXA E traz esses campos — caso contrário retorna []
// (um DEXA só de densidade óssea não gera pontos). Puro/determinístico; transcreve o medido (RDC 657), não infere.
// A persistência (user_id, exam_id, measured_on, source='dexa') é do chamador (analyze route).

import type { BodyMetricPoint } from './bioimpedance-body-metrics'

// Só considera composição se o texto for reconhecidamente um DEXA/DXA de composição.
const DEXA_GUARD = /densitometr|\bDXA\b|\bDEXA\b/i

// metric canônico → regra de leitura (1º valor plausível). Termos comuns de laudos DEXA de corpo inteiro pt-BR.
const RULES: { metric: string; label: string; unit: string | null; re: RegExp }[] = [
  { metric: 'peso', label: 'Peso', unit: 'kg', re: /\bpeso\b[^\d\n]{0,14}(\d{2,3}(?:[.,]\d)?)\s*kg/i },
  { metric: 'gordura_corporal', label: 'Percentual de gordura', unit: '%', re: /(?:percentual\s+de\s+gordura|gordura\s+corporal|%\s*(?:de\s+)?gordura|[íi]ndice\s+de\s+gordura\s+corporal)[^\d\n]{0,14}(\d{1,2}(?:[.,]\d)?)\s*%?/i },
  { metric: 'massa_magra', label: 'Massa magra', unit: 'kg', re: /massa\s+(?:magra|livre\s+de\s+gordura|lean)(?:\s+total)?[^\d\n]{0,14}(\d{1,3}(?:[.,]\d)?)\s*kg/i },
  { metric: 'massa_muscular', label: 'Massa muscular', unit: 'kg', re: /massa\s+muscular(?:\s+esquel[ée]tica)?[^\d\n]{0,14}(\d{1,3}(?:[.,]\d)?)\s*kg/i },
  { metric: 'massa_ossea', label: 'Conteúdo mineral ósseo', unit: 'kg', re: /(?:conte[úu]do\s+mineral\s+[óo]sseo|massa\s+[óo]ssea|\bCMO\b|\bBMC\b)[^\d\n]{0,14}(\d(?:[.,]\d{1,3})?)\s*kg/i },
]

/**
 * Extrai os pontos de COMPOSIÇÃO corporal de um laudo DEXA. Retorna [] se não for DEXA ou não houver composição.
 */
export function dexaBodyComposition(text: string | null | undefined): BodyMetricPoint[] {
  const raw = text ?? ''
  if (!DEXA_GUARD.test(raw)) return []
  const flat = raw.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ')
  const points: BodyMetricPoint[] = []
  for (const r of RULES) {
    const m = flat.match(r.re)
    if (!m || m[1] == null) continue
    points.push({ metric: r.metric, label: r.label, value_text: m[1].replace(',', '.'), unit: r.unit })
  }
  return points
}

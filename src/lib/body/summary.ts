// BOD-001 §4.1 área ① + §4.2 — Resumo atual da composição corporal + Qualidade do Dado. PURO/FACTUAL.
//
// Consolida o ESTADO MAIS RECENTE de cada indicador (valor·unidade·data·origem·confiabilidade·tendência vs. a
// medição anterior). Não é fonte primária: só lê pontos rastreáveis de `body_metrics`. Não interpreta clínica
// (RDC 657) — a "tendência" é apenas a direção/variação aritmética entre as duas últimas medições; a
// "confiabilidade" é atributo do MÉTODO/origem (proveniência), não do resultado.

export type Reliability = 'alta' | 'media' | 'informado'

export interface SourceQuality { label: string; reliability: Reliability }

// Mapa ABERTO origem → rótulo + confiabilidade da FONTE. Origem desconhecida → null (não afirma).
export const SOURCE_QUALITY: Record<string, SourceQuality> = {
  dexa:          { label: 'DEXA',                reliability: 'alta' },
  bioimpedancia: { label: 'Bioimpedância',       reliability: 'media' },
  balanca:       { label: 'Balança inteligente', reliability: 'media' },
  wearable:      { label: 'Dispositivo',         reliability: 'media' },
  manual:        { label: 'Registro manual',     reliability: 'informado' },
}

export const RELIABILITY_LABEL: Record<Reliability, string> = {
  alta: 'Confiabilidade alta', media: 'Confiabilidade média', informado: 'Informado pela usuária',
}

export function sourceQuality(source: string | null | undefined): SourceQuality | null {
  return source ? SOURCE_QUALITY[source] ?? null : null
}

export interface SummaryPoint {
  metric: string
  value: number
  unit: string | null
  date: string          // ISO yyyy-mm-dd
  source: string | null
}

export interface IndicatorSummary {
  metric: string
  value: number
  unit: string | null
  date: string
  source: string | null
  prevValue: number | null
  prevDate: string | null
  delta: number | null              // value − prevValue (variação vs. medição anterior)
  trend: 'up' | 'down' | 'flat' | null
}

function round(n: number, d = 1): number { const f = Math.pow(10, d); return Math.round(n * f) / f }

/**
 * Estado atual por indicador: último ponto + tendência vs. o penúltimo. Puro/determinístico.
 * Ordena por data (entrada fora de ordem não quebra). Métricas sem ponto ficam de fora.
 */
export function currentSummary(points: SummaryPoint[]): Record<string, IndicatorSummary> {
  const byMetric = new Map<string, SummaryPoint[]>()
  for (const p of points) {
    if (!Number.isFinite(p.value) || !p.date) continue
    const arr = byMetric.get(p.metric) ?? []
    arr.push(p); byMetric.set(p.metric, arr)
  }
  const out: Record<string, IndicatorSummary> = {}
  for (const [metric, arr] of byMetric) {
    const sorted = [...arr].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    const latest = sorted[sorted.length - 1]
    const prev = sorted.length >= 2 ? sorted[sorted.length - 2] : null
    const delta = prev ? round(latest.value - prev.value) : null
    const trend: IndicatorSummary['trend'] = delta == null ? null : delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat'
    out[metric] = {
      metric, value: round(latest.value), unit: latest.unit, date: latest.date, source: latest.source,
      prevValue: prev ? round(prev.value) : null, prevDate: prev?.date ?? null, delta, trend,
    }
  }
  return out
}

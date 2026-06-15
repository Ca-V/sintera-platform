// ============================================================
// SINTERA — Motor Longitudinal (FASE 3): análise factual de séries
// ============================================================
// Calcula, a partir de uma série temporal de um biomarcador, métricas
// FACTUAIS/ARITMÉTICAS: variação total, velocidade de mudança (por mês) e
// direção (subiu/desceu/estável). NÃO emite juízo clínico — nunca "melhora"
// ou "piora", apenas a direção e o ritmo do número no tempo.
// ============================================================

export interface SeriesPoint {
  value: number
  /** Data ISO (exam_date ou created_at). */
  date: string
}

/** Direção factual da mudança no período (limiar de 5% sobre o primeiro valor). */
export type SeriesDirection = 'up' | 'down' | 'stable'

export interface SeriesAnalysis {
  count: number
  first: SeriesPoint
  last: SeriesPoint
  /** Meses entre a primeira e a última medição (null se < 2 pontos ou mesmo instante). */
  monthsSpan: number | null
  /** Velocidade absoluta: Δvalor por mês (null se não calculável). */
  ratePerMonth: number | null
  /** Velocidade relativa: % do primeiro valor por mês (null se não calculável). */
  ratePercentPerMonth: number | null
  /** Variação total entre primeira e última medição, em % (null se primeiro = 0). */
  totalDeltaPercent: number | null
  direction: SeriesDirection
}

const MS_PER_MONTH = 1000 * 60 * 60 * 24 * 30.4375 // mês médio

/**
 * Analisa uma série de medições (mesmo biomarcador, mesma unidade).
 * Pura: ordena por data, ignora pontos inválidos. Retorna null se vazia.
 */
export function analyzeSeries(points: SeriesPoint[]): SeriesAnalysis | null {
  const valid = points
    .filter(p => Number.isFinite(p.value) && !!p.date)
    .sort((a, b) => a.date.localeCompare(b.date))

  if (valid.length === 0) return null

  const first = valid[0]
  const last = valid[valid.length - 1]

  if (valid.length < 2) {
    return {
      count: valid.length, first, last,
      monthsSpan: null, ratePerMonth: null, ratePercentPerMonth: null,
      totalDeltaPercent: null, direction: 'stable',
    }
  }

  const ms = new Date(last.date).getTime() - new Date(first.date).getTime()
  const months = ms > 0 ? ms / MS_PER_MONTH : null
  const deltaVal = last.value - first.value
  const totalDeltaPercent = first.value !== 0 ? (deltaVal / Math.abs(first.value)) * 100 : null
  const ratePerMonth = months !== null ? deltaVal / months : null
  const ratePercentPerMonth = (months !== null && first.value !== 0)
    ? (deltaVal / Math.abs(first.value)) * 100 / months
    : null

  const direction: SeriesDirection =
    totalDeltaPercent === null ? 'stable'
    : totalDeltaPercent > 5 ? 'up'
    : totalDeltaPercent < -5 ? 'down'
    : 'stable'

  return { count: valid.length, first, last, monthsSpan: months, ratePerMonth, ratePercentPerMonth, totalDeltaPercent, direction }
}

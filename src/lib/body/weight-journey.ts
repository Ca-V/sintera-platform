// FB-007 (BOD-001) — acompanhamento de peso (jornada, útil p/ GLP-1). PURO/FACTUAL.
//
// SINTERA organiza, não interpreta (RDC 657): aqui só ARITMÉTICA sobre os pontos que a própria pessoa registrou
// (peso inicial/atual, perda acumulada, ritmo, meta, preservação de massa magra). Nenhum juízo clínico, nenhuma
// recomendação. Sem dependências de data do runtime (recebe datas ISO das medições).

export interface SeriesPoint {
  value: number
  date: string // ISO yyyy-mm-dd
}

export interface WeightJourney {
  startWeight: number | null
  currentWeight: number | null
  lostKg: number | null            // inicial − atual (positivo = perdeu)
  spanWeeks: number | null         // intervalo entre a 1ª e a última medição, em semanas
  rateKgPerWeek: number | null     // ritmo médio (lostKg / spanWeeks)
  goalKg: number | null
  remainingKg: number | null       // atual − meta (positivo = ainda a perder)
  progressPct: number | null       // 0..100 do caminho inicial→meta já percorrido
  leanStartKg: number | null
  leanCurrentKg: number | null
  leanDeltaKg: number | null       // atual − inicial (positivo = preservou/ganhou)
}

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000

function sortAsc(points: SeriesPoint[]): SeriesPoint[] {
  return [...points].filter(p => Number.isFinite(p.value) && !!p.date).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
}

function round(n: number | null, digits = 1): number | null {
  if (n == null || !Number.isFinite(n)) return null
  const f = Math.pow(10, digits)
  return Math.round(n * f) / f
}

/**
 * Calcula a jornada de peso a partir das séries de peso e de massa magra e de uma meta opcional.
 * Puro/determinístico. Retorna nulos quando não há dados suficientes (nunca inventa).
 */
export function computeWeightJourney(
  weight: SeriesPoint[],
  lean: SeriesPoint[],
  goalKg: number | null,
): WeightJourney {
  const w = sortAsc(weight)
  const l = sortAsc(lean)
  const empty: WeightJourney = {
    startWeight: null, currentWeight: null, lostKg: null, spanWeeks: null, rateKgPerWeek: null,
    goalKg: goalKg ?? null, remainingKg: null, progressPct: null,
    leanStartKg: null, leanCurrentKg: null, leanDeltaKg: null,
  }
  if (w.length === 0) {
    // Sem peso: ainda podemos reportar a massa magra.
    if (l.length > 0) {
      const leanStart = l[0].value, leanCurrent = l[l.length - 1].value
      return { ...empty, leanStartKg: round(leanStart), leanCurrentKg: round(leanCurrent), leanDeltaKg: round(leanCurrent - leanStart) }
    }
    return empty
  }

  const start = w[0], current = w[w.length - 1]
  const lostKg = start.value - current.value
  const spanMs = new Date(`${current.date}T00:00:00Z`).getTime() - new Date(`${start.date}T00:00:00Z`).getTime()
  const spanWeeks = spanMs > 0 ? spanMs / MS_PER_WEEK : null
  const rate = spanWeeks && spanWeeks > 0 ? lostKg / spanWeeks : null

  let remainingKg: number | null = null
  let progressPct: number | null = null
  if (goalKg != null && Number.isFinite(goalKg)) {
    remainingKg = current.value - goalKg
    const totalToLose = start.value - goalKg
    if (totalToLose > 0) progressPct = Math.max(0, Math.min(100, (lostKg / totalToLose) * 100))
    else if (totalToLose === 0) progressPct = 100
  }

  const leanStart = l.length > 0 ? l[0].value : null
  const leanCurrent = l.length > 0 ? l[l.length - 1].value : null
  const leanDelta = leanStart != null && leanCurrent != null ? leanCurrent - leanStart : null

  return {
    startWeight: round(start.value),
    currentWeight: round(current.value),
    lostKg: round(lostKg),
    spanWeeks: round(spanWeeks),
    rateKgPerWeek: round(rate, 2),
    goalKg: goalKg ?? null,
    remainingKg: round(remainingKg),
    progressPct: round(progressPct, 0),
    leanStartKg: round(leanStart),
    leanCurrentKg: round(leanCurrent),
    leanDeltaKg: round(leanDelta),
  }
}

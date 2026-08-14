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

// Confiabilidade RELATIVA da fonte — só para DESEMPATAR métricas duplicadas no MESMO dia (ex.: peso registrado
// manualmente e também por bioimpedância). dexa > bioimpedância/balança/dispositivo > manual > desconhecida. Não é
// juízo clínico: é qualidade de PROVENIÊNCIA. Deriva de SOURCE_QUALITY (alta=3 · media=2 · informado=1 · null=0).
const RELIABILITY_SCORE: Record<Reliability, number> = { alta: 3, media: 2, informado: 1 }
export function reliabilityRank(source: string | null | undefined): number {
  const q = sourceQuality(source)
  return q ? RELIABILITY_SCORE[q.reliability] : 0
}

/**
 * Colapsa pontos da MESMA data para UM só, preferindo a fonte mais confiável (empate → mantém o 1º visto).
 * Resolve "métricas duplicadas": a mesma métrica registrada por fontes diferentes no mesmo dia não vira tendência
 * espúria (variação entre fontes ≠ evolução) nem ponto duplicado nas séries/comparações. Puro/determinístico.
 * O chamador garante que os pontos são de UMA métrica (dedup por métrica é responsabilidade de quem agrupa).
 */
export function dedupeByDate<T extends { date: string; source?: string | null }>(points: T[]): T[] {
  const best = new Map<string, T>()
  for (const p of points) {
    if (!p.date) continue
    const cur = best.get(p.date)
    if (!cur || reliabilityRank(p.source) > reliabilityRank(cur.source)) best.set(p.date, p)
  }
  return [...best.values()]
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

// Origens que representam uma AVALIAÇÃO corporal completa (laudo), não um registro pontual de peso.
export const ASSESSMENT_SOURCES = ['bioimpedancia', 'dexa'] as const

export interface LastAssessment { source: string; label: string; date: string }

/**
 * Última AVALIAÇÃO corporal (bioimpedância/DEXA) — mostra a atualidade dos dados. Puro.
 * Retorna a mais recente entre os pontos cuja origem é uma avaliação; null se não houver.
 */
export function lastAssessment(points: SummaryPoint[]): LastAssessment | null {
  let best: { source: string; date: string } | null = null
  for (const p of points) {
    if (!p.source || !(ASSESSMENT_SOURCES as readonly string[]).includes(p.source) || !p.date) continue
    if (!best || p.date > best.date) best = { source: p.source, date: p.date }
  }
  if (!best) return null
  return { source: best.source, label: SOURCE_QUALITY[best.source]?.label ?? best.source, date: best.date }
}

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
    // Um ponto por DIA (fonte mais confiável) — a tendência compara medições de DIAS distintos, nunca duas
    // fontes do mesmo dia (que produziriam uma variação espúria). Resolve métricas duplicadas.
    const sorted = dedupeByDate(arr).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
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

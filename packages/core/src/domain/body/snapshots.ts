// BOD-001 área ③ — Comparação entre Avaliações, modelada como SNAPSHOTS. PURO/FACTUAL.
//
// Um SNAPSHOT é o retrato da composição corporal num momento (uma avaliação: bioimpedância, DEXA, InBody, ou um
// lote de registros manuais de uma data). A comparação confronta DOIS snapshots INDEPENDENTES, preservando a
// origem de cada indicador e evidenciando INDISPONIBILIDADES — SEM inferências nem normalizações entre
// tecnologias distintas (não "corrige" DEXA para parecer bioimpedância; apresenta o que cada método mediu).

export interface SnapPoint {
  metric: string
  value: number
  unit: string | null
  date: string           // ISO yyyy-mm-dd
  source: string | null
  examId: string | null
}

export interface Snapshot {
  key: string            // 'exam:<id>' ou '<source>:<date>'
  source: string | null
  date: string
  examId: string | null
  metrics: Record<string, { value: number; unit: string | null }>
}

function round(n: number, d = 1): number { const f = Math.pow(10, d); return Math.round(n * f) / f }

/**
 * Agrupa pontos em snapshots: por exame (mesmo `examId`) ou, sem exame, por (origem + data).
 * Retorna do mais recente ao mais antigo. Puro/determinístico.
 */
export function buildSnapshots(points: SnapPoint[]): Snapshot[] {
  const map = new Map<string, Snapshot>()
  for (const p of points) {
    if (!Number.isFinite(p.value) || !p.date) continue
    const key = p.examId ? `exam:${p.examId}` : `${p.source ?? 'na'}:${p.date}`
    let s = map.get(key)
    if (!s) { s = { key, source: p.source, date: p.date, examId: p.examId, metrics: {} }; map.set(key, s) }
    if (!(p.metric in s.metrics)) s.metrics[p.metric] = { value: round(p.value), unit: p.unit }
  }
  return [...map.values()].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}

export interface CompareRow {
  metric: string
  a: number | null
  b: number | null
  delta: number | null       // a − b (variação de B → A); null se algum lado faltar
  unit: string | null
  available: boolean         // ambos os lados têm o indicador
}

/**
 * Confronta dois snapshots por uma ordem de indicadores. Indicador ausente em um dos lados → `available=false`
 * (Status "Não disponível"), delta null. Não infere nem normaliza. Métrica ausente em AMBOS é omitida.
 */
export function compareSnapshots(a: Snapshot | null, b: Snapshot | null, order: string[]): CompareRow[] {
  const rows: CompareRow[] = []
  for (const m of order) {
    const av = a?.metrics[m], bv = b?.metrics[m]
    const aVal = av?.value ?? null, bVal = bv?.value ?? null
    if (aVal == null && bVal == null) continue
    const available = aVal != null && bVal != null
    rows.push({
      metric: m, a: aVal, b: bVal, unit: av?.unit ?? bv?.unit ?? null,
      available, delta: available ? round(aVal! - bVal!) : null,
    })
  }
  return rows
}

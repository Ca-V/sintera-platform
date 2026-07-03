// Agrupamento de biomarcadores por nome canônico para as visões longitudinais
// (Indicadores: landing por biomarcador + drill-down). Fonte: view canônica
// current_biomarkers. Linguagem/medidas factuais — sem juízo clínico (RDC 657/2022).
// Compartilhado entre saude/page.tsx (lista) e saude/[slug]/page.tsx (drill-down)
// para evitar duplicação de responsabilidades (T2-B1).

export interface BiomarkerRow {
  id: string
  name: string
  value: number | null
  unit: string | null
  result_type: string | null
  reference_min: number | null
  reference_max: number | null
  interpretation?: string | null
  reference_source?: string | null
  catalog_id?: string | null
  source_material?: string | null
  source_exam_name?: string | null
  exam_id: string
  exams: { exam_date: string | null; created_at: string } | null
}

/** Ponto do Índice Experimental: proporção de biomarcadores dentro da referência por exame. */
export interface ReferenceIndexPoint {
  examId: string
  date: string
  pct: number
  num: number
  den: number
}

export type Trend = 'up' | 'down' | 'stable' | 'single' | 'unit_mismatch'

export interface Measurement {
  examId: string
  date: string
  value: number
  unit: string
  referenceMin: number | null
  referenceMax: number | null
  interpretation: string | null
}

export interface BiomarkerSummary {
  canonicalName: string
  displayName: string
  catalogId?: string | null
  // Contexto do laudo (Fidelidade da Ingestão) — da medição mais recente que o tiver.
  // Usado na Evolução (ING-004): Material → Nome do exame → Biomarcadores quando presente.
  // Opcional (como catalogId) para não quebrar mocks de teste; summarizeBiomarkers sempre preenche.
  sourceMaterial?: string | null
  sourceExamName?: string | null
  unit: string
  latest: Measurement | null
  first: Measurement | null
  count: number
  trend: Trend
  deltaPercent: number | null       // entre as duas últimas medições
  totalDeltaPercent: number | null  // entre a primeira e a última
  hasUnitMismatch: boolean
  units: string[]
  measurements: Measurement[]
}

export function normalizeName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, ' ').trim()
}

export function examDate(r: BiomarkerRow): string {
  return r.exams?.exam_date ?? r.exams?.created_at ?? ''
}

function calcTrend(ms: Measurement[]): { trend: Trend; deltaPercent: number | null } {
  if (ms.length < 2) return { trend: 'single', deltaPercent: null }
  const last = ms[ms.length - 1].value
  const prev = ms[ms.length - 2].value
  if (prev === 0) return { trend: 'stable', deltaPercent: null }
  const d = (last - prev) / Math.abs(prev)
  if (d > 0.05) return { trend: 'up', deltaPercent: Math.round(d * 100) }
  if (d < -0.05) return { trend: 'down', deltaPercent: Math.round(d * 100) }
  return { trend: 'stable', deltaPercent: Math.round(d * 100) }
}

/** Resume cada biomarcador NUMÉRICO em uma série longitudinal, ordenado por nome. */
export function summarizeBiomarkers(rows: BiomarkerRow[]): BiomarkerSummary[] {
  const map = new Map<string, BiomarkerRow[]>()
  for (const r of rows) {
    if (r.result_type !== 'numeric' || r.value === null) continue
    const k = normalizeName(r.name)
    if (!map.has(k)) map.set(k, [])
    map.get(k)!.push(r)
  }

  const out: BiomarkerSummary[] = []
  for (const [key, list] of map.entries()) {
    const sorted = [...list].sort((a, b) => examDate(a).localeCompare(examDate(b)) || a.id.localeCompare(b.id))
    const units = [...new Set(sorted.map(r => r.unit ?? ''))]
    const hasUnitMismatch = units.length > 1
    const primaryUnit = units[0] ?? ''
    const measurements: Measurement[] = (hasUnitMismatch ? [] : sorted).map(r => ({
      examId: r.exam_id, date: examDate(r), value: r.value!, unit: r.unit ?? '',
      referenceMin: r.reference_min, referenceMax: r.reference_max, interpretation: r.interpretation ?? null,
    }))
    const { trend, deltaPercent } = hasUnitMismatch
      ? { trend: 'unit_mismatch' as Trend, deltaPercent: null }
      : calcTrend(measurements)
    const first = measurements[0] ?? null
    const latest = measurements[measurements.length - 1] ?? null
    const totalDeltaPercent = first && latest && measurements.length >= 2 && first.value !== 0
      ? Math.round(((latest.value - first.value) / Math.abs(first.value)) * 100)
      : null

    // Contexto do laudo: pega a medição MAIS RECENTE que tenha o campo (dado misto
    // antigo/novo). São consistentes dentro de uma mesma série (mesmo biomarcador).
    const revd = [...sorted].reverse()
    const sourceMaterial = revd.find(r => r.source_material)?.source_material ?? null
    const sourceExamName = revd.find(r => r.source_exam_name)?.source_exam_name ?? null

    out.push({
      canonicalName: key,
      displayName: sorted[sorted.length - 1].name,
      catalogId: sorted[sorted.length - 1].catalog_id ?? null,
      sourceMaterial,
      sourceExamName,
      unit: primaryUnit,
      latest, first, count: sorted.length,
      trend, deltaPercent, totalDeltaPercent,
      hasUnitMismatch, units, measurements,
    })
  }

  return out.sort((a, b) => a.displayName.localeCompare(b.displayName, 'pt-BR'))
}

/** Série de um único biomarcador (drill-down), pelo nome normalizado. */
export function seriesForName(rows: BiomarkerRow[], normalizedName: string): BiomarkerSummary | null {
  return summarizeBiomarkers(rows).find(s => s.canonicalName === normalizedName) ?? null
}

/**
 * Índice Experimental — por exame, a proporção de biomarcadores NUMÉRICOS com
 * referência impressa no laudo (reference_source='laudo', interpretation definida)
 * que estão dentro da faixa. Só exames com pelo menos 5 elegíveis entram. Factual.
 */
export function computeReferenceIndex(rows: BiomarkerRow[]): ReferenceIndexPoint[] {
  const byExam = new Map<string, { date: string; num: number; den: number }>()
  for (const r of rows) {
    if (r.reference_source !== 'laudo' || r.result_type !== 'numeric' || !r.interpretation) continue
    if (!byExam.has(r.exam_id)) byExam.set(r.exam_id, { date: examDate(r), num: 0, den: 0 })
    const g = byExam.get(r.exam_id)!
    g.den += 1
    if (r.interpretation === 'dentro_da_referencia') g.num += 1
  }
  return [...byExam.entries()]
    .map(([examId, g]) => ({ examId, date: g.date, num: g.num, den: g.den, pct: Math.round((g.num / g.den) * 100) }))
    .filter(p => p.den >= 5)
    .sort((a, b) => a.date.localeCompare(b.date))
}

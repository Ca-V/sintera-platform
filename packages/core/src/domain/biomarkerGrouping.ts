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


export type Trend = 'up' | 'down' | 'stable' | 'single' | 'unit_mismatch'

/** Símbolo do valor recente vs. referência (paridade Web+Mobile). ▲ acima · ▼ abaixo · ✓ dentro · – s/ ref. */
export function interpretationSymbol(interpretation: string | null | undefined): string {
  switch (interpretation) {
    case 'acima_da_referencia': return '▲'
    case 'abaixo_da_referencia': return '▼'
    case 'dentro_da_referencia': return '✓'
    default: return '–'
  }
}

/** Texto curto da tendência entre as duas últimas medições (paridade Web+Mobile). Fonte única do rótulo. */
export function trendDeltaText(trend: Trend, delta: number | null): string {
  switch (trend) {
    case 'up': return delta !== null ? `+${delta}%` : '↑'
    case 'down': return delta !== null ? `${delta}%` : '↓'
    case 'stable': return delta !== null ? `${delta > 0 ? '+' : ''}${delta}%` : '—'
    case 'single': return '1ª medição'
    default: return 'unidades ≠'
  }
}

export interface Measurement {
  examId: string
  date: string
  value: number
  unit: string
  referenceMin: number | null
  referenceMax: number | null
  interpretation: string | null
}

/**
 * Série de UMA unidade compatível dentro de um biomarcador. Tendência/estatística SÓ existem aqui — nunca
 * misturam unidades (regra oficial: não comparar/plotar valores em unidades diferentes). Ver
 * principio_indicador_unidades_incompativeis: nunca esconder dados; agrupar por unidade; explicar.
 */
export interface UnitSeries {
  unit: string
  measurements: Measurement[]       // só desta unidade, em ordem cronológica
  first: Measurement | null
  latest: Measurement | null
  count: number
  trend: Trend                      // dentro do grupo (nunca 'unit_mismatch'); 'single' se 1 medição
  deltaPercent: number | null       // entre as duas últimas medições DESTA unidade
  totalDeltaPercent: number | null  // entre a primeira e a última DESTA unidade
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
  /** Tendência TOP-LEVEL. Com >1 unidade é SEMPRE 'unit_mismatch' (não existe tendência agregada entre unidades).
   *  Para gráfico/tendência REAIS use `unitGroups` (várias séries) ou `primaryUnitSeries()` (gráfico único). */
  trend: Trend
  deltaPercent: number | null       // top-level; null quando há unidades diferentes
  totalDeltaPercent: number | null  // top-level; null quando há unidades diferentes
  hasUnitMismatch: boolean
  units: string[]
  /** TODAS as medições (TODAS as unidades) — nunca descartadas. **NÃO usar para gráfico nem tendência** (misturaria
   *  unidades); serve só para LISTAR. Gráfico/tendência: `unitGroups` (por unidade) ou `primaryUnitSeries()`. */
  measurements: Measurement[]
  /** CAMINHO OFICIAL para gráfico/tendência: uma série por unidade compatível (nunca mistura). 1 grupo = sem
   *  mismatch. Opcional só para não quebrar mocks — summarizeBiomarkers SEMPRE preenche. */
  unitGroups?: UnitSeries[]
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
    // TODAS as medições são preservadas (nunca descartadas), mesmo com unidades diferentes.
    const measurements: Measurement[] = sorted.map(r => ({
      examId: r.exam_id, date: examDate(r), value: r.value!, unit: r.unit ?? '',
      referenceMin: r.reference_min, referenceMax: r.reference_max, interpretation: r.interpretation ?? null,
    }))
    // Agrupa por UNIDADE (preserva a ordem cronológica no grupo). Tendência/estatística SÓ dentro do grupo —
    // nunca mistura unidades. Ordem dos grupos = ordem de aparição das unidades.
    const byUnit = new Map<string, Measurement[]>()
    for (const m of measurements) { const g = byUnit.get(m.unit); if (g) g.push(m); else byUnit.set(m.unit, [m]) }
    const unitGroups: UnitSeries[] = [...byUnit.entries()].map(([unit, ms]) => {
      const g = calcTrend(ms)
      const f = ms[0] ?? null
      const l = ms[ms.length - 1] ?? null
      const total = f && l && ms.length >= 2 && f.value !== 0 ? Math.round(((l.value - f.value) / Math.abs(f.value)) * 100) : null
      return { unit, measurements: ms, first: f, latest: l, count: ms.length, trend: g.trend, deltaPercent: g.deltaPercent, totalDeltaPercent: total }
    })
    // Top-level: com 1 unidade espelha o único grupo; com >1, sinaliza mismatch (tendência agregada não existe —
    // vive em cada unitGroup). `latest`/`first` seguem a medição mais recente/antiga no geral (com sua unidade).
    const single = unitGroups.length === 1 ? unitGroups[0] : null
    const trend: Trend = single ? single.trend : 'unit_mismatch'
    const deltaPercent = single ? single.deltaPercent : null
    const first = measurements[0] ?? null
    const latest = measurements[measurements.length - 1] ?? null
    const totalDeltaPercent = single ? single.totalDeltaPercent : null

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
      hasUnitMismatch, units, measurements, unitGroups,
    })
  }

  return out.sort((a, b) => a.displayName.localeCompare(b.displayName, 'pt-BR'))
}

/** Série de um único biomarcador (drill-down), pelo nome normalizado. */
export function seriesForName(rows: BiomarkerRow[], normalizedName: string): BiomarkerSummary | null {
  return summarizeBiomarkers(rows).find(s => s.canonicalName === normalizedName) ?? null
}

/**
 * Série da unidade PRINCIPAL (a de mais medições) — para uma visão de GRÁFICO ÚNICO que não pode mostrar várias
 * séries (ex.: card/preview/relatório resumido). NUNCA mistura unidades. Consumidores de gráfico único devem usar
 * ISTO em vez de `summary.measurements` (que contém todas as unidades). Regra oficial: não comparar entre unidades.
 */
export function primaryUnitSeries(s: BiomarkerSummary): UnitSeries {
  const groups = s.unitGroups && s.unitGroups.length ? s.unitGroups : []
  if (groups.length) return [...groups].sort((a, b) => b.count - a.count)[0]
  return { unit: s.unit, measurements: s.measurements, first: s.first, latest: s.latest, count: s.count, trend: s.trend, deltaPercent: s.deltaPercent, totalDeltaPercent: s.totalDeltaPercent }
}
// (Índice Experimental "proporção dentro da referência" removido — era experimental/interpretativo e saiu do
//  Histórico de Exames por decisão de produto, 21/07. Se retornar, será em contexto explicitamente analítico.)

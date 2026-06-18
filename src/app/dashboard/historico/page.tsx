'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, Search, Loader2, FileText, AlertTriangle, HelpCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/context/UserContext'

// ── Tipos ────────────────────────────────────────────────────────────────────

interface RawBiomarker {
  id: string
  name: string
  value: number | null
  value_text: string | null
  unit: string | null
  result_type: string | null
  reference_min: number | null
  reference_max: number | null
  reference_source: string | null
  interpretation: string | null
  synthetic: boolean
  exam_id: string
  exams: { exam_date: string | null; created_at: string; type: string | null } | null
}

// Retorna exam_date se disponível, senão created_at como fallback
function getExamDate(b: RawBiomarker): string {
  return b.exams?.exam_date ?? b.exams?.created_at ?? ''
}

type Trend = 'up' | 'down' | 'stable' | 'single' | 'unit_mismatch'

interface Measurement {
  examId: string
  date: string
  value: number
  unit: string
  interpretation: string | null
  referenceMin: number | null
  referenceMax: number | null
}

interface BiomarkerGroup {
  canonicalName: string
  displayName: string
  unit: string
  trend: Trend
  deltaPercent: number | null          // entre últimas duas medições
  totalDeltaPercent: number | null     // entre primeira e última (Epic Fase 1)
  firstMeasurement: Measurement | null // Epic Fase 1
  lastMeasurement: Measurement | null  // Epic Fase 1
  measurements: Measurement[]
  qualitativeMeasurements: { date: string; valueText: string }[]
  hasUnitMismatch: boolean
  units: string[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, ' ').trim()
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
}

function formatDateFull(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function getYear(iso: string): number {
  return new Date(iso).getFullYear()
}

function calcTrend(measurements: Measurement[]): { trend: Trend; deltaPercent: number | null } {
  if (measurements.length < 2) return { trend: 'single', deltaPercent: null }
  const last       = measurements[measurements.length - 1].value
  const secondLast = measurements[measurements.length - 2].value
  if (secondLast === 0) return { trend: 'stable', deltaPercent: null }
  const delta = (last - secondLast) / Math.abs(secondLast)
  if (delta > 0.05)  return { trend: 'up',   deltaPercent: Math.round(delta * 100) }
  if (delta < -0.05) return { trend: 'down', deltaPercent: Math.round(delta * 100) }
  return { trend: 'stable', deltaPercent: Math.round(delta * 100) }
}

function calcTotalDelta(first: number, last: number): number | null {
  if (first === 0) return null
  return Math.round(((last - first) / Math.abs(first)) * 100)
}

function groupBiomarkers(rows: RawBiomarker[]): BiomarkerGroup[] {
  const map = new Map<string, { numeric: RawBiomarker[]; qualitative: RawBiomarker[] }>()

  for (const b of rows) {
    const key = normalizeName(b.name)
    if (!map.has(key)) map.set(key, { numeric: [], qualitative: [] })
    const g = map.get(key)!
    if (b.result_type === 'numeric' && b.value !== null) g.numeric.push(b)
    else if (b.result_type === 'qualitative' && b.value_text) g.qualitative.push(b)
  }

  const groups: BiomarkerGroup[] = []

  for (const [key, { numeric, qualitative }] of map.entries()) {
    const sortedNumeric = [...numeric].sort((a, b) => {
      const da = getExamDate(a)
      const db = getExamDate(b)
      return da.localeCompare(db) || a.id.localeCompare(b.id)
    })

    const units = [...new Set(sortedNumeric.map(b => b.unit ?? ''))]
    const hasUnitMismatch = units.length > 1
    const primaryUnit = units[0] ?? ''

    const measurements: Measurement[] = hasUnitMismatch
      ? []
      : sortedNumeric
          .filter(b => (b.unit ?? '') === primaryUnit)
          .map(b => ({
            examId:       b.exam_id,
            date:         getExamDate(b),
            value:        b.value!,
            unit:         b.unit ?? '',
            interpretation: b.interpretation,
            referenceMin: b.reference_min,
            referenceMax: b.reference_max,
          }))

    const qualitativeMeasurements = [...qualitative]
      .sort((a, b) => getExamDate(a).localeCompare(getExamDate(b)))
      .map(b => ({ date: getExamDate(b), valueText: b.value_text! }))

    if (measurements.length === 0 && qualitativeMeasurements.length === 0 && !hasUnitMismatch) continue

    const { trend, deltaPercent } = hasUnitMismatch
      ? { trend: 'unit_mismatch' as Trend, deltaPercent: null }
      : calcTrend(measurements)

    const firstMeasurement = measurements.length > 0 ? measurements[0] : null
    const lastMeasurement  = measurements.length > 0 ? measurements[measurements.length - 1] : null
    const totalDeltaPercent = (firstMeasurement && lastMeasurement && measurements.length >= 2)
      ? calcTotalDelta(firstMeasurement.value, lastMeasurement.value)
      : null

    groups.push({
      canonicalName:    key,
      displayName:      numeric[0]?.name ?? qualitative[0]?.name ?? key,
      unit:             primaryUnit,
      trend,
      deltaPercent,
      totalDeltaPercent,
      firstMeasurement,
      lastMeasurement,
      measurements,
      qualitativeMeasurements,
      hasUnitMismatch,
      units,
    })
  }

  const ORDER: Record<Trend, number> = { up: 1, down: 2, stable: 3, single: 4, unit_mismatch: 5 }
  return groups.sort((a, b) => {
    const oa = a.measurements.length === 0 && a.qualitativeMeasurements.length > 0 ? 6 : ORDER[a.trend] ?? 6
    const ob = b.measurements.length === 0 && b.qualitativeMeasurements.length > 0 ? 6 : ORDER[b.trend] ?? 6
    if (oa !== ob) return oa - ob
    return a.displayName.localeCompare(b.displayName, 'pt-BR')
  })
}

// ── Config visual ──────────────────────────────────────────────────────────────

const INTERP_COLORS: Record<string, string> = {
  acima_da_referencia:         'text-orange-500',
  abaixo_da_referencia:        'text-blue-500',
  dentro_da_referencia:        'text-sage',
  sem_referencia_identificada: 'text-mauve/60',
  indisponivel:                'text-mauve/40',
}

const INTERP_LABELS: Record<string, string> = {
  acima_da_referencia:         '▲',
  abaixo_da_referencia:        '▼',
  dentro_da_referencia:        '✓',
  sem_referencia_identificada: '–',
  indisponivel:                '–',
}

// ── TrendBadge — linguagem factual (P5 Fase 1) ──────────────────────────────
// Proibido: "Subindo", "Caindo", linguagem clínica ou de prognóstico
// Permitido: variação percentual factual entre últimas duas medições
function TrendBadge({ trend, delta }: { trend: Trend; delta: number | null }) {
  if (trend === 'up')
    return <span className="flex items-center gap-1 text-orange-500 font-body text-xs font-semibold">
      <TrendingUp size={12}/> {delta !== null ? `+${delta}% na última medição` : '↑ variação positiva'}
    </span>
  if (trend === 'down')
    return <span className="flex items-center gap-1 text-blue-500 font-body text-xs font-semibold">
      <TrendingDown size={12}/> {delta !== null ? `${delta}% na última medição` : '↓ variação negativa'}
    </span>
  if (trend === 'stable')
    return <span className="flex items-center gap-1 text-mauve font-body text-xs">
      <Minus size={12}/> Sem variação significativa
    </span>
  if (trend === 'single')
    return <span className="font-body text-xs text-mauve/60">Primeira medição</span>
  if (trend === 'unit_mismatch')
    return <span className="flex items-center gap-1 text-amber-600 font-body text-xs">
      <AlertTriangle size={12}/> Unidades diferentes
    </span>
  return null
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function HistoricoPage() {
  const supabase = useRef(createClient()).current
  const { user } = useUser()
  const [rows, setRows]           = useState<RawBiomarker[]>([])
  const [examIndexes, setExamIndexes] = useState<{ date: string; pct: number; num: number; den: number }[]>([])
  const [loading, setLoading]     = useState(true)

  // ── Filtros (Epic Fase 1) ──────────────────────────────────────────────────
  const [search, setSearch]           = useState('')
  const [filterYearFrom, setYearFrom] = useState<string>('all')
  const [filterYearTo, setYearTo]     = useState<string>('all')
  const [indexTip, setIndexTip]       = useState(false)

  useEffect(() => {
    if (!user) return
    loadData()
    fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_name: 'historico_viewed' }),
    }).catch(() => {})
  }, [user])

  async function loadData() {
    setLoading(true)
    const { data } = await supabase
      .from('biomarkers')
      .select('id,name,value,value_text,unit,result_type,reference_min,reference_max,reference_source,interpretation,synthetic,exam_id,exams(exam_date,created_at,type)')
      .eq('user_id', user!.id)
      .eq('synthetic', false)
      .in('result_type', ['numeric', 'qualitative'])
    setRows((data ?? []) as RawBiomarker[])

    const allNumeric = (data ?? []) as RawBiomarker[]
    const byExam = new Map<string, { date: string; eligible: RawBiomarker[] }>()
    for (const b of allNumeric) {
      if (b.reference_source !== 'laudo' || b.result_type !== 'numeric' || b.interpretation === null) continue
      const date = getExamDate(b)
      if (!byExam.has(b.exam_id)) byExam.set(b.exam_id, { date, eligible: [] })
      byExam.get(b.exam_id)!.eligible.push(b)
    }
    const indexes = [...byExam.entries()]
      .map(([, { date, eligible }]) => {
        const den = eligible.length
        const num = eligible.filter(b => b.interpretation === 'dentro_da_referencia').length
        return { date, pct: Math.round((num / den) * 100), num, den }
      })
      .filter(x => x.den >= 5)
      .sort((a, b) => a.date.localeCompare(b.date))
    setExamIndexes(indexes)
    setLoading(false)
  }

  // ── Anos disponíveis ───────────────────────────────────────────────────────
  const availableYears = useMemo(() => {
    const years = [...new Set(
      rows
        .map(r => getExamDate(r))
        .filter(Boolean)
        .map(d => getYear(d))
    )].sort((a, b) => a - b)
    return years
  }, [rows])

  // ── Grupos filtrados ───────────────────────────────────────────────────────
  const allGroups = useMemo(() => groupBiomarkers(rows), [rows])

  const filtered = useMemo(() => {
    let result = allGroups

    // Filtro por nome
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(g => g.displayName.toLowerCase().includes(q))
    }

    // Filtro por período — filtra as medições dentro do intervalo de anos
    if (filterYearFrom !== 'all' || filterYearTo !== 'all') {
      const from = filterYearFrom !== 'all' ? parseInt(filterYearFrom) : 0
      const to   = filterYearTo   !== 'all' ? parseInt(filterYearTo)   : 9999
      result = result
        .map(g => ({
          ...g,
          measurements: g.measurements.filter(m => {
            if (!m.date) return true
            const yr = getYear(m.date)
            return yr >= from && yr <= to
          }),
          qualitativeMeasurements: g.qualitativeMeasurements.filter(m => {
            if (!m.date) return true
            const yr = getYear(m.date)
            return yr >= from && yr <= to
          }),
        }))
        .filter(g => g.measurements.length > 0 || g.qualitativeMeasurements.length > 0)
    }

    return result
  }, [allGroups, search, filterYearFrom, filterYearTo])

  const hasActiveFilters = search.trim() !== '' || filterYearFrom !== 'all' || filterYearTo !== 'all'

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 size={28} className="animate-spin text-petal" />
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-5">

      {/* Cabeçalho */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="card-premium p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blush flex items-center justify-center flex-shrink-0">
            <TrendingUp size={22} className="text-petal" />
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold text-onyx">Histórico de Biomarcadores</h1>
            <p className="font-body text-sm text-mauve mt-0.5">
              {allGroups.length} biomarcadores · {rows.length} medições
              {availableYears.length > 1 && ` · ${availableYears[0]}–${availableYears[availableYears.length - 1]}`}
            </p>
          </div>
        </div>

        {/* Filtros (Epic Fase 1) */}
        <div className="mt-4 flex flex-wrap gap-2">
          {/* Busca por biomarcador */}
          <div className="relative flex-1 min-w-[160px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mauve/50" />
            <input
              type="text"
              placeholder="Buscar biomarcador…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-ivory border border-border rounded-xl font-body text-sm text-onyx placeholder-mauve/40 focus:outline-none focus:ring-1 focus:ring-petal/40"
            />
          </div>

          {/* De (ano) */}
          {availableYears.length > 1 && (
            <>
              <select
                value={filterYearFrom}
                onChange={e => setYearFrom(e.target.value)}
                className="py-2 px-3 bg-ivory border border-border rounded-xl font-body text-sm text-onyx focus:outline-none focus:ring-1 focus:ring-petal/40"
              >
                <option value="all">De: todos</option>
                {availableYears.map(yr => <option key={yr} value={String(yr)}>{yr}</option>)}
              </select>

              <select
                value={filterYearTo}
                onChange={e => setYearTo(e.target.value)}
                className="py-2 px-3 bg-ivory border border-border rounded-xl font-body text-sm text-onyx focus:outline-none focus:ring-1 focus:ring-petal/40"
              >
                <option value="all">Até: todos</option>
                {availableYears.map(yr => <option key={yr} value={String(yr)}>{yr}</option>)}
              </select>
            </>
          )}
        </div>

        {hasActiveFilters && (
          <div className="mt-2 flex items-center justify-between">
            <p className="font-body text-xs text-mauve/60">
              {filtered.length} biomarcador{filtered.length !== 1 ? 'es' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
            </p>
            <button
              onClick={() => { setSearch(''); setYearFrom('all'); setYearTo('all') }}
              className="font-body text-xs text-petal hover:underline"
            >
              Limpar filtros
            </button>
          </div>
        )}
      </motion.div>

      {/* Estado vazio */}
      {filtered.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="card-premium p-12 text-center">
          <FileText size={40} className="text-border mx-auto mb-3" />
          <p className="font-body text-sm font-semibold text-onyx mb-1">
            {search || hasActiveFilters ? 'Nenhum biomarcador encontrado' : 'Nenhum dado disponível'}
          </p>
          <p className="font-body text-xs text-mauve">
            {search || hasActiveFilters ? 'Tente ajustar os filtros.' : 'Extraia os dados de um exame para ver o histórico aqui.'}
          </p>
        </motion.div>
      )}

      {/* Índice Experimental — evolução */}
      {examIndexes.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="card-premium overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border/40 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <p className="font-body text-sm font-semibold text-onyx">Proporção dentro da referência</p>
              <span className="font-body text-[10px] text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full border border-amber-200">Beta</span>
            </div>
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setIndexTip(t => !t)}
                className="w-6 h-6 rounded-full flex items-center justify-center text-mauve/50 hover:text-onyx transition-colors"
                aria-label="O que é este índice?">
                <HelpCircle size={14} />
              </button>
              {indexTip && (
                <div className="absolute right-0 top-8 z-20 w-72 bg-white rounded-2xl shadow-xl border border-border p-4">
                  <p className="font-body text-xs font-semibold text-onyx mb-2">O que é a Proporção dentro da referência?</p>
                  <p className="font-body text-xs text-mauve leading-relaxed mb-2">
                    De todos os biomarcadores numéricos com referência impressa no laudo, quantos estão dentro da faixa informada pelo laboratório. Calculado separadamente para cada exame.
                  </p>
                  <p className="font-body text-xs text-amber-700 bg-amber-50 rounded-xl px-3 py-2 leading-relaxed">
                    Não representa diagnóstico, risco ou estado geral de saúde. Cada laboratório usa referências próprias.
                  </p>
                  <button onClick={() => setIndexTip(false)} className="mt-2 w-full text-center font-body text-xs text-mauve hover:text-petal transition-colors">
                    Fechar
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="px-5 py-4 space-y-3">
            {examIndexes.map((idx, i) => {
              const barColor  = idx.pct >= 80 ? 'bg-sage' : idx.pct >= 60 ? 'bg-amber-400' : 'bg-orange-400'
              const textColor = idx.pct >= 80 ? 'text-sage' : idx.pct >= 60 ? 'text-amber-600' : 'text-orange-500'
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="font-body text-xs text-mauve/60 w-14 flex-shrink-0">{idx.date ? formatDate(idx.date) : '—'}</span>
                  <div className="flex-1 bg-border/30 rounded-full h-2">
                    <div className={`h-2 rounded-full ${barColor}`} style={{ width: `${idx.pct}%` }} />
                  </div>
                  <span className={`font-body text-sm font-semibold ${textColor} w-10 text-right flex-shrink-0`}>{idx.pct}%</span>
                  <span className="font-body text-xs text-mauve/50 flex-shrink-0">{idx.num}/{idx.den}</span>
                </div>
              )
            })}
            <p className="font-body text-[11px] text-mauve/40 pt-1">
              Proporção de biomarcadores numéricos dentro das referências do laudo. Não representa diagnóstico ou estado de saúde.
            </p>
          </div>
        </motion.div>
      )}

      {/* Lista de grupos */}
      <div className="space-y-3">
        {filtered.map((g, i) => (
          <motion.div key={g.canonicalName}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.02 + i * 0.015 }}
            className="card-premium overflow-hidden">

            {/* Header do grupo */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/40">
              <div>
                <p className="font-body text-sm font-semibold text-onyx">{g.displayName}</p>
                <p className="font-body text-xs text-mauve/60 mt-0.5">
                  {g.unit ? `${g.unit} · ` : ''}{g.measurements.length + g.qualitativeMeasurements.length} medição{g.measurements.length + g.qualitativeMeasurements.length !== 1 ? 'ões' : ''}
                </p>
              </div>
              <TrendBadge trend={g.trend} delta={g.deltaPercent} />
            </div>

            {/* Resumo numérico (Epic Fase 1) — só quando há 2+ medições */}
            {g.firstMeasurement && g.lastMeasurement && g.measurements.length >= 2 && (
              <div className="px-5 py-3 bg-ivory/60 border-b border-border/30 grid grid-cols-3 gap-3">
                <div>
                  <p className="font-body text-[10px] text-mauve/50 uppercase tracking-wider mb-0.5">Primeira</p>
                  <p className="font-body text-sm font-semibold text-onyx">{g.firstMeasurement.value} <span className="text-xs font-normal text-mauve">{g.unit}</span></p>
                  <p className="font-body text-[10px] text-mauve/50">{g.firstMeasurement.date ? formatDateFull(g.firstMeasurement.date) : '—'}</p>
                </div>
                <div>
                  <p className="font-body text-[10px] text-mauve/50 uppercase tracking-wider mb-0.5">Última</p>
                  <p className="font-body text-sm font-semibold text-onyx">{g.lastMeasurement.value} <span className="text-xs font-normal text-mauve">{g.unit}</span></p>
                  <p className="font-body text-[10px] text-mauve/50">{g.lastMeasurement.date ? formatDateFull(g.lastMeasurement.date) : '—'}</p>
                </div>
                <div>
                  <p className="font-body text-[10px] text-mauve/50 uppercase tracking-wider mb-0.5">Variação total</p>
                  {g.totalDeltaPercent !== null ? (
                    <p className={`font-body text-sm font-semibold ${g.totalDeltaPercent > 0 ? 'text-orange-500' : g.totalDeltaPercent < 0 ? 'text-blue-500' : 'text-mauve'}`}>
                      {g.totalDeltaPercent > 0 ? '+' : ''}{g.totalDeltaPercent}%
                    </p>
                  ) : (
                    <p className="font-body text-sm text-mauve/40">—</p>
                  )}
                  <p className="font-body text-[10px] text-mauve/50">no período</p>
                </div>
              </div>
            )}

            {/* Aviso de unidades diferentes */}
            {g.hasUnitMismatch && (
              <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-100">
                <p className="font-body text-xs text-amber-700">
                  Unidades diferentes entre exames ({g.units.join(', ')}) — variação não calculada.
                </p>
                <div className="mt-2 space-y-1">
                  {[...rows]
                    .filter(b => normalizeName(b.name) === g.canonicalName && b.result_type === 'numeric' && b.value !== null)
                    .sort((a, b) => getExamDate(a).localeCompare(getExamDate(b)))
                    .map(b => (
                      <div key={b.id} className="flex items-center gap-3">
                        <span className="font-body text-xs text-mauve/60 w-14">{getExamDate(b) ? formatDate(getExamDate(b)) : '—'}</span>
                        <span className="font-body text-sm text-onyx font-medium">{b.value}</span>
                        <span className="font-body text-xs text-mauve">{b.unit}</span>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}

            {/* Medições numéricas */}
            {!g.hasUnitMismatch && g.measurements.length > 0 && (
              <div className="divide-y divide-border/20">
                {g.measurements.map((m) => {
                  const interpColor = INTERP_COLORS[m.interpretation ?? ''] ?? 'text-mauve/60'
                  const interpLabel = INTERP_LABELS[m.interpretation ?? ''] ?? '–'
                  return (
                    <div key={`${m.examId}-${m.date}`}
                      className="flex items-center gap-3 px-5 py-2.5 hover:bg-blush/10 transition-colors">
                      <span className="font-body text-xs text-mauve/60 w-14 flex-shrink-0">{m.date ? formatDate(m.date) : '—'}</span>
                      <span className="font-body text-sm font-semibold text-onyx">{m.value}</span>
                      <span className="font-body text-xs text-mauve flex-shrink-0">{m.unit}</span>
                      {(m.referenceMin !== null || m.referenceMax !== null) && (
                        <span className="font-body text-xs text-mauve/40 ml-1">
                          ref {m.referenceMin !== null && m.referenceMax !== null
                            ? `${m.referenceMin}–${m.referenceMax}`
                            : m.referenceMin !== null ? `>${m.referenceMin}` : `<${m.referenceMax}`}
                        </span>
                      )}
                      <span className={`ml-auto font-body text-xs font-semibold ${interpColor}`}>{interpLabel}</span>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Medições qualitativas */}
            {g.qualitativeMeasurements.length > 0 && (
              <div className={g.measurements.length > 0 ? 'border-t border-border/40' : ''}>
                {g.measurements.length === 0 && (
                  <div className="px-5 pt-2.5 pb-1">
                    <p className="font-body text-xs text-blue-500/80">Resultado qualitativo — histórico comparativo não disponível nesta versão</p>
                  </div>
                )}
                {g.qualitativeMeasurements.map((m, idx) => (
                  <div key={idx} className="flex items-center gap-3 px-5 py-2 hover:bg-blush/10 transition-colors">
                    <span className="font-body text-xs text-mauve/60 w-14 flex-shrink-0">{m.date ? formatDate(m.date) : '—'}</span>
                    <span className="font-body text-sm text-blue-600 font-medium">{m.valueText}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Nota de limitação */}
      {allGroups.length > 0 && (
        <p className="font-body text-xs text-mauve/40 text-center pb-4">
          Biomarcadores com nomes diferentes entre laboratórios aparecem como entradas separadas nesta versão Beta.
        </p>
      )}
    </div>
  )
}

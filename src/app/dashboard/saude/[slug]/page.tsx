'use client'

// T2-B1a.1 (Evolução Funcional) — Drill-down de Indicador por biomarcador:
// gráfico temporal + "Exames utilizados". Aditivo e reversível; lê a view canônica
// current_biomarkers (não toca o caminho de escrita). Linguagem factual (RDC 657/2022).

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2, FlaskConical, ArrowRight } from 'lucide-react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/context/UserContext'

interface Row {
  id: string
  name: string
  value: number | null
  unit: string | null
  result_type: string | null
  reference_min: number | null
  reference_max: number | null
  interpretation: string | null
  exam_id: string
  exams: { exam_date: string | null; created_at: string } | null
}

interface Point {
  examId: string
  date: string
  value: number
  unit: string
  referenceMin: number | null
  referenceMax: number | null
  interpretation: string | null
}

function normalizeName(n: string): string {
  return n.toLowerCase().replace(/\s+/g, ' ').trim()
}
function examDate(r: Row): string {
  return r.exams?.exam_date ?? r.exams?.created_at ?? ''
}
function formatDateFull(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}
function formatDateShort(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
}

const INTERP_COLORS: Record<string, string> = {
  acima_da_referencia:         'text-orange-500',
  abaixo_da_referencia:        'text-blue-500',
  dentro_da_referencia:        'text-sage',
  sem_referencia_identificada: 'text-mauve/60',
  indisponivel:                'text-mauve/40',
}
const INTERP_SYM: Record<string, string> = {
  acima_da_referencia: '▲', abaixo_da_referencia: '▼', dentro_da_referencia: '✓',
  sem_referencia_identificada: '–', indisponivel: '–',
}

// ── Gráfico temporal (SVG inline, sem dependência) ─────────────────────────────
function TemporalChart({ points }: { points: Point[] }) {
  const W = 640, H = 200, padX = 36, padY = 24
  const values = points.map(p => p.value)
  const refMins = points.map(p => p.referenceMin).filter((v): v is number => v !== null)
  const refMaxs = points.map(p => p.referenceMax).filter((v): v is number => v !== null)
  const lo = Math.min(...values, ...refMins)
  const hi = Math.max(...values, ...refMaxs)
  const span = hi - lo || 1
  const min = lo - span * 0.12
  const max = hi + span * 0.12
  const x = (i: number) => padX + (points.length === 1 ? (W - 2 * padX) / 2 : (i * (W - 2 * padX)) / (points.length - 1))
  const y = (v: number) => H - padY - ((v - min) / (max - min)) * (H - 2 * padY)

  // Faixa de referência (se constante e definida em todas as medições)
  const refMin = refMins.length === points.length && new Set(refMins).size === 1 ? refMins[0] : null
  const refMax = refMaxs.length === points.length && new Set(refMaxs).size === 1 ? refMaxs[0] : null

  const line = points.map((p, i) => `${x(i)},${y(p.value)}`).join(' ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Gráfico temporal do biomarcador">
      {refMin !== null && refMax !== null && (
        <rect x={padX} y={y(refMax)} width={W - 2 * padX} height={Math.max(0, y(refMin) - y(refMax))}
          className="fill-sage/10" />
      )}
      {refMin !== null && refMax !== null && (
        <>
          <line x1={padX} x2={W - padX} y1={y(refMax)} y2={y(refMax)} className="stroke-sage/30" strokeDasharray="4 4" strokeWidth={1} />
          <line x1={padX} x2={W - padX} y1={y(refMin)} y2={y(refMin)} className="stroke-sage/30" strokeDasharray="4 4" strokeWidth={1} />
        </>
      )}
      {points.length > 1 && <polyline points={line} fill="none" className="stroke-petal" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}
      {points.map((p, i) => (
        <g key={p.examId + p.date}>
          <circle cx={x(i)} cy={y(p.value)} r={4} className="fill-petal" />
          <text x={x(i)} y={y(p.value) - 9} textAnchor="middle" className="fill-onyx font-semibold" style={{ fontSize: 11 }}>{p.value}</text>
          <text x={x(i)} y={H - 6} textAnchor="middle" className="fill-mauve" style={{ fontSize: 10 }}>{formatDateShort(p.date)}</text>
        </g>
      ))}
    </svg>
  )
}

export default function IndicadorDrilldownPage() {
  const params = useParams<{ slug: string }>()
  const slug = decodeURIComponent(params.slug)
  const { user } = useUser()
  const supabase = useRef(createClient() as unknown as SupabaseClient).current
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('current_biomarkers')
      .select('id,name,value,unit,result_type,reference_min,reference_max,interpretation,exam_id,exams(exam_date,created_at)')
      .eq('user_id', user.id)
      .eq('synthetic', false)
      .eq('result_type', 'numeric')
    if (error) console.error('[SINTERA] indicador fetch:', error.message)
    setRows((data ?? []) as unknown as Row[])
    setLoading(false)
  }, [user, supabase])

  useEffect(() => { load() }, [load])

  const model = useMemo(() => {
    const matched = rows.filter(r => normalizeName(r.name) === slug && r.value !== null)
    if (matched.length === 0) return null
    const units = [...new Set(matched.map(r => r.unit ?? ''))]
    const displayName = matched[matched.length - 1].name
    const sorted = [...matched].sort((a, b) => examDate(a).localeCompare(examDate(b)) || a.id.localeCompare(b.id))
    const points: Point[] = sorted.map(r => ({
      examId: r.exam_id, date: examDate(r), value: r.value!, unit: r.unit ?? '',
      referenceMin: r.reference_min, referenceMax: r.reference_max, interpretation: r.interpretation,
    }))
    const first = points[0]
    const last = points[points.length - 1]
    const totalDelta = points.length >= 2 && first.value !== 0
      ? Math.round(((last.value - first.value) / Math.abs(first.value)) * 100)
      : null
    return { displayName, unit: units[0] ?? '', unitMismatch: units.length > 1, points, first, last, totalDelta }
  }, [rows, slug])

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]"><Loader2 size={28} className="animate-spin text-petal" /></div>
  )

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <Link href="/dashboard/saude" className="inline-flex items-center gap-1.5 font-body text-sm text-mauve hover:text-onyx transition-colors">
        <ArrowLeft size={15} /> Indicadores
      </Link>

      {!model ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-premium p-12 text-center">
          <FlaskConical size={40} className="text-border mx-auto mb-3" />
          <p className="font-body text-sm font-semibold text-onyx mb-1">Indicador não encontrado</p>
          <p className="font-body text-xs text-mauve">Não há medições numéricas para este biomarcador.</p>
        </motion.div>
      ) : (
        <>
          {/* Cabeçalho + resumo factual */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card-premium p-6">
            <h1 className="font-display text-xl font-semibold text-onyx">{model.displayName}</h1>
            <p className="font-body text-sm text-mauve mt-0.5">
              {model.unit ? `${model.unit} · ` : ''}{model.points.length} medição{model.points.length !== 1 ? 'ões' : ''}
            </p>
            {model.first && model.last && model.points.length >= 2 && (
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="rounded-2xl bg-ivory/60 py-3 px-3">
                  <p className="font-body text-[10px] text-mauve/50 uppercase tracking-wider mb-0.5">Primeira</p>
                  <p className="font-body text-sm font-semibold text-onyx">{model.first.value} <span className="text-xs font-normal text-mauve">{model.unit}</span></p>
                  <p className="font-body text-[10px] text-mauve/50">{formatDateFull(model.first.date)}</p>
                </div>
                <div className="rounded-2xl bg-ivory/60 py-3 px-3">
                  <p className="font-body text-[10px] text-mauve/50 uppercase tracking-wider mb-0.5">Última</p>
                  <p className="font-body text-sm font-semibold text-onyx">{model.last.value} <span className="text-xs font-normal text-mauve">{model.unit}</span></p>
                  <p className="font-body text-[10px] text-mauve/50">{formatDateFull(model.last.date)}</p>
                </div>
                <div className="rounded-2xl bg-ivory/60 py-3 px-3">
                  <p className="font-body text-[10px] text-mauve/50 uppercase tracking-wider mb-0.5">Variação total</p>
                  {model.totalDelta !== null ? (
                    <p className={`font-body text-sm font-semibold ${model.totalDelta > 0 ? 'text-orange-500' : model.totalDelta < 0 ? 'text-blue-500' : 'text-mauve'}`}>
                      {model.totalDelta > 0 ? '+' : ''}{model.totalDelta}%
                    </p>
                  ) : <p className="font-body text-sm text-mauve/40">—</p>}
                  <p className="font-body text-[10px] text-mauve/50">no período</p>
                </div>
              </div>
            )}
          </motion.div>

          {/* Gráfico temporal */}
          {model.unitMismatch ? (
            <div className="card-premium p-5">
              <p className="font-body text-xs text-amber-700">Unidades diferentes entre exames — gráfico temporal não exibido.</p>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card-premium p-5">
              <p className="font-body text-sm font-semibold text-onyx mb-3">Evolução temporal</p>
              <TemporalChart points={model.points} />
              <p className="font-body text-[11px] text-mauve/50 mt-2">
                Faixa verde = referência impressa no laudo (quando constante). Valores factuais; não indicam melhora ou piora clínica.
              </p>
            </motion.div>
          )}

          {/* Exames utilizados */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="card-premium overflow-hidden">
            <div className="px-5 py-3 border-b border-border/40">
              <p className="font-body text-sm font-semibold text-onyx">Exames utilizados</p>
            </div>
            <div className="divide-y divide-border/20">
              {[...model.points].reverse().map((p) => {
                const interpColor = INTERP_COLORS[p.interpretation ?? ''] ?? 'text-mauve/60'
                const sym = INTERP_SYM[p.interpretation ?? ''] ?? '–'
                return (
                  <Link key={p.examId + p.date} href={`/dashboard/exams/${p.examId}`}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-blush/10 transition-colors group">
                    <span className="font-body text-xs text-mauve/60 w-24 flex-shrink-0">{formatDateFull(p.date)}</span>
                    <span className="font-body text-sm font-semibold text-onyx">{p.value}</span>
                    <span className="font-body text-xs text-mauve flex-shrink-0">{p.unit}</span>
                    {(p.referenceMin !== null || p.referenceMax !== null) && (
                      <span className="font-body text-xs text-mauve/40 ml-1">
                        ref {p.referenceMin !== null && p.referenceMax !== null
                          ? `${p.referenceMin}–${p.referenceMax}`
                          : p.referenceMin !== null ? `>${p.referenceMin}` : `<${p.referenceMax}`}
                      </span>
                    )}
                    <span className={`ml-auto font-body text-xs font-semibold ${interpColor}`}>{sym}</span>
                    <ArrowRight size={14} className="text-mauve/30 group-hover:text-petal transition-colors flex-shrink-0" />
                  </Link>
                )
              })}
            </div>
          </motion.div>

          <p className="font-body text-xs text-mauve/40 text-center pb-4">
            Esta visão organiza os dados dos seus laudos. Não substitui avaliação profissional nem constitui diagnóstico (RDC 657/2022).
          </p>
        </>
      )}
    </div>
  )
}

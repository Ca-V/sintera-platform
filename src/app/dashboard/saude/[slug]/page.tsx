'use client'

// Drill-down de Indicador por biomarcador (T2-B1a): gráfico temporal +
// "Exames utilizados". Lê a view canônica current_biomarkers (não toca o caminho
// de escrita). Linguagem factual (RDC 657/2022). Usa a lib compartilhada de
// agrupamento (src/lib/biomarkers/grouping.ts) para não duplicar lógica.

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, Loader2, FlaskConical, ArrowRight } from 'lucide-react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { parseDateOnly } from '@/lib/agenda'
import { useUser } from '@/context/UserContext'
import { seriesForName, interpretationSymbol, type BiomarkerRow, type Measurement, type UnitSeries } from '@/lib/biomarkers/grouping'
import MotionCard from '@/components/ui/MotionCard'

function formatDateFull(iso: string): string {
  if (!iso) return '—'
  return parseDateOnly(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}
function formatDateShort(iso: string): string {
  if (!iso) return '—'
  return parseDateOnly(iso).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
}

const INTERP_COLORS: Record<string, string> = {
  acima_da_referencia: 'text-orange-500', abaixo_da_referencia: 'text-blue-600',
  dentro_da_referencia: 'text-petal', sem_referencia_identificada: 'text-mauve', indisponivel: 'text-mauve/40',
}
// (símbolo de interpretação vem de @sintera/core interpretationSymbol — SSOT, sem reimplementação local)

// ── Gráfico temporal (SVG inline, sem dependência) ─────────────────────────────
function TemporalChart({ points }: { points: Measurement[] }) {
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

  const refMin = refMins.length === points.length && new Set(refMins).size === 1 ? refMins[0] : null
  const refMax = refMaxs.length === points.length && new Set(refMaxs).size === 1 ? refMaxs[0] : null
  const line = points.map((p, i) => `${x(i)},${y(p.value)}`).join(' ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Gráfico temporal do biomarcador">
      {refMin !== null && refMax !== null && (
        <rect x={padX} y={y(refMax)} width={W - 2 * padX} height={Math.max(0, y(refMin) - y(refMax))} className="fill-sage/10" />
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
  const [supabase] = useState(() => createClient() as unknown as SupabaseClient)
  const [rows, setRows] = useState<BiomarkerRow[]>([])
  const [catalogNames, setCatalogNames] = useState<Map<string, string>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    let active = true
    ;(async () => {
      const [bio, cat] = await Promise.all([
        supabase.from('current_biomarkers')
          .select('id,name,value,unit,result_type,reference_min,reference_max,interpretation,catalog_id,exam_id,exams(exam_date,created_at)')
          .eq('user_id', user.id).eq('synthetic', false).eq('result_type', 'numeric'),
        supabase.from('biomarker_catalog').select('id,display_name'),
      ])
      if (!active) return
      if (bio.error) console.error('[SINTERA] indicador fetch:', bio.error.message)
      setRows((bio.data ?? []) as unknown as BiomarkerRow[])
      const cmap = new Map<string, string>()
      for (const c of (cat.data ?? []) as { id: string; display_name: string }[]) cmap.set(c.id, c.display_name)
      setCatalogNames(cmap)
      setLoading(false)
    })()
    return () => { active = false }
  }, [user, supabase])

  const model = useMemo(() => seriesForName(rows, slug), [rows, slug])

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]"><Loader2 size={28} className="animate-spin text-petal" /></div>
  )

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <Link href="/dashboard/saude" className="inline-flex items-center gap-1.5 font-body text-sm text-mauve hover:text-onyx transition-colors">
        <ArrowLeft size={15} /> Indicadores
      </Link>

      {!model || model.measurements.length === 0 ? (
        <MotionCard initial={{ opacity: 0 }} animate={{ opacity: 1 }} padding="none" className="p-10 text-center">
          <FlaskConical size={40} className="text-border mx-auto mb-3" />
          <p className="font-body text-sm font-semibold text-onyx mb-1">Indicador não encontrado</p>
          <p className="font-body text-xs text-mauve">Não há medições numéricas para este biomarcador.</p>
        </MotionCard>
      ) : (() => {
        // Regra oficial (unidades incompatíveis): SEMPRE por grupo de unidade — gráfico/tendência só dentro do
        // grupo, nunca mistura unidades, nunca esconde dados. 1 grupo = sem mismatch.
        const groups: UnitSeries[] = model.unitGroups && model.unitGroups.length
          ? model.unitGroups
          : [{ unit: model.unit, measurements: model.measurements, first: model.first, latest: model.latest, count: model.count, trend: model.trend, deltaPercent: model.deltaPercent, totalDeltaPercent: model.totalDeltaPercent }]
        return (
        <>
          {/* Cabeçalho */}
          <MotionCard initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} padding="none" className="p-6">
            <h1 className="font-body text-xl font-semibold text-onyx">{catalogNames.get(model.catalogId ?? '') ?? model.displayName}</h1>
            <p className="font-body text-sm text-mauve mt-0.5">
              {model.measurements.length} mediç{model.measurements.length !== 1 ? 'ões' : 'ão'}{model.hasUnitMismatch ? ` · ${model.units.length} unidades` : model.unit ? ` · ${model.unit}` : ''}
            </p>
          </MotionCard>

          {/* Aviso de unidades diferentes — regra oficial: não comparar entre unidades; cada unidade na própria série. */}
          {model.hasUnitMismatch && (
            <MotionCard initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} padding="none" className="p-4 border-2 border-amber-200 bg-amber-50">
              <p className="font-body text-sm font-semibold text-amber-700 mb-1">Unidades diferentes</p>
              <p className="font-body text-xs text-amber-600 leading-relaxed">Este indicador tem medições em unidades diferentes; elas não podem ser comparadas diretamente. Cada unidade aparece na sua própria série abaixo.</p>
            </MotionCard>
          )}

          {groups.map((g) => (
            <div key={g.unit || 'sem-unidade'} className="space-y-5">
              {model.hasUnitMismatch && <p className="font-body text-sm font-semibold text-onyx">{g.unit || 'Sem unidade'}</p>}

              {/* Resumo factual da unidade */}
              {g.first && g.latest && g.measurements.length >= 2 && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-ivory/60 py-3 px-3">
                    <p className="font-body text-[11px] text-mauve uppercase tracking-wider mb-0.5">Primeira</p>
                    <p className="font-body text-sm font-semibold text-onyx">{g.first.value} <span className="text-xs font-normal text-mauve">{g.unit}</span></p>
                    <p className="font-body text-[11px] text-mauve">{formatDateFull(g.first.date)}</p>
                  </div>
                  <div className="rounded-2xl bg-ivory/60 py-3 px-3">
                    <p className="font-body text-[11px] text-mauve uppercase tracking-wider mb-0.5">Última</p>
                    <p className="font-body text-sm font-semibold text-onyx">{g.latest.value} <span className="text-xs font-normal text-mauve">{g.unit}</span></p>
                    <p className="font-body text-[11px] text-mauve">{formatDateFull(g.latest.date)}</p>
                  </div>
                  <div className="rounded-2xl bg-ivory/60 py-3 px-3">
                    <p className="font-body text-[11px] text-mauve uppercase tracking-wider mb-0.5">Variação total</p>
                    {g.totalDeltaPercent !== null ? (
                      <p className={`font-body text-sm font-semibold ${g.totalDeltaPercent > 0 ? 'text-orange-500' : g.totalDeltaPercent < 0 ? 'text-blue-600' : 'text-mauve'}`}>
                        {g.totalDeltaPercent > 0 ? '+' : ''}{g.totalDeltaPercent}%
                      </p>
                    ) : <p className="font-body text-sm text-mauve/40">—</p>}
                    <p className="font-body text-[11px] text-mauve">no período</p>
                  </div>
                </div>
              )}

              {/* Gráfico temporal — só dentro do grupo de unidade */}
              {g.measurements.length >= 2 ? (
                <MotionCard initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} padding="relaxed">
                  <p className="font-body text-sm font-semibold text-onyx mb-3">Evolução temporal</p>
                  <TemporalChart points={g.measurements} />
                  <p className="font-body text-[11px] text-mauve mt-2">
                    Faixa verde = referência impressa no laudo (quando constante). Valores factuais; não indicam melhora ou piora clínica.
                  </p>
                </MotionCard>
              ) : (
                <p className="font-body text-xs text-mauve">Uma única medição{g.unit ? ` em ${g.unit}` : ''} — sem série para comparar.</p>
              )}

              {/* Exames utilizados desta unidade */}
              <MotionCard initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} padding="none" className="overflow-hidden">
                <div className="px-5 py-3 border-b border-border/40">
                  <p className="font-body text-sm font-semibold text-onyx">Exames utilizados</p>
                </div>
                <div className="divide-y divide-border/20">
                  {[...g.measurements].reverse().map((p) => {
                    const interpColor = INTERP_COLORS[p.interpretation ?? ''] ?? 'text-mauve'
                    return (
                      <Link key={p.examId + p.date} href={`/dashboard/exams/${p.examId}`}
                        className="flex items-center gap-3 px-5 py-3 hover:bg-blush/10 transition-colors group">
                        <span className="font-body text-xs text-mauve w-24 flex-shrink-0">{formatDateFull(p.date)}</span>
                        <span className="font-body text-sm font-semibold text-onyx">{p.value}</span>
                        <span className="font-body text-xs text-mauve flex-shrink-0">{p.unit}</span>
                        {(p.referenceMin !== null || p.referenceMax !== null) && (
                          <span className="font-body text-xs text-mauve/40 ml-1">
                            ref {p.referenceMin !== null && p.referenceMax !== null
                              ? `${p.referenceMin}–${p.referenceMax}`
                              : p.referenceMin !== null ? `>${p.referenceMin}` : `<${p.referenceMax}`}
                          </span>
                        )}
                        <span className={`ml-auto font-body text-xs font-semibold ${interpColor}`}>{interpretationSymbol(p.interpretation)}</span>
                        <ArrowRight size={14} className="text-mauve/30 group-hover:text-petal transition-colors flex-shrink-0" />
                      </Link>
                    )
                  })}
                </div>
              </MotionCard>
            </div>
          ))}

          <p className="font-body text-xs text-mauve/40 text-center pb-4">
            Esta visão organiza os dados dos seus laudos. Não substitui avaliação profissional nem constitui diagnóstico (RDC 657/2022).
          </p>
        </>
        )
      })()}
    </div>
  )
}

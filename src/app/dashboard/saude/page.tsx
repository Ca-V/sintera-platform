'use client'

// Indicadores de Saúde — landing por BIOMARCADOR (T2-B1a.2 / T2-B1b).
// Visão longitudinal: lista de biomarcadores → drill-down (gráfico temporal +
// exames utilizados). A linha do tempo de exames/documentos/eventos fica no
// Histórico. Lê a view canônica current_biomarkers (não toca o caminho de escrita).
// Linguagem factual — sem juízo clínico (RDC 657/2022).

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Activity, TrendingUp, TrendingDown, Minus, ArrowRight, Search, Loader2, FlaskConical } from 'lucide-react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { toLocalDate } from '@/lib/agenda'
import { useUser } from '@/context/UserContext'
import HistoricoTabs from '@/components/HistoricoTabs'
import { summarizeBiomarkers, computeReferenceIndex, type BiomarkerRow, type BiomarkerSummary, type Trend } from '@/lib/biomarkers/grouping'

const INTERP_CFG: Record<string, { sym: string; cls: string }> = {
  acima_da_referencia:         { sym: '▲', cls: 'text-orange-500' },
  abaixo_da_referencia:        { sym: '▼', cls: 'text-blue-500' },
  dentro_da_referencia:        { sym: '✓', cls: 'text-sage' },
  sem_referencia_identificada: { sym: '–', cls: 'text-mauve/50' },
  indisponivel:                { sym: '–', cls: 'text-mauve/40' },
}

function formatDate(iso: string): string {
  if (!iso) return '—'
  return toLocalDate(iso).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
}

function TrendBadge({ trend, delta }: { trend: Trend; delta: number | null }) {
  if (trend === 'up')
    return <span className="flex items-center gap-1 text-orange-500 font-body text-xs font-semibold"><TrendingUp size={12} /> {delta !== null ? `+${delta}%` : '↑'}</span>
  if (trend === 'down')
    return <span className="flex items-center gap-1 text-blue-500 font-body text-xs font-semibold"><TrendingDown size={12} /> {delta !== null ? `${delta}%` : '↓'}</span>
  if (trend === 'stable')
    return <span className="flex items-center gap-1 text-mauve font-body text-xs"><Minus size={12} /> estável</span>
  if (trend === 'single')
    return <span className="font-body text-xs text-mauve/50">1ª medição</span>
  return <span className="font-body text-xs text-amber-600">unidades ≠</span>
}

export default function IndicadoresPage() {
  const router = useRouter()
  const { user } = useUser()
  const [supabase] = useState(() => createClient() as unknown as SupabaseClient)
  const [rows, setRows] = useState<BiomarkerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!user) return
    let active = true
    ;(async () => {
      const { data, error } = await supabase
        .from('current_biomarkers')
        .select('id,name,value,unit,result_type,reference_min,reference_max,interpretation,reference_source,exam_id,exams(exam_date,created_at)')
        .eq('user_id', user.id)
        .eq('synthetic', false)
        .eq('result_type', 'numeric')
      if (!active) return
      if (error) console.error('[SINTERA] indicadores fetch:', error.message)
      setRows((data ?? []) as unknown as BiomarkerRow[])
      setLoading(false)
    })()
    return () => { active = false }
  }, [user, supabase])

  const summaries = useMemo(() => summarizeBiomarkers(rows), [rows])
  const refIndex = useMemo(() => computeReferenceIndex(rows), [rows])
  const filtered = useMemo(() => {
    if (!search.trim()) return summaries
    const q = search.toLowerCase()
    return summaries.filter(s => s.displayName.toLowerCase().includes(q))
  }, [summaries, search])

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]"><Loader2 size={28} className="animate-spin text-petal" /></div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Módulo Histórico — visão Evolução */}
      <HistoricoTabs active="evolucao" />

      {/* Cabeçalho */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card-premium p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blush flex items-center justify-center flex-shrink-0">
            <Activity size={22} className="text-petal" />
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold text-onyx">Histórico — Evolução</h1>
            <p className="font-body text-sm text-mauve mt-0.5">
              Seus biomarcadores ao longo do tempo — clique para ver a evolução. Sem diagnóstico.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <Link href="/dashboard/medidas" className="px-3.5 py-1.5 rounded-full bg-ivory border border-border text-mauve font-body text-sm hover:border-petal/40 transition-colors">Medidas</Link>
          <Link href="/dashboard/sinais-vitais" className="px-3.5 py-1.5 rounded-full bg-ivory border border-border text-mauve font-body text-sm hover:border-petal/40 transition-colors">Sinais vitais</Link>
        </div>

        {summaries.length > 0 && (
          <div className="mt-4 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mauve/50" />
            <input
              type="text" placeholder="Buscar biomarcador…" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-ivory border border-border rounded-xl font-body text-sm text-onyx placeholder-mauve/40 focus:outline-none focus:ring-1 focus:ring-petal/40"
            />
          </div>
        )}
      </motion.div>

      {summaries.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-premium p-12 text-center">
          <FlaskConical size={40} className="text-border mx-auto mb-3" />
          <p className="font-body text-sm font-semibold text-onyx mb-1">Nenhum indicador disponível ainda</p>
          <p className="font-body text-xs text-mauve mb-5">Extraia os dados de um exame para acompanhar seus biomarcadores aqui.</p>
          <button onClick={() => router.push('/dashboard/exams')}
            className="inline-flex items-center gap-2 gradient-sintera text-white font-body text-sm font-medium px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity">
            Enviar exame
          </button>
        </motion.div>
      ) : (
        <>
          {/* Índice Experimental — proporção dentro da referência por exame (relocado do Histórico, T2-B1b) */}
          {refIndex.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}
              className="card-premium overflow-hidden">
              <div className="px-5 py-3 border-b border-border/40">
                <p className="font-body text-sm font-semibold text-onyx">Proporção dentro da referência</p>
              </div>
              <div className="px-5 py-4 space-y-3">
                {refIndex.map((idx) => {
                  const barColor  = idx.pct >= 80 ? 'bg-sage' : idx.pct >= 60 ? 'bg-amber-400' : 'bg-orange-400'
                  const textColor = idx.pct >= 80 ? 'text-sage' : idx.pct >= 60 ? 'text-amber-600' : 'text-orange-500'
                  return (
                    <div key={idx.examId} className="flex items-center gap-3">
                      <span className="font-body text-xs text-mauve/60 w-14 flex-shrink-0">{formatDate(idx.date)}</span>
                      <div className="flex-1 bg-border/30 rounded-full h-2"><div className={`h-2 rounded-full ${barColor}`} style={{ width: `${idx.pct}%` }} /></div>
                      <span className={`font-body text-sm font-semibold ${textColor} w-10 text-right flex-shrink-0`}>{idx.pct}%</span>
                      <span className="font-body text-xs text-mauve/50 flex-shrink-0">{idx.num}/{idx.den}</span>
                    </div>
                  )
                })}
                <p className="font-body text-[11px] text-mauve/40 pt-1">
                  De cada exame, quantos biomarcadores numéricos estão dentro da faixa do laudo. Experimental; não representa diagnóstico ou estado de saúde.
                </p>
              </div>
            </motion.div>
          )}

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="card-premium overflow-hidden">
            <div className="px-5 py-3 border-b border-border/40 flex items-center justify-between">
              <p className="font-body text-sm font-semibold text-onyx">Biomarcadores</p>
              <span className="font-body text-xs text-mauve/60">{filtered.length} de {summaries.length}</span>
            </div>
            <div className="divide-y divide-border/20">
              {filtered.map((s: BiomarkerSummary) => {
                const interp = INTERP_CFG[s.latest?.interpretation ?? ''] ?? INTERP_CFG.indisponivel
                return (
                  <Link key={s.canonicalName} href={`/dashboard/saude/${encodeURIComponent(s.canonicalName)}`}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-blush/10 transition-colors group">
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm text-onyx truncate group-hover:text-petal transition-colors">{s.displayName}</p>
                      <p className="font-body text-xs text-mauve/60">
                        {s.count} medição{s.count !== 1 ? 'ões' : ''}
                        {s.latest && ` · última ${formatDate(s.latest.date)}`}
                      </p>
                    </div>
                    {s.latest && (
                      <span className="font-body text-sm font-semibold text-onyx flex-shrink-0">
                        {s.latest.value} <span className="text-xs font-normal text-mauve">{s.unit}</span>
                        <span className={`ml-1.5 text-xs font-semibold ${interp.cls}`}>{interp.sym}</span>
                      </span>
                    )}
                    <div className="flex-shrink-0 w-20 text-right hidden sm:block"><TrendBadge trend={s.trend} delta={s.deltaPercent} /></div>
                    <ArrowRight size={15} className="text-mauve/30 group-hover:text-petal transition-colors flex-shrink-0" />
                  </Link>
                )
              })}
            </div>
            {filtered.length === 0 && (
              <div className="px-5 py-8 text-center">
                <p className="font-body text-xs text-mauve">Nenhum biomarcador encontrado.</p>
              </div>
            )}
          </motion.div>

          <p className="font-body text-xs text-mauve/40 text-center pb-4">
            A <Link href="/dashboard/timeline" className="text-petal hover:underline">Linha do Tempo</Link> reúne seus exames, consultas e eventos.
            Esta visão organiza os dados dos laudos; não substitui avaliação profissional nem constitui diagnóstico (RDC 657/2022).
          </p>
        </>
      )}
    </div>
  )
}

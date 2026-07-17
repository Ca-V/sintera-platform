'use client'

// Indicadores de Saúde — landing por BIOMARCADOR (T2-B1a.2 / T2-B1b).
// Visão longitudinal: lista de biomarcadores → drill-down (gráfico temporal +
// exames utilizados). A linha do tempo de exames/documentos/eventos fica no
// Histórico. Lê a view canônica current_biomarkers (não toca o caminho de escrita).
// Linguagem factual — sem juízo clínico (RDC 657/2022).

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Activity, TrendingUp, TrendingDown, Minus, Search, Loader2, FlaskConical } from 'lucide-react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { parseDateOnly } from '@/lib/agenda'
import { useUser } from '@/context/UserContext'
import HistoricoTabs from '@/components/HistoricoTabs'
import ListCard from '@/components/ListCard'
import { summarizeBiomarkers, computeReferenceIndex, type BiomarkerRow, type BiomarkerSummary, type Trend } from '@/lib/biomarkers/grouping'
import { groupByMaterialExam, loadCatalogLabels, type CatalogLabels } from '@/lib/biomarkers/catalogLabels'
import MotionCard from '@/components/ui/MotionCard'
import Disclaimer from '@/components/ui/Disclaimer'

interface CatalogEntry { id: string; specimen: string | null; category: string | null; display_name: string }

const INTERP_CFG: Record<string, { sym: string; cls: string }> = {
  acima_da_referencia:         { sym: '▲', cls: 'text-orange-500' },
  abaixo_da_referencia:        { sym: '▼', cls: 'text-blue-600' },
  dentro_da_referencia:        { sym: '✓', cls: 'text-petal' },
  sem_referencia_identificada: { sym: '–', cls: 'text-mauve' },
  indisponivel:                { sym: '–', cls: 'text-mauve/40' },
}

function formatDate(iso: string): string {
  if (!iso) return '—'
  return parseDateOnly(iso).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
}

function TrendBadge({ trend, delta }: { trend: Trend; delta: number | null }) {
  if (trend === 'up')
    return <span className="flex items-center gap-1 text-orange-500 font-body text-xs font-semibold"><TrendingUp size={12} /> {delta !== null ? `+${delta}%` : '↑'}</span>
  if (trend === 'down')
    return <span className="flex items-center gap-1 text-blue-600 font-body text-xs font-semibold"><TrendingDown size={12} /> {delta !== null ? `${delta}%` : '↓'}</span>
  if (trend === 'stable')
    return <span className="flex items-center gap-1 text-mauve font-body text-xs"><Minus size={12} /> {delta !== null ? `${delta > 0 ? '+' : ''}${delta}%` : '—'}</span>
  if (trend === 'single')
    return <span className="font-body text-xs text-mauve">1ª medição</span>
  return <span className="font-body text-xs text-amber-600">unidades ≠</span>
}

export default function IndicadoresPage() {
  const router = useRouter()
  const { user } = useUser()
  const [supabase] = useState(() => createClient() as unknown as SupabaseClient)
  const [rows, setRows] = useState<BiomarkerRow[]>([])
  const [catalog, setCatalog] = useState<Map<string, CatalogEntry>>(new Map())
  const [labels, setLabels] = useState<CatalogLabels | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!user) return
    let active = true
    ;(async () => {
      const [bio, cat, lbls] = await Promise.all([
        supabase.from('current_biomarkers')
          .select('id,name,value,unit,result_type,reference_min,reference_max,interpretation,reference_source,catalog_id,source_material,source_exam_name,exam_id,exams(exam_date,created_at)')
          .eq('user_id', user.id).eq('synthetic', false).eq('result_type', 'numeric'),
        supabase.from('biomarker_catalog').select('id,specimen,category,display_name'),
        loadCatalogLabels(supabase),
      ])
      if (!active) return
      if (bio.error) console.error('[SINTERA] indicadores fetch:', bio.error.message)
      setRows((bio.data ?? []) as unknown as BiomarkerRow[])
      const cmap = new Map<string, CatalogEntry>()
      for (const c of (cat.data ?? []) as CatalogEntry[]) cmap.set(c.id, c)
      setCatalog(cmap)
      setLabels(lbls)
      setLoading(false)
    })()
    return () => { active = false }
  }, [user, supabase])

  const summaries = useMemo(() => summarizeBiomarkers(rows), [rows])
  const refIndex = useMemo(() => computeReferenceIndex(rows), [rows])
  // Nome curado + material/painel do catálogo (nomenclatura consistente + segmentação).
  const nameOf  = (s: BiomarkerSummary) => catalog.get(s.catalogId ?? '')?.display_name ?? s.displayName
  const panelOf = (s: BiomarkerSummary) => {
    const c = catalog.get(s.catalogId ?? '')
    return { specimen: c?.specimen ?? null, category: c?.category ?? null }
  }
  const filtered = useMemo(() => {
    if (!search.trim()) return summaries
    const q = search.toLowerCase()
    return summaries.filter(s => (catalog.get(s.catalogId ?? '')?.display_name ?? s.displayName).toLowerCase().includes(q))
  }, [summaries, search, catalog])

  if (loading || !labels) return (
    <div className="flex items-center justify-center min-h-[60vh]"><Loader2 size={28} className="animate-spin text-petal" /></div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Módulo Histórico — visão Evolução */}
      <HistoricoTabs active="evolucao" />

      {/* Cabeçalho */}
      <MotionCard initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} padding="lg">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blush flex items-center justify-center flex-shrink-0">
            <Activity size={22} className="text-petal" />
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold text-onyx">Histórico de Exames</h1>
            <p className="font-body text-sm text-mauve mt-0.5">
              Seus exames e biomarcadores ao longo do tempo — clique para ver a evolução. Sem diagnóstico.
            </p>
          </div>
        </div>
        {summaries.length > 0 && (
          <div className="mt-4 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mauve" />
            <input
              type="text" aria-label="Buscar biomarcador" placeholder="Buscar biomarcador…" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-ivory border border-border rounded-xl font-body text-sm text-onyx placeholder-mauve/40 focus:outline-none focus:ring-1 focus:ring-petal/40"
            />
          </div>
        )}
      </MotionCard>

      {summaries.length === 0 ? (
        <MotionCard initial={{ opacity: 0 }} animate={{ opacity: 1 }} padding="2xl" className="text-center">
          <FlaskConical size={40} className="text-border mx-auto mb-3" />
          <p className="font-body text-sm font-semibold text-onyx mb-1">Nenhum indicador disponível ainda</p>
          <p className="font-body text-xs text-mauve mb-5">Extraia os dados de um exame para acompanhar seus biomarcadores aqui.</p>
          <button onClick={() => router.push('/dashboard/exams')}
            className="inline-flex items-center gap-2 gradient-sintera text-white font-body text-sm font-medium px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity">
            Enviar exame
          </button>
        </MotionCard>
      ) : (
        <>
          {/* Índice Experimental — proporção dentro da referência por exame (relocado do Histórico, T2-B1b) */}
          {refIndex.length > 0 && (
            <MotionCard initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}
              padding="none" className="overflow-hidden">
              <div className="px-5 py-3 border-b border-border/40">
                <p className="font-body text-sm font-semibold text-onyx">Proporção dentro da referência</p>
              </div>
              <div className="px-5 py-4 space-y-3">
                {refIndex.map((idx) => {
                  const barColor  = idx.pct >= 80 ? 'bg-petal' : idx.pct >= 60 ? 'bg-amber-400' : 'bg-orange-400'
                  const textColor = idx.pct >= 80 ? 'text-petal' : idx.pct >= 60 ? 'text-amber-600' : 'text-orange-500'
                  return (
                    <div key={idx.examId} className="flex items-center gap-3">
                      <span className="font-body text-xs text-mauve w-14 flex-shrink-0">{formatDate(idx.date)}</span>
                      <div className="flex-1 bg-border/30 rounded-full h-2"><div className={`h-2 rounded-full ${barColor}`} style={{ width: `${idx.pct}%` }} /></div>
                      <span className={`font-body text-sm font-semibold ${textColor} w-10 text-right flex-shrink-0`}>{idx.pct}%</span>
                      <span className="font-body text-xs text-mauve flex-shrink-0">{idx.num}/{idx.den}</span>
                    </div>
                  )
                })}
                <p className="font-body text-[11px] text-mauve/40 pt-1">
                  De cada exame, quantos biomarcadores numéricos estão dentro da faixa do laudo. Experimental; não representa diagnóstico ou estado de saúde.
                </p>
              </div>
            </MotionCard>
          )}

          <MotionCard initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            padding="none" className="overflow-hidden">
            <div className="px-5 py-3 border-b border-border/40 flex items-center justify-between">
              <p className="font-body text-sm font-semibold text-onyx">Biomarcadores</p>
              <span className="font-body text-xs text-mauve">{filtered.length} de {summaries.length}</span>
            </div>
            {groupByMaterialExam(filtered, s => ({ sourceMaterial: s.sourceMaterial ?? null, specimen: panelOf(s).specimen, sourceExamName: s.sourceExamName ?? null }), labels).map(mat => (
              <div key={mat.key}>
                {/* Material (do laudo; fallback do catálogo). Painel fisiológico NÃO segmenta
                    a UI (é do Knowledge Graph). Evolução = série longitudinal. (ING-004) */}
                <div className="px-5 py-2 bg-ivory border-b border-border/40">
                  <h3 className="font-body text-xs font-semibold text-onyx/70 uppercase tracking-wider">{mat.label}</h3>
                </div>
                {mat.exams.map(ex => (
                  <div key={ex.key}>
                    {/* Nome do exame do laudo (quando houver) — dá contexto ao biomarcador
                        (ex.: pH/pO₂/SatO₂ sob "Gasometria venosa"). Ausente → itens diretos. */}
                    {ex.label && (
                      <p className="px-5 pt-2.5 pb-1 font-body text-[11px] font-semibold text-mauve uppercase tracking-wide">{ex.label}</p>
                    )}
                    <div className="space-y-3 px-4 pb-3">
                      {ex.items.map((s) => {
                        const interp = INTERP_CFG[s.latest?.interpretation ?? ''] ?? INTERP_CFG.indisponivel
                        return (
                          <ListCard key={s.canonicalName}
                            title={nameOf(s)}
                            titleHref={`/dashboard/saude/${encodeURIComponent(s.canonicalName)}`}
                            meta={`${s.count} mediç${s.count !== 1 ? 'ões' : 'ão'}${s.latest ? ` · última ${formatDate(s.latest.date)}` : ''}`}
                            trailing={s.latest ? (
                              <span className="font-body text-sm font-semibold text-onyx">
                                {s.latest.value} <span className="text-xs font-normal text-mauve">{s.unit}</span>
                                <span className={`ml-1.5 text-xs font-semibold ${interp.cls}`}>{interp.sym}</span>
                              </span>
                            ) : undefined}
                            chips={<TrendBadge trend={s.trend} delta={s.deltaPercent} />}
                          />
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="px-5 py-8 text-center">
                <p className="font-body text-xs text-mauve">Nenhum biomarcador encontrado.</p>
              </div>
            )}
          </MotionCard>

          <div className="text-center pb-4 space-y-1">
            <p className="font-body text-xs text-mauve/40">
              A <Link href="/dashboard/timeline" className="text-petal hover:underline">Linha do Tempo</Link> reúne seus exames, consultas e eventos.
            </p>
            <Disclaimer variant="geral" className="text-center" />
          </div>
        </>
      )}
    </div>
  )
}

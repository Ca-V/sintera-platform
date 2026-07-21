'use client'

// Histórico de Exames — organizado por EXAME (fundadora 17/07): fluxo Exame → Histórico → Biomarcadores.
// Cada TIPO de exame é o nível primário (como usuários/profissionais consultam); dentro dele, o histórico de
// ocorrências (datas, rastreáveis ao laudo original) e os biomarcadores medidos naquele exame, cada um com
// drill-down (gráfico temporal). Os biomarcadores continuam existindo, mas são acessados A PARTIR do exame —
// nunca o inverso. Lê a view canônica current_biomarkers (não toca o caminho de escrita). RDC 657/2022.

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Activity, TrendingUp, TrendingDown, Minus, Search, Loader2, FlaskConical, FileText } from 'lucide-react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { parseDateOnly } from '@/lib/agenda'
import { useUser } from '@/context/UserContext'
import ListCard from '@/components/ListCard'
import { summarizeBiomarkers, computeReferenceIndex, type BiomarkerRow, type BiomarkerSummary, type Trend } from '@/lib/biomarkers/grouping'
import { groupByExam, loadCatalogLabels, type CatalogLabels } from '@/lib/biomarkers/catalogLabels'
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
function fmtFull(iso: string): string {
  if (!iso) return '—'
  return parseDateOnly(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
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
  // Metadados do laudo por exam_id (derivados; sem duplicação) — laboratório e solicitante do resumo por exame.
  const [examMeta, setExamMeta] = useState<Map<string, { issuer: string | null; requester: string | null }>>(new Map())
  // Todos os exames (para o histórico DOCUMENTAL dos que não têm biomarcadores quantitativos).
  const [exams, setExams] = useState<{ id: string; type: string; date: string; issuer: string | null; requester: string | null }[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!user) return
    let active = true
    ;(async () => {
      const [bio, cat, lbls, ex] = await Promise.all([
        supabase.from('current_biomarkers')
          .select('id,name,value,unit,result_type,reference_min,reference_max,interpretation,reference_source,catalog_id,source_material,source_exam_name,exam_id,exams(exam_date,created_at)')
          .eq('user_id', user.id).eq('synthetic', false).eq('result_type', 'numeric'),
        supabase.from('biomarker_catalog').select('id,specimen,category,display_name'),
        loadCatalogLabels(supabase),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from('exams').select('id, type, exam_date, created_at, issuer, requesting_physician').eq('user_id', user.id),
      ])
      if (!active) return
      if (bio.error) console.error('[SINTERA] indicadores fetch:', bio.error.message)
      setRows((bio.data ?? []) as unknown as BiomarkerRow[])
      const cmap = new Map<string, CatalogEntry>()
      for (const c of (cat.data ?? []) as CatalogEntry[]) cmap.set(c.id, c)
      setCatalog(cmap)
      setLabels(lbls)
      const emap = new Map<string, { issuer: string | null; requester: string | null }>()
      const exList: { id: string; type: string; date: string; issuer: string | null; requester: string | null }[] = []
      for (const e of ((ex?.data ?? []) as Array<Record<string, unknown>>)) {
        const issuer = (e.issuer as string) ?? null, requester = (e.requesting_physician as string) ?? null
        emap.set(e.id as string, { issuer, requester })
        exList.push({
          id: e.id as string, type: ((e.type as string) ?? '').trim() || 'Exame',
          date: ((e.exam_date as string) ?? (e.created_at as string) ?? '').slice(0, 10), issuer, requester,
        })
      }
      setExamMeta(emap)
      setExams(exList)
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
    // Busca por biomarcador OU nome do exame (Exame → Histórico → Biomarcadores).
    return summaries.filter(s =>
      (catalog.get(s.catalogId ?? '')?.display_name ?? s.displayName).toLowerCase().includes(q) ||
      (s.sourceExamName ?? '').toLowerCase().includes(q))
  }, [summaries, search, catalog])
  // Agrupa por EXAME (nível primário). Fallback do specimen via catálogo (mesmo get da Evolução).
  const examGroups = useMemo(
    () => labels ? groupByExam(filtered, s => ({ sourceMaterial: s.sourceMaterial ?? null, specimen: panelOf(s).specimen, sourceExamName: s.sourceExamName ?? null }), labels) : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filtered, labels, catalog],
  )
  // Histórico de um exame: ocorrências distintas (exam_id + data), mais recentes primeiro — rastreável ao laudo.
  const occurrencesOf = (items: BiomarkerSummary[]): { examId: string; date: string }[] => {
    const seen = new Map<string, { examId: string; date: string }>()
    for (const s of items) for (const m of s.measurements) {
      if (!m.examId || !m.date) continue
      const k = `${m.examId}|${m.date}`
      if (!seen.has(k)) seen.set(k, { examId: m.examId, date: m.date })
    }
    return [...seen.values()].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
  }

  // DOCUMENTAL — exames SEM biomarcadores quantitativos: histórico longitudinal por TIPO de exame
  // (nome · nº realizados · datas · abrir cada exame). Modelo GERAL para qualquer categoria (imagem,
  // gráficos, densitometria etc.), sem tratamento específico por tipo. Rastreável ao laudo.
  const biomarkerExamIds = useMemo(() => new Set(rows.map(r => r.exam_id)), [rows])
  const documentalGroups = useMemo(() => {
    const q = search.trim().toLowerCase()
    const docs = exams.filter(e => !biomarkerExamIds.has(e.id))
    const byType = new Map<string, { type: string; occ: { examId: string; date: string }[]; issuer: string | null; requester: string | null }>()
    for (const e of docs) {
      if (!byType.has(e.type)) byType.set(e.type, { type: e.type, occ: [], issuer: null, requester: null })
      byType.get(e.type)!.occ.push({ examId: e.id, date: e.date })
    }
    const list = [...byType.values()].map(g => {
      g.occ.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
      const last = docs.find(e => e.id === g.occ[0].examId)
      return { ...g, issuer: last?.issuer ?? null, requester: last?.requester ?? null }
    }).sort((a, b) => (a.occ[0].date < b.occ[0].date ? 1 : a.occ[0].date > b.occ[0].date ? -1 : 0))
    return q ? list.filter(g => g.type.toLowerCase().includes(q)) : list
  }, [exams, biomarkerExamIds, search])

  if (loading || !labels) return (
    <div className="flex items-center justify-center min-h-[60vh]"><Loader2 size={28} className="animate-spin text-petal" /></div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Módulo Histórico — visão Evolução */}

      {/* Cabeçalho */}
      <MotionCard initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} padding="none" className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blush flex items-center justify-center flex-shrink-0">
            <Activity size={22} className="text-petal" />
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold text-onyx">Histórico de Exames</h1>
            <p className="font-body text-sm text-mauve mt-0.5">
              Todos os seus exames ao longo do tempo — laboratoriais (com evolução e comparação dos biomarcadores)
              e os demais (imagem, gráficos e outros) como histórico documental. Sem diagnóstico.
            </p>
          </div>
        </div>
        {(summaries.length > 0 || exams.length > 0) && (
          <div className="mt-4 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mauve" />
            <input
              type="text" aria-label="Buscar exame ou biomarcador" placeholder="Buscar exame ou biomarcador…" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-ivory border border-border rounded-xl font-body text-sm text-onyx placeholder-mauve/40 focus:outline-none focus:ring-1 focus:ring-petal/40"
            />
          </div>
        )}
      </MotionCard>

      {summaries.length === 0 && exams.length === 0 ? (
        <MotionCard initial={{ opacity: 0 }} animate={{ opacity: 1 }} padding="none" className="p-10 text-center">
          <FlaskConical size={40} className="text-border mx-auto mb-3" />
          <p className="font-body text-sm font-semibold text-onyx mb-1">Nenhum exame ainda</p>
          <p className="font-body text-xs text-mauve mb-5">Adicione um exame — laboratorial ou de imagem — para começar seu histórico.</p>
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

          {/* Exame → Histórico → Biomarcadores: cada EXAME (laboratorial) é um card; dentro dele, o histórico
              de ocorrências (datas, rastreáveis ao laudo) e os biomarcadores medidos naquele exame. */}
          {examGroups.map((g, gi) => {
            const occ = occurrencesOf(g.items)
            // Resumo longitudinal (derivado; sem duplicação): o exame como ENTIDADE ao longo do tempo.
            const total = occ.length
            const lastMeta = total ? examMeta.get(occ[0].examId) : null
            const summary: { label: string; value: string }[] = [
              ...(total ? [{ label: 'Primeira realização', value: fmtFull(occ[total - 1].date) }] : []),
              ...(total ? [{ label: 'Última realização', value: fmtFull(occ[0].date) }] : []),
              { label: 'Total de exames', value: String(total) },
              ...(lastMeta?.issuer ? [{ label: 'Último laboratório', value: lastMeta.issuer }] : []),
              ...(lastMeta?.requester ? [{ label: 'Última solicitação', value: lastMeta.requester }] : []),
            ]
            return (
              <MotionCard key={g.key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + Math.min(gi, 6) * 0.02 }}
                padding="none" className="overflow-hidden">
                <div className="px-5 py-3 border-b border-border/40">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="min-w-0">
                      <p className="font-body text-sm font-semibold text-onyx flex items-center gap-1.5"><FlaskConical size={14} className="text-petal flex-shrink-0" /> {g.label}</p>
                      {g.material && <p className="font-body text-[11px] text-mauve mt-0.5">{g.material}</p>}
                    </div>
                    <span className="font-body text-[11px] text-mauve flex-shrink-0">{g.items.length} biomarcador{g.items.length !== 1 ? 'es' : ''}</span>
                  </div>

                  {/* Resumo longitudinal do exame (entidade ao longo do tempo; tudo derivado dos laudos) */}
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5">
                    {summary.map(s => (
                      <div key={s.label} className="min-w-0">
                        <p className="font-body text-[10px] text-mauve uppercase tracking-wide">{s.label}</p>
                        <p className="font-body text-xs text-onyx font-medium truncate">{s.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Histórico do exame — ocorrências rastreáveis ao laudo original */}
                  {occ.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <span className="font-body text-[11px] text-mauve">Histórico:</span>
                      {occ.map(o => (
                        <Link key={`${o.examId}|${o.date}`} href={`/dashboard/exams/${o.examId}`}
                          className="inline-flex items-center px-2 py-0.5 rounded-full bg-ivory border border-border font-body text-[11px] text-petal hover:border-petal/40 transition-colors">
                          {formatDate(o.date)}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-3 px-4 py-3">
                  {g.items.map((s) => {
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
              </MotionCard>
            )
          })}

          {/* Exames DOCUMENTAIS (sem biomarcadores quantitativos) — histórico longitudinal por tipo. */}
          {documentalGroups.length > 0 && examGroups.length > 0 && (
            <p className="font-body text-[11px] font-semibold text-mauve uppercase tracking-wider pt-1">Outros exames</p>
          )}
          {documentalGroups.map((g, gi) => (
            <MotionCard key={`doc:${g.type}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + Math.min(gi, 6) * 0.02 }}
              padding="none" className="overflow-hidden">
              <div className="px-5 py-4">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="min-w-0">
                    <p className="font-body text-sm font-semibold text-onyx flex items-center gap-1.5"><FileText size={14} className="text-petal flex-shrink-0" /> {g.type}</p>
                    <p className="font-body text-[11px] text-mauve mt-0.5">Histórico documental</p>
                  </div>
                  <span className="font-body text-[11px] text-mauve flex-shrink-0">{g.occ.length} realizaç{g.occ.length !== 1 ? 'ões' : 'ão'}</span>
                </div>

                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5">
                  <div className="min-w-0"><p className="font-body text-[10px] text-mauve uppercase tracking-wide">Primeira realização</p><p className="font-body text-xs text-onyx font-medium truncate">{fmtFull(g.occ[g.occ.length - 1].date)}</p></div>
                  <div className="min-w-0"><p className="font-body text-[10px] text-mauve uppercase tracking-wide">Última realização</p><p className="font-body text-xs text-onyx font-medium truncate">{fmtFull(g.occ[0].date)}</p></div>
                  <div className="min-w-0"><p className="font-body text-[10px] text-mauve uppercase tracking-wide">Total de exames</p><p className="font-body text-xs text-onyx font-medium truncate">{g.occ.length}</p></div>
                  {g.issuer && <div className="min-w-0"><p className="font-body text-[10px] text-mauve uppercase tracking-wide">Último local</p><p className="font-body text-xs text-onyx font-medium truncate">{g.issuer}</p></div>}
                  {g.requester && <div className="min-w-0"><p className="font-body text-[10px] text-mauve uppercase tracking-wide">Última solicitação</p><p className="font-body text-xs text-onyx font-medium truncate">{g.requester}</p></div>}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="font-body text-[11px] text-mauve">Histórico:</span>
                  {g.occ.map(o => (
                    <Link key={o.examId} href={`/dashboard/exams/${o.examId}`}
                      className="inline-flex items-center px-2 py-0.5 rounded-full bg-ivory border border-border font-body text-[11px] text-petal hover:border-petal/40 transition-colors">
                      {o.date ? formatDate(o.date) : 'sem data'}
                    </Link>
                  ))}
                </div>
              </div>
            </MotionCard>
          ))}

          {examGroups.length === 0 && documentalGroups.length === 0 && (
            <MotionCard padding="none" className="p-10 text-center"><p className="font-body text-xs text-mauve">Nenhum exame encontrado.</p></MotionCard>
          )}

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

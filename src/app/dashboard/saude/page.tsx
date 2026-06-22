'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Activity, TrendingUp, TrendingDown, Minus, ArrowRight, Loader2, FlaskConical } from 'lucide-react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/context/UserContext'
import { analyzeSeries } from '@/lib/biomarkers/longitudinal'

// ── Tipos (client genérico: catalog_id e biomarker_catalog não estão nos tipos manuais) ──
interface Row {
  id: string
  name: string
  value: number | null
  value_text: string | null
  unit: string | null
  result_type: string | null
  reference_min: number | null
  reference_max: number | null
  exam_id: string
  exams: { exam_date: string | null; created_at: string } | null
  catalog: { category: string | null; display_name: string | null } | null
}

type RangeStatus = 'within' | 'below' | 'above' | 'no_reference' | 'non_numeric'

// rangeStatus é ARITMÉTICO: compara o valor com o intervalo IMPRESSO no laudo.
// Não é juízo clínico (mesma semântica de src/lib/ai/insights/assembler.ts).
function rangeStatus(r: Row): RangeStatus {
  if (r.result_type !== 'numeric' || r.value === null) return 'non_numeric'
  if (r.reference_min === null && r.reference_max === null) return 'no_reference'
  if (r.reference_min !== null && r.value < r.reference_min) return 'below'
  if (r.reference_max !== null && r.value > r.reference_max) return 'above'
  return 'within'
}

const STATUS_CFG: Record<RangeStatus, { label: string; cls: string; sym: string }> = {
  within:       { label: 'Dentro da faixa',     cls: 'bg-sage-light text-sage',     sym: '✓' },
  below:        { label: 'Abaixo da faixa',      cls: 'bg-blue-50 text-blue-500',    sym: '▼' },
  above:        { label: 'Acima da faixa',       cls: 'bg-orange-50 text-orange-500', sym: '▲' },
  no_reference: { label: 'Sem faixa no laudo',   cls: 'bg-mauve/10 text-mauve',      sym: '–' },
  non_numeric:  { label: 'Resultado descritivo', cls: 'bg-mauve/10 text-mauve',      sym: '–' },
}

const CATEGORY_LABELS: Record<string, string> = {
  hematologia_vermelha:          'Série vermelha',
  hematologia_branca_plaquetas:  'Série branca e plaquetas',
  coagulacao:                    'Coagulação',
  metabolismo_ferro:             'Metabolismo do ferro',
  metabolismo_glicose:           'Metabolismo da glicose',
  funcao_tireoidiana:            'Função tireoidiana',
  inflamacao_imunologia:         'Inflamação e imunologia',
  funcao_hepatica_proteinas:     'Função hepática e proteínas',
  funcao_renal_eletrolitos:      'Função renal e eletrólitos',
  urina_24h:                     'Urina 24h',
  vitaminas_minerais:            'Vitaminas e minerais',
  hormonios_sexuais_reprodutivo: 'Hormônios e reprodução',
  cardiometabolico:              'Cardiometabólico',
  urinalise_eas:                 'Urina (EAS)',
}

function examDate(r: Row): string {
  return r.exams?.exam_date ?? r.exams?.created_at ?? ''
}
function formatDate(iso: string): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}
function normalizeName(n: string): string {
  return n.toLowerCase().replace(/\s+/g, ' ').trim()
}

// ── Tendência factual entre as duas últimas medições (mesma regra do Histórico) ──
type Trend = 'up' | 'down' | 'stable'
interface Highlight {
  name: string
  unit: string
  lastValue: number
  deltaPercent: number | null
  trend: Trend
  count: number
  /** Velocidade relativa: % por mês ao longo de toda a série (FASE 3). null se não calculável. */
  ratePercentPerMonth: number | null
  /** Meses cobertos pela série. */
  monthsSpan: number | null
}

function buildHighlights(rows: Row[]): Highlight[] {
  const byName = new Map<string, Row[]>()
  for (const r of rows) {
    if (r.result_type !== 'numeric' || r.value === null) continue
    const key = normalizeName(r.name)
    if (!byName.has(key)) byName.set(key, [])
    byName.get(key)!.push(r)
  }
  const highlights: Highlight[] = []
  for (const list of byName.values()) {
    const units = [...new Set(list.map(r => r.unit ?? ''))]
    if (units.length > 1) continue // unidades diferentes — não comparável
    const sorted = [...list].sort((a, b) => examDate(a).localeCompare(examDate(b)) || a.id.localeCompare(b.id))
    if (sorted.length < 2) continue
    const last = sorted[sorted.length - 1].value!
    const prev = sorted[sorted.length - 2].value!
    if (prev === 0) continue
    const delta = (last - prev) / Math.abs(prev)
    const trend: Trend = delta > 0.05 ? 'up' : delta < -0.05 ? 'down' : 'stable'
    // Velocidade de mudança (FASE 3): ritmo médio por mês ao longo de toda a série.
    const analysis = analyzeSeries(sorted.map(r => ({ value: r.value!, date: examDate(r) })))
    highlights.push({
      name: sorted[sorted.length - 1].name,
      unit: units[0],
      lastValue: last,
      deltaPercent: Math.round(delta * 100),
      trend,
      count: sorted.length,
      ratePercentPerMonth: analysis?.ratePercentPerMonth != null ? Math.round(analysis.ratePercentPerMonth) : null,
      monthsSpan: analysis?.monthsSpan != null ? Math.round(analysis.monthsSpan) : null,
    })
  }
  // Maior variação absoluta primeiro
  return highlights.sort((a, b) => Math.abs(b.deltaPercent ?? 0) - Math.abs(a.deltaPercent ?? 0))
}

function TrendBadge({ trend, delta }: { trend: Trend; delta: number | null }) {
  if (trend === 'up')
    return <span className="flex items-center gap-1 text-orange-500 font-body text-xs font-semibold">
      <TrendingUp size={12} /> {delta !== null ? `+${delta}% vs anterior` : '↑'}
    </span>
  if (trend === 'down')
    return <span className="flex items-center gap-1 text-blue-500 font-body text-xs font-semibold">
      <TrendingDown size={12} /> {delta !== null ? `${delta}% vs anterior` : '↓'}
    </span>
  return <span className="flex items-center gap-1 text-mauve font-body text-xs">
    <Minus size={12} /> Sem variação significativa
  </span>
}

export default function MinhaSaudePage() {
  const router = useRouter()
  const { user } = useUser()
  const supabase = useRef(createClient() as unknown as SupabaseClient).current
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('biomarkers')
      .select('id,name,value,value_text,unit,result_type,reference_min,reference_max,exam_id,exams(exam_date,created_at),catalog:biomarker_catalog(category,display_name)')
      .eq('user_id', user.id)
      .eq('synthetic', false)
    if (error) console.error('[SINTERA] saude fetch:', error.message)
    setRows((data ?? []) as unknown as Row[])
    setLoading(false)
  }, [user, supabase])

  useEffect(() => { load() }, [load])

  // ── Snapshot do exame mais recente ─────────────────────────────────────
  const snapshot = useMemo(() => {
    if (rows.length === 0) return null
    // exame mais recente por data
    let latestExamId = ''
    let latestDate = ''
    for (const r of rows) {
      const d = examDate(r)
      if (d > latestDate) { latestDate = d; latestExamId = r.exam_id }
    }
    const examRows = rows.filter(r => r.exam_id === latestExamId)

    const counts: Record<RangeStatus, number> = { within: 0, below: 0, above: 0, no_reference: 0, non_numeric: 0 }
    const byCategory = new Map<string, { name: string; value: string; unit: string; status: RangeStatus }[]>()
    for (const r of examRows) {
      const st = rangeStatus(r)
      counts[st]++
      const cat = r.catalog?.category ?? 'outros'
      const display = r.catalog?.display_name ?? r.name
      const valueStr = r.value !== null ? String(r.value) : (r.value_text ?? '—')
      if (!byCategory.has(cat)) byCategory.set(cat, [])
      byCategory.get(cat)!.push({ name: display, value: valueStr, unit: r.unit ?? '', status: st })
    }
    const categories = [...byCategory.entries()]
      .map(([cat, items]) => ({
        cat,
        label: CATEGORY_LABELS[cat] ?? 'Outros',
        items: items.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
      }))
      .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))

    return { date: latestDate, total: examRows.length, counts, categories }
  }, [rows])

  const highlights = useMemo(() => buildHighlights(rows), [rows])

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 size={28} className="animate-spin text-petal" />
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Cabeçalho */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card-premium p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blush flex items-center justify-center flex-shrink-0">
            <Activity size={22} className="text-petal" />
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold text-onyx">Indicadores de saúde</h1>
            <p className="font-body text-sm text-mauve mt-0.5">
              Os valores dos seus exames — organização dos dados do laudo, sem diagnóstico
            </p>
          </div>
        </div>
        {/* Abas: Atual (esta) · Evolução (histórico) */}
        <div className="flex gap-2 mt-4">
          <span className="px-3.5 py-1.5 rounded-full gradient-sintera text-white font-body text-sm font-medium">Atual</span>
          <Link href="/dashboard/historico" className="px-3.5 py-1.5 rounded-full bg-ivory border border-border text-mauve font-body text-sm hover:border-petal/40 transition-colors">Evolução</Link>
        </div>
      </motion.div>

      {!snapshot ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-premium p-12 text-center">
          <FlaskConical size={40} className="text-border mx-auto mb-3" />
          <p className="font-body text-sm font-semibold text-onyx mb-1">Nenhum dado disponível ainda</p>
          <p className="font-body text-xs text-mauve mb-5">Extraia os dados de um exame para ver sua visão geral aqui.</p>
          <button onClick={() => router.push('/dashboard/exams')}
            className="inline-flex items-center gap-2 gradient-sintera text-white font-body text-sm font-medium px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity">
            Enviar exame
          </button>
        </motion.div>
      ) : (
        <>
          {/* Resumo factual do exame mais recente */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="card-premium p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="font-body text-sm font-semibold text-onyx">Exame mais recente</p>
              <span className="font-body text-xs text-mauve/60">{formatDate(snapshot.date)}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {([
                ['within', snapshot.counts.within],
                ['below', snapshot.counts.below],
                ['above', snapshot.counts.above],
                ['no_reference', snapshot.counts.no_reference],
              ] as [RangeStatus, number][]).map(([st, n]) => (
                <div key={st} className="text-center rounded-2xl bg-ivory/60 py-3">
                  <p className="font-display text-2xl font-bold text-onyx">{n}</p>
                  <p className="font-body text-[11px] text-mauve mt-0.5">{STATUS_CFG[st].label}</p>
                </div>
              ))}
            </div>
            <p className="font-body text-[11px] text-mauve/50 mt-3">
              {snapshot.total} biomarcadores medidos · comparação em relação à faixa de referência impressa no laudo.
            </p>
          </motion.div>

          {/* Por categoria */}
          {snapshot.categories.map((c, ci) => (
            <motion.div key={c.cat}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + ci * 0.03 }}
              className="card-premium overflow-hidden">
              <div className="px-5 py-3 border-b border-border/40">
                <p className="font-body text-sm font-semibold text-onyx">{c.label}</p>
              </div>
              <div className="divide-y divide-border/20">
                {c.items.map((it, ii) => {
                  const cfg = STATUS_CFG[it.status]
                  return (
                    <div key={ii} className="flex items-center gap-3 px-5 py-2.5">
                      <span className="font-body text-sm text-onyx flex-1 min-w-0 truncate">{it.name}</span>
                      <span className="font-body text-sm font-semibold text-onyx">{it.value}</span>
                      <span className="font-body text-xs text-mauve flex-shrink-0">{it.unit}</span>
                      <span className={`font-body text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.cls}`}>
                        {cfg.sym} {cfg.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          ))}

          {/* Evolução ao longo do tempo (destaques) */}
          {highlights.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
              className="card-premium overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border/40 flex items-center justify-between">
                <p className="font-body text-sm font-semibold text-onyx">Evolução ao longo do tempo</p>
                <button onClick={() => router.push('/dashboard/historico')}
                  className="font-body text-xs text-petal hover:underline">Ver histórico completo →</button>
              </div>
              <div className="divide-y divide-border/20">
                {highlights.slice(0, 6).map((h, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm text-onyx truncate">{h.name}</p>
                      <p className="font-body text-xs text-mauve/60">
                        {h.count} medições
                        {h.ratePercentPerMonth !== null && ` · ritmo ${h.ratePercentPerMonth > 0 ? '+' : ''}${h.ratePercentPerMonth}%/mês`}
                      </p>
                    </div>
                    <span className="font-body text-sm font-semibold text-onyx flex-shrink-0">
                      {h.lastValue} <span className="text-xs font-normal text-mauve">{h.unit}</span>
                    </span>
                    <div className="flex-shrink-0 w-36 text-right"><TrendBadge trend={h.trend} delta={h.deltaPercent} /></div>
                  </div>
                ))}
              </div>
              <div className="px-5 py-2.5 bg-ivory/40">
                <p className="font-body text-[11px] text-mauve/50">
                  Variação entre as duas últimas medições e ritmo médio no período — métricas factuais. Não indicam melhora ou piora clínica.
                </p>
              </div>
            </motion.div>
          )}

          {/* Atalho ao histórico, se não houver destaques */}
          {highlights.length === 0 && (
            <button onClick={() => router.push('/dashboard/historico')}
              className="card-premium p-5 w-full text-left flex items-center gap-4 hover:shadow-md transition-shadow group">
              <div className="w-10 h-10 rounded-2xl bg-sage-light flex items-center justify-center flex-shrink-0">
                <TrendingUp size={18} className="text-sage" />
              </div>
              <div className="flex-1">
                <p className="font-body text-sm font-semibold text-onyx">Histórico de biomarcadores</p>
                <p className="font-body text-xs text-mauve mt-0.5">A comparação ao longo do tempo aparece quando há 2+ exames</p>
              </div>
              <ArrowRight size={15} className="text-mauve/40 group-hover:text-sage transition-colors flex-shrink-0" />
            </button>
          )}

          <p className="font-body text-xs text-mauve/40 text-center pb-4">
            Esta visão organiza os dados dos seus laudos para facilitar a compreensão e a conversa com seu médico.
            Não substitui avaliação profissional nem constitui diagnóstico (RDC 657/2022).
          </p>
        </>
      )}
    </div>
  )
}

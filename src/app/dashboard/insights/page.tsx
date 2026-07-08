'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, TrendingUp, FlaskConical, ArrowRight, ThumbsUp, ThumbsDown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/context/UserContext'
import Card from '@/components/ui/Card'

// ai_insights tem colunas de governança que não estão nos tipos manuais
// (ver supabase/types.generated.ts). Definimos a forma que consumimos aqui.
interface InsightRow {
  id: string
  insight: string
  category: string | null
  priority: string | null
  clinical_flag: string | null
  template_key: string | null
  source: string | null
  created_at: string | null
  synthetic: boolean
}

const FLAG_CONFIG: Record<string, { label: string; cls: string }> = {
  atencao_imediata: { label: 'Atenção', cls: 'bg-red-50 text-red-500 border-red-200' },
  acompanhar:       { label: 'Acompanhar', cls: 'bg-warm text-gold border-amber-200' },
  normal:           { label: 'Dentro do esperado', cls: 'bg-sage-light text-sage border-sage/20' },
}

const SOURCE_LABEL: Record<string, string> = {
  rule_based:   'Baseado em regra clínica',
  ai_generated: 'Gerado por IA',
  clinician:    'Revisado por profissional',
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function InsightsPage() {
  const router = useRouter()
  const { user } = useUser()
  // Client genérico: ai_insights tem colunas além dos tipos manuais.
  const supabase = useRef(createClient() as unknown as SupabaseClient).current

  const [insights, setInsights] = useState<InsightRow[]>([])
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState<Record<string, 'util' | 'nao_util'>>({})
  const [feedbackBusy, setFeedbackBusy] = useState<Record<string, boolean>>({})

  // Modo demonstração: SÓ com ?demo=1. Usuárias reais nunca veem dados synthetic.
  const [demoMode, setDemoMode] = useState(false)
  const [generating, setGenerating] = useState(false)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- leitura única do query param (demo) na montagem
      setDemoMode(new URLSearchParams(window.location.search).get('demo') === '1')
    }
  }, [])

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('ai_insights')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (error) console.error('[SINTERA] insights fetch:', error.message)
    const all = (data ?? []) as unknown as InsightRow[]
    // Modo demo mostra os insights de demonstração (synthetic, source=demo_factual);
    // modo normal mostra só os reais (synthetic=false).
    const rows = demoMode
      ? all.filter(r => r.source === 'demo_factual')
      : all.filter(r => r.synthetic === false)
    setInsights(rows)
    setLoading(false)
  }, [user, supabase, demoMode])

  // eslint-disable-next-line react-hooks/set-state-in-effect -- carrega dados na montagem (data fetching)
  useEffect(() => { load() }, [load])

  async function generateDemo() {
    if (generating) return
    setGenerating(true)
    try {
      const res = await fetch('/api/insights/demo', { method: 'POST' })
      if (res.ok) await load()
    } catch {
      // silencioso — demonstração é não-crítica
    } finally {
      setGenerating(false)
    }
  }

  async function sendFeedback(id: string, rating: 'util' | 'nao_util') {
    if (feedbackBusy[id] || feedback[id]) return
    setFeedbackBusy(prev => ({ ...prev, [id]: true }))
    try {
      const res = await fetch(`/api/insights/${id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating }),
      })
      if (res.ok) setFeedback(prev => ({ ...prev, [id]: rating }))
    } catch {
      // silencioso — feedback é não-crítico
    } finally {
      setFeedbackBusy(prev => ({ ...prev, [id]: false }))
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-semibold text-onyx mb-1">Insights</h1>
        <p className="font-body text-sm text-mauve">Organização dos seus dados de saúde — sem diagnóstico</p>
      </motion.div>

      {demoMode && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border-2 border-dashed border-petal/40 bg-blush/30 px-5 py-4 space-y-3">
          <div>
            <p className="font-body text-sm font-semibold text-petal">Modo demonstração — sem validação clínica</p>
            <p className="font-body text-xs text-mauve mt-1 leading-relaxed">
              Os itens abaixo são <strong>factuais</strong>: apenas indicam se o valor está acima ou abaixo
              da faixa impressa no seu laudo. Não há classificação nem juízo clínico — isso só será habilitado
              após a aprovação do Responsável Clínico. Não visível para usuárias reais.
            </p>
          </div>
          <button onClick={generateDemo} disabled={generating}
            className="font-body text-xs font-medium px-4 py-2 rounded-full gradient-sintera text-white disabled:opacity-50 hover:opacity-90 transition-opacity">
            {generating ? 'Gerando…' : 'Gerar demonstração factual dos meus exames'}
          </button>
        </motion.div>
      )}

      {loading ? (
        <Card padding="2xl" className="text-center">
          <p className="font-body text-sm text-mauve">Carregando…</p>
        </Card>
      ) : insights.length === 0 ? (
        // ── Estado vazio honesto ─────────────────────────────────────────────
        <>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="card-premium p-10 text-center">
            <div className="w-16 h-16 rounded-2xl gradient-sintera-soft flex items-center justify-center mx-auto mb-5">
              <Sparkles size={28} className="text-petal" />
            </div>
            <h2 className="font-display text-xl font-semibold text-onyx mb-2">Você ainda não tem insights</h2>
            <p className="font-body text-sm text-mauve max-w-sm mx-auto leading-relaxed">
              Os insights aparecem aqui após a extração dos seus exames, quando há regras clínicas
              aprovadas para os seus biomarcadores — sempre como organização de informação, nunca
              como diagnóstico.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button onClick={() => router.push('/dashboard/historico')}
              className="card-premium p-5 text-left flex items-center gap-4 hover:shadow-md transition-shadow group">
              <div className="w-10 h-10 rounded-2xl bg-sage-light flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <TrendingUp size={18} className="text-sage" />
              </div>
              <div className="flex-1">
                <p className="font-body text-sm font-semibold text-onyx">Histórico de biomarcadores</p>
                <p className="font-body text-xs text-mauve mt-0.5">Evolução temporal dos seus resultados</p>
              </div>
              <ArrowRight size={14} className="text-mauve/40 group-hover:text-sage transition-colors flex-shrink-0" />
            </button>

            <button onClick={() => router.push('/dashboard/exams')}
              className="card-premium p-5 text-left flex items-center gap-4 hover:shadow-md transition-shadow group">
              <div className="w-10 h-10 rounded-2xl bg-blush flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <FlaskConical size={18} className="text-petal" />
              </div>
              <div className="flex-1">
                <p className="font-body text-sm font-semibold text-onyx">Meus exames</p>
                <p className="font-body text-xs text-mauve mt-0.5">Todos os laudos processados pela IA</p>
              </div>
              <ArrowRight size={14} className="text-mauve/40 group-hover:text-petal transition-colors flex-shrink-0" />
            </button>
          </motion.div>
        </>
      ) : (
        // ── Lista de insights ───────────────────────────────────────────
        <div className="space-y-3">
          {insights.map((it, i) => {
            const flag = it.clinical_flag ? FLAG_CONFIG[it.clinical_flag] : null
            const origin = (it.source && SOURCE_LABEL[it.source]) || 'Organização de dados'
            const sent = feedback[it.id]
            return (
              <motion.div key={it.id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="card-premium p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  {flag && (
                    <span className={`font-body text-xs font-semibold px-2.5 py-1 rounded-full border ${flag.cls}`}>
                      {flag.label}
                    </span>
                  )}
                  <span className="font-body text-xs text-mauve/60 ml-auto">{formatDate(it.created_at)}</span>
                </div>

                <p className="font-body text-sm text-onyx leading-relaxed">{it.insight}</p>

                <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-mauve/10">
                  <span className="font-body text-xs text-mauve/70">{origin}</span>
                  {sent ? (
                    <span className="font-body text-xs text-sage">Obrigada pelo retorno</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="font-body text-xs text-mauve/60">Foi útil?</span>
                      <button aria-label="Útil" disabled={feedbackBusy[it.id]}
                        onClick={() => sendFeedback(it.id, 'util')}
                        className="w-7 h-7 rounded-lg bg-sage-light flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50">
                        <ThumbsUp size={13} className="text-sage" />
                      </button>
                      <button aria-label="Não útil" disabled={feedbackBusy[it.id]}
                        onClick={() => sendFeedback(it.id, 'nao_util')}
                        className="w-7 h-7 rounded-lg bg-mauve/10 flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50">
                        <ThumbsDown size={13} className="text-mauve" />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
            <p className="font-body text-xs text-amber-700 leading-relaxed">
              Os insights organizam seus dados para facilitar a compreensão e a conversa com seu médico.
              Não substituem avaliação profissional nem constituem diagnóstico (RDC 657/2022).
            </p>
          </motion.div>
        </div>
      )}
    </div>
  )
}

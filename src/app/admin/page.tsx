'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  FileText, CheckCircle, AlertCircle, FlaskConical,
  MessageCircle, Flag, TrendingUp, Upload, RefreshCw, Loader2, Send, Plus, X, Clock,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/context/UserContext'

// E-mail autorizado a acessar o dashboard operacional
const ADMIN_EMAIL = 'carinaleite.br@gmail.com'

interface Stats {
  totalUsers: number
  totalExams: number
  processedExams: number
  failedExams: number
  pendingExams: number
  totalBiomarkers: number
  feedbacksRecebidos: number
  problemasReportados: number
  uploads7d: number
  uploads24h: number
  taxaSucesso: number
}

interface RecentEvent {
  id: string
  event_name: string
  created_at: string
  metadata: Record<string, unknown> | null
}

interface FeedbackRow {
  comprehension: string | null
  trust: string | null
  action_taken: string | null
  created_at: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function StatCard({ icon: Icon, label, value, sub, color, bg }: {
  icon: React.ElementType; label: string; value: string | number
  sub?: string; color: string; bg: string
}) {
  return (
    <div className="card-premium p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
          <Icon size={16} className={color} />
        </div>
      </div>
      <p className="font-display text-2xl font-bold text-onyx">{value}</p>
      <p className="font-body text-xs font-semibold text-onyx/60 mt-0.5">{label}</p>
      {sub && <p className="font-body text-xs text-mauve/60 mt-0.5">{sub}</p>}
    </div>
  )
}

export default function AdminPage() {
  const { user, loading: authLoading } = useUser()
  const router  = useRouter()
  const supabase = useRef(createClient()).current

  // ── Lista de espera ───────────────────────────────────────────────────────
  type WaitlistEntry = { id: string; name: string; email: string; created_at: string }
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([])

  const [stats, setStats]         = useState<Stats | null>(null)
  const [recentEvents, setEvents]  = useState<RecentEvent[]>([])
  const [feedbacks, setFeedbacks]  = useState<FeedbackRow[]>([])
  const [loading, setLoading]      = useState(true)
  const [lastUpdated, setUpdated]  = useState<Date | null>(null)

  // ── E-mail de boas-vindas ──────────────────────────────────────────────────
  type Recipient = { email: string; firstName: string }
  const [recipients, setRecipients]   = useState<Recipient[]>([{ email: '', firstName: '' }])
  const [adminSecret, setAdminSecret] = useState('')
  const [emailLoading, setEmailLoad]  = useState(false)
  const [emailResult, setEmailResult] = useState<{ sent: number; failed: number } | null>(null)
  const [emailError, setEmailError]   = useState<string | null>(null)

  function addRecipient() {
    setRecipients(r => [...r, { email: '', firstName: '' }])
  }
  function removeRecipient(i: number) {
    setRecipients(r => r.filter((_, idx) => idx !== i))
  }
  function updateRecipient(i: number, field: keyof Recipient, value: string) {
    setRecipients(r => r.map((rec, idx) => idx === i ? { ...rec, [field]: value } : rec))
  }

  async function sendWelcomeEmails() {
    const valid = recipients.filter(r => r.email.includes('@'))
    if (valid.length === 0 || !adminSecret) return
    setEmailLoad(true)
    setEmailResult(null)
    setEmailError(null)
    try {
      const res = await fetch('/api/email/welcome', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': adminSecret },
        body:    JSON.stringify({ recipients: valid }),
      })
      const json = await res.json() as { sent?: number; failed?: number; error?: string }
      if (!res.ok) throw new Error(json.error ?? 'Erro ao enviar')
      setEmailResult({ sent: json.sent ?? 0, failed: json.failed ?? 0 })
    } catch (e) {
      setEmailError(e instanceof Error ? e.message : 'Erro desconhecido')
    } finally {
      setEmailLoad(false)
    }
  }

  // Auth guard
  useEffect(() => {
    if (!authLoading && (!user || user.email !== ADMIN_EMAIL)) {
      router.replace('/dashboard')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user?.email === ADMIN_EMAIL) loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- roda quando user muda; loadData intencionalmente fora das deps
  }, [user])

  async function loadData() {
    setLoading(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: waitlistData } = await (supabase as any)
        .from('waitlist').select('id,name,email,created_at').order('created_at', { ascending: false })
      setWaitlist((waitlistData ?? []) as WaitlistEntry[])

      const [
        { count: totalExams },
        { count: processed },
        { count: failed },
        { count: pending },
        { count: totalBio },
        { count: feedbackCount },
        { count: problemas },
        { count: uploads7d },
        { count: uploads24h },
        { data: eventsData },
        { data: feedbackData },
      ] = await Promise.all([
        supabase.from('exams').select('*', { count: 'exact', head: true }),
        supabase.from('exams').select('*', { count: 'exact', head: true }).eq('status', 'processed'),
        supabase.from('exams').select('*', { count: 'exact', head: true }).eq('status', 'error'),
        supabase.from('exams').select('*', { count: 'exact', head: true }).in('status', ['pending', 'processing']),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from('current_biomarkers').select('*', { count: 'exact', head: true }).eq('synthetic', false),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from('feedback_responses').select('*', { count: 'exact', head: true }).not('comprehension', 'is', null),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from('usage_events').select('*', { count: 'exact', head: true }).eq('event_name', 'problema_reportado'),
        supabase.from('exams').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
        supabase.from('exams').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 86400000).toISOString()),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from('usage_events').select('id,event_name,created_at,metadata').order('created_at', { ascending: false }).limit(20),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from('feedback_responses').select('comprehension,trust,action_taken,created_at').not('comprehension', 'is', null).order('created_at', { ascending: false }).limit(20),
      ])

      const t = totalExams ?? 0
      const p = processed ?? 0
      setStats({
        totalUsers:          0, // auth.users não acessível pelo client
        totalExams:          t,
        processedExams:      p,
        failedExams:         failed ?? 0,
        pendingExams:        pending ?? 0,
        totalBiomarkers:     totalBio ?? 0,
        feedbacksRecebidos:  feedbackCount ?? 0,
        problemasReportados: problemas ?? 0,
        uploads7d:           uploads7d ?? 0,
        uploads24h:          uploads24h ?? 0,
        taxaSucesso:         t > 0 ? Math.round((p / t) * 100) : 0,
      })
      setEvents((eventsData ?? []) as RecentEvent[])
      setFeedbacks((feedbackData ?? []) as FeedbackRow[])
      setUpdated(new Date())
    } catch (e) {
      console.error('[admin] loadData error:', e)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || !user || user.email !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <Loader2 size={28} className="animate-spin text-petal" />
      </div>
    )
  }

  // Distribuição de feedback
  const comprMap: Record<string, number> = {}
  const trustMap: Record<string, number> = {}
  const actionMap: Record<string, number> = {}
  feedbacks.forEach(f => {
    if (f.comprehension) comprMap[f.comprehension] = (comprMap[f.comprehension] ?? 0) + 1
    if (f.trust) trustMap[f.trust] = (trustMap[f.trust] ?? 0) + 1
    if (f.action_taken) actionMap[f.action_taken] = (actionMap[f.action_taken] ?? 0) + 1
  })

  const eventLabels: Record<string, string> = {
    exam_detail_viewed:    '👁 Exame visualizado',
    exam_analyzed_success: '✅ Análise concluída',
    historico_viewed:      '📈 Histórico acessado',
    feedback_submitted:    '💬 Feedback enviado',
    problema_reportado:    '🚩 Problema reportado',
    perfil_segmentacao:    '👤 Segmentação preenchida',
  }

  return (
    <div className="min-h-screen bg-cream px-6 py-10">
      <div className="max-w-5xl mx-auto space-y-7">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-onyx mb-1">Dashboard Operacional</h1>
            <p className="font-body text-sm text-mauve">
              {lastUpdated ? `Atualizado ${formatDate(lastUpdated.toISOString())}` : 'Carregando…'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a href="/admin/catalogo"
              className="flex items-center gap-2 border border-border text-mauve font-body text-sm px-4 py-2 rounded-full hover:border-petal/40 hover:text-petal transition-colors">
              <FlaskConical size={14} />
              Catálogo
            </a>
            <button onClick={loadData} disabled={loading}
              className="flex items-center gap-2 border border-border text-mauve font-body text-sm px-4 py-2 rounded-full hover:border-petal/40 hover:text-petal transition-colors disabled:opacity-50">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Atualizar
            </button>
          </div>
        </div>

        {loading && !stats ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-petal" />
          </div>
        ) : stats && (
          <>
            {/* Cards de métricas */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard icon={FileText}     label="Exames totais"      value={stats.totalExams}     color="text-petal"    bg="bg-blush" />
              <StatCard icon={CheckCircle}  label="Analisados"         value={stats.processedExams} sub={`${stats.taxaSucesso}% taxa de sucesso`} color="text-sage"  bg="bg-sage-light" />
              <StatCard icon={AlertCircle}  label="Com erro"           value={stats.failedExams}    color="text-red-400"  bg="bg-red-50" />
              <StatCard icon={FlaskConical} label="Biomarcadores"      value={stats.totalBiomarkers} color="text-lavender" bg="bg-lavender-light" />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard icon={Upload}       label="Uploads (24h)"    value={stats.uploads24h}          color="text-petal"  bg="bg-blush" />
              <StatCard icon={Upload}       label="Uploads (7 dias)" value={stats.uploads7d}            color="text-gold"   bg="bg-warm" />
              <StatCard icon={MessageCircle} label="Feedbacks P2"    value={stats.feedbacksRecebidos}   color="text-sage"   bg="bg-sage-light" />
              <StatCard icon={Flag}         label="Problemas reportados" value={stats.problemasReportados} color="text-red-400" bg="bg-red-50" />
            </motion.div>

            <div className="grid md:grid-cols-2 gap-5">

              {/* Distribuição de feedback P2 */}
              {feedbacks.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  className="card-premium p-6 space-y-4">
                  <h2 className="font-body text-sm font-semibold text-onyx">Feedback P2 — Distribuição</h2>

                  {[
                    { label: 'Compreensão', map: comprMap, opts: [['sim','Entendeu melhor'], ['parcialmente','Parcialmente'], ['nao','Não mudou']] },
                    { label: 'Confiança',   map: trustMap, opts: [['sim_confio','Confia'], ['algumas_duvidas','Com dúvidas'], ['nao_tenho_certeza','Não sabe']] },
                    { label: 'Ação gerada', map: actionMap, opts: [['sim','Sim'], ['nao','Não'], ['ainda_nao_decidi','Ainda não']] },
                  ].map(({ label, map, opts }) => {
                    const total = Object.values(map).reduce((a, b) => a + b, 0)
                    if (total === 0) return null
                    return (
                      <div key={label}>
                        <p className="font-body text-xs text-mauve/60 uppercase tracking-wider mb-2">{label}</p>
                        <div className="space-y-1.5">
                          {opts.map(([key, name]) => {
                            const count = map[key] ?? 0
                            const pct   = total > 0 ? Math.round((count / total) * 100) : 0
                            return (
                              <div key={key} className="flex items-center gap-2">
                                <span className="font-body text-xs text-mauve w-28">{name}</span>
                                <div className="flex-1 h-1.5 bg-border/30 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full bg-petal" style={{ width: `${pct}%` }} />
                                </div>
                                <span className="font-body text-xs text-onyx w-8 text-right">{count}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </motion.div>
              )}

              {/* Eventos recentes */}
              {recentEvents.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  className="card-premium overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-border/40">
                    <h2 className="font-body text-sm font-semibold text-onyx">Eventos recentes</h2>
                  </div>
                  <div className="divide-y divide-border/20 max-h-80 overflow-y-auto">
                    {recentEvents.map(ev => (
                      <div key={ev.id} className="flex items-center justify-between px-5 py-2.5 gap-3">
                        <span className="font-body text-xs text-onyx flex-1">
                          {eventLabels[ev.event_name] ?? ev.event_name}
                        </span>
                        <span className="font-body text-[10px] text-mauve/50 flex-shrink-0">
                          {formatDate(ev.created_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Exames pendentes */}
            {stats.pendingExams > 0 && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 flex items-center gap-3">
                <Loader2 size={16} className="text-amber-500 flex-shrink-0 animate-spin" />
                <p className="font-body text-xs text-amber-800">
                  <strong>{stats.pendingExams}</strong> exame{stats.pendingExams !== 1 ? 's' : ''} aguardando análise ou em processamento.
                </p>
              </div>
            )}

            {/* Estado vazio */}
            {stats.totalExams === 0 && (
              <div className="card-premium p-10 text-center">
                <TrendingUp size={32} className="text-border mx-auto mb-3" />
                <p className="font-body text-sm font-semibold text-onyx mb-1">Nenhum dado ainda</p>
                <p className="font-body text-xs text-mauve">As métricas aparecerão assim que as primeiras usuárias começarem a usar a plataforma.</p>
              </div>
            )}
          </>
        )}

        {/* ── Lista de espera ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="card-premium overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-mauve" />
              <h2 className="font-body text-sm font-semibold text-onyx">Lista de espera</h2>
            </div>
            <span className="font-body text-xs text-mauve/60 bg-ivory border border-border px-2.5 py-0.5 rounded-full">
              {waitlist.length} cadastro{waitlist.length !== 1 ? 's' : ''}
            </span>
          </div>
          {waitlist.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="font-body text-xs text-mauve/50">Nenhum cadastro ainda.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/20 max-h-64 overflow-y-auto">
              {waitlist.map(w => (
                <div key={w.id} className="flex items-center justify-between px-5 py-2.5 gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-xs font-medium text-onyx truncate">{w.name}</p>
                    <p className="font-body text-[11px] text-mauve/60 truncate">{w.email}</p>
                  </div>
                  <span className="font-body text-[10px] text-mauve/40 flex-shrink-0">
                    {formatDate(w.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* ── E-mail de boas-vindas ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="card-premium p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blush flex items-center justify-center">
              <Send size={14} className="text-petal" />
            </div>
            <h2 className="font-body text-sm font-semibold text-onyx">Enviar e-mail de boas-vindas</h2>
          </div>

          {/* Lista de destinatárias */}
          <div className="space-y-2">
            {recipients.map((r, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  aria-label={`Nome da destinatária ${i + 1}`}
                  placeholder="Nome"
                  value={r.firstName}
                  onChange={e => updateRecipient(i, 'firstName', e.target.value)}
                  className="w-28 px-3 py-2 border border-border rounded-xl font-body text-xs text-onyx focus:outline-none focus:ring-1 focus:ring-petal/30 bg-ivory"
                />
                <input
                  type="email"
                  aria-label={`E-mail da destinatária ${i + 1}`}
                  placeholder="email@exemplo.com"
                  value={r.email}
                  onChange={e => updateRecipient(i, 'email', e.target.value)}
                  className="flex-1 px-3 py-2 border border-border rounded-xl font-body text-xs text-onyx focus:outline-none focus:ring-1 focus:ring-petal/30 bg-ivory"
                />
                {recipients.length > 1 && (
                  <button onClick={() => removeRecipient(i)}
                    className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-mauve hover:border-red-200 hover:text-red-400 transition-colors flex-shrink-0">
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button onClick={addRecipient}
            className="flex items-center gap-1.5 font-body text-xs text-mauve hover:text-petal transition-colors">
            <Plus size={12} /> Adicionar destinatária
          </button>

          {/* Secret de admin */}
          <input
            type="password"
            aria-label="Admin secret"
            placeholder="Admin secret (ADMIN_SECRET do .env)"
            value={adminSecret}
            onChange={e => setAdminSecret(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-xl font-body text-xs text-onyx focus:outline-none focus:ring-1 focus:ring-petal/30 bg-ivory"
          />

          {/* Resultado / erro */}
          {emailResult && (
            <div className="rounded-xl bg-sage-light px-4 py-3 font-body text-xs text-sage">
              <strong>{emailResult.sent}</strong> e-mail{emailResult.sent !== 1 ? 's' : ''} enviado{emailResult.sent !== 1 ? 's' : ''} com sucesso
              {emailResult.failed > 0 && <span className="text-red-500 ml-2">· {emailResult.failed} falha{emailResult.failed !== 1 ? 's' : ''}</span>}
            </div>
          )}
          {emailError && (
            <p className="font-body text-xs text-red-500">{emailError}</p>
          )}

          <button
            onClick={sendWelcomeEmails}
            disabled={emailLoading || recipients.every(r => !r.email.includes('@')) || !adminSecret}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full gradient-sintera text-white font-body text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity">
            {emailLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {emailLoading ? 'Enviando…' : 'Enviar boas-vindas'}
          </button>
        </motion.div>

      </div>
    </div>
  )
}

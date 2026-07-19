'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  FileText, Clock, Pill, ScrollText, CalendarDays, Receipt,
  Upload, CheckCircle, AlertCircle, FlaskConical, Bell, ChevronRight, FilePlus, X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { parseDateOnly } from '@/lib/agenda'
import { useModalA11y } from '@/lib/ui/useModalA11y'
import { navDescription } from '@/lib/ui/navDescriptions'
import { useUser } from '@/context/UserContext'
import AgendarModal, { type AgendaEventInput } from '@/components/AgendarModal'
import { useEventForm } from '@/components/eventForm'
import RegistrationHub from '@/components/RegistrationHub'
import DashboardEntry from '@/components/entry/DashboardEntry'
import Card from '@/components/ui/Card'
import MotionCard from '@/components/ui/MotionCard'
import ActionCard from '@/components/ui/ActionCard'

interface ExamSummary {
  id: string
  type: string | null
  status: string
  created_at: string
  exam_date: string | null
}

interface Stats {
  totalExams: number
  processedExams: number
  totalBiomarkers: number
  pendingExams: number
}

function formatDate(iso: string) {
  return parseDateOnly(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  processed:  { label: 'Dados extraídos', color: 'text-petal',     bg: 'bg-blush',     icon: CheckCircle },
  pending:    { label: 'Aguardando',      color: 'text-gold',     bg: 'bg-warm',           icon: Clock       },
  processing: { label: 'Processando',     color: 'text-lavender', bg: 'bg-lavender-light', icon: Clock       },
  error:      { label: 'Erro',            color: 'text-red-400',  bg: 'bg-red-50',         icon: AlertCircle },
}

// Acesso rápido — usa exatamente a nomenclatura do menu lateral esquerdo (FB-010).
// Descrições vêm do SSOT @/lib/ui/navDescriptions (mesma voz da Sidebar).
const QUICK_ACCESS: { href: string; icon: React.ElementType; label: string; tile: string; tint: string }[] = [
  { href: '/dashboard/timeline',     icon: Clock,       label: 'Histórico de Saúde', tile: 'bg-blush',          tint: 'text-petal' },
  { href: '/dashboard/agenda',       icon: CalendarDays,label: 'Agenda',             tile: 'bg-warm',           tint: 'text-gold' },
  { href: '/dashboard/exams',        icon: FileText,    label: 'Exames',             tile: 'bg-blush',          tint: 'text-petal' },
  { href: '/dashboard/medicamentos', icon: Pill,        label: 'Medicamentos',       tile: 'bg-blush',          tint: 'text-petal' },
  { href: '/dashboard/relatorio',    icon: ScrollText,  label: 'Relatórios',         tile: 'bg-lavender-light', tint: 'text-lavender' },
  { href: '/dashboard/gastos',       icon: Receipt,     label: 'Despesas',           tile: 'bg-blush',          tint: 'text-petal' },
]

// Passo 7 (cutover) — a rota decide legacy × v2 pelo Entry. Default: legacy
// (RENDER_CONFIG/ENV). Flip por página via NEXT_PUBLIC_DASHBOARD_V2=true.
export default function DashboardRoute() {
  return <DashboardEntry legacy={<LegacyDashboard />} />
}

function LegacyDashboard() {
  const { user, profile } = useUser()
  const router   = useRouter()
  const supabase = useRef(createClient()).current
  const { saveEvent, services } = useEventForm()

  const [stats, setStats]         = useState<Stats | null>(null)
  const [recentExams, setRecent]   = useState<ExamSummary[]>([])
  const [journey, setJourney]     = useState<{ count: number; last: { title: string; date: string } | null; next: { title: string; date: string } | null }>({ count: 0, last: null, next: null })
  const [loading, setLoading]     = useState(true)
  const [agendarOpen, setAgendar] = useState(false)
  const [intakeOpen, setIntakeOpen] = useState(false)
  const intakeRef = useRef<HTMLDivElement>(null)
  useModalA11y(intakeRef, () => setIntakeOpen(false), intakeOpen)

  // Guia "Como usar a SINTERA" — orientação de primeiros passos no Painel Inicial. Dispensável (localStorage).
  const [showGuide, setShowGuide] = useState(false)
  useEffect(() => { if (typeof window !== 'undefined' && localStorage.getItem('sintera:dash:guide') !== 'off') setShowGuide(true) }, [])
  function dismissGuide() { try { localStorage.setItem('sintera:dash:guide', 'off') } catch { /* ignore */ } setShowGuide(false) }

  const hour        = new Date().getHours()
  const greeting    = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
  const displayName = profile?.name?.split(' ')[0] ?? 'por aqui'

  async function loadData() {
    setLoading(true)

    const [examsResult, bioResult, journeyResult, nextEvent] = await Promise.all([
      supabase.from('exams').select('id,type,status,created_at,exam_date').eq('user_id', user!.id).order('exam_date', { ascending: false, nullsFirst: false }),
      supabase.from('current_biomarkers').select('id', { count: 'exact', head: true }).eq('user_id', user!.id).eq('synthetic', false),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from('health_events').select('title,event_date', { count: 'exact' }).eq('user_id', user!.id).eq('synthetic', false).order('event_date', { ascending: false }).limit(1),
      // "Agenda · próximo" usa a FONTE ÚNICA do domínio (mesma da Agenda) — nunca
      // uma query própria, para Dashboard e Agenda jamais divergirem (REV-04).
      services.query.nextUpcoming(user!.id),
    ])

    const exams = (examsResult.data ?? []) as ExamSummary[]
    const totalBiomarkers = bioResult.count ?? 0
    const lastEvent = ((journeyResult.data ?? []) as Array<{ title: string; event_date: string }>)[0]
    setJourney({
      count: journeyResult.count ?? 0,
      last: lastEvent ? { title: lastEvent.title, date: lastEvent.event_date } : null,
      next: nextEvent ? { title: nextEvent.title, date: nextEvent.date } : null,
    })

    setStats({
      totalExams:     exams.length,
      processedExams: exams.filter(e => e.status === 'processed').length,
      totalBiomarkers,
      pendingExams:   exams.filter(e => e.status === 'pending' || e.status === 'processing').length,
    })
    setRecent(exams.slice(0, 4))
    setLoading(false)
  }

  useEffect(() => {
    if (!user) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // "Agendar" salva na Agenda pelo MESMO caminho dos demais módulos (não só exporta).
  async function handleAgendarSave(input: AgendaEventInput) {
    if (!user) return
    await saveEvent(user.id, input, null)
    setAgendar(false); await loadData()
  }

  const isEmpty = !loading && stats?.totalExams === 0 && journey.count === 0

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Saudação */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-semibold text-onyx">
          {greeting}, {displayName} 👋
        </h1>
        <p className="font-body text-sm text-mauve mt-1">
          Uma plataforma para organizar, registrar e acompanhar suas informações de saúde ao longo do tempo, preservando o histórico e a rastreabilidade de cada registro.
        </p>
      </motion.div>

      {/* Como usar a SINTERA — orientação de primeiros passos (dispensável) */}
      {showGuide && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.01 }}>
          <MotionCard padding="lg" className="relative border border-petal/15 bg-blush/15">
            <button onClick={dismissGuide} aria-label="Dispensar"
              className="absolute top-3 right-3 text-mauve/50 hover:text-onyx transition-colors"><X size={15} /></button>
            <p className="font-display text-base font-semibold text-onyx mb-1">Como usar a SINTERA</p>
            <p className="font-body text-xs text-mauve mb-4 max-w-2xl">
              A SINTERA reúne e organiza suas informações de saúde num só lugar — ela transcreve e organiza, não
              interpreta nem diagnostica. Veja como começar em 4 passos:
            </p>
            <div className="grid sm:grid-cols-2 gap-2.5">
              {[
                { icon: Upload,     title: '1. Adicione seus documentos', desc: 'Envie exames, receitas e laudos (foto ou arquivo) — a SINTERA lê e organiza.', onClick: () => setIntakeOpen(true) },
                { icon: Pill,       title: '2. Registre a sua rotina de saúde', desc: 'Medicamentos, consultas, condições, hábitos e medidas.', href: '/dashboard/medicamentos' },
                { icon: Clock,      title: '3. Acompanhe ao longo do tempo', desc: 'Sua linha do tempo em Histórico de Saúde e a evolução em Histórico de Exames.', href: '/dashboard/timeline' },
                { icon: ScrollText, title: '4. Compartilhe com quem cuida de você', desc: 'Reúna suas informações em um relatório e envie ao seu profissional de saúde.', href: '/dashboard/relatorio' },
              ].map((s) => {
                const Icon = s.icon
                const inner = (
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-white/60 border border-border/60 hover:border-petal/40 transition-colors h-full">
                    <div className="w-8 h-8 rounded-lg bg-blush flex items-center justify-center flex-shrink-0"><Icon size={15} className="text-petal" /></div>
                    <div className="min-w-0">
                      <p className="font-body text-xs font-semibold text-onyx">{s.title}</p>
                      <p className="font-body text-[11px] text-mauve mt-0.5 leading-snug">{s.desc}</p>
                    </div>
                  </div>
                )
                return s.href
                  ? <Link key={s.title} href={s.href} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-petal/40 rounded-xl">{inner}</Link>
                  : <button key={s.title} onClick={s.onClick} className="block text-left w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-petal/40 rounded-xl">{inner}</button>
              })}
            </div>
          </MotionCard>
        </motion.div>
      )}

      {/* Centro de Entrada — entrada unificada de documentos */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.02 }}>
        <ActionCard onClick={() => setIntakeOpen(true)} padding="sm"
          className="flex items-center gap-3 group">
          <div className="w-11 h-11 rounded-2xl gradient-sintera flex items-center justify-center flex-shrink-0">
            <FilePlus size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-body text-sm font-semibold text-onyx">Adicionar registro</p>
            <p className="font-body text-xs text-mauve mt-0.5">Registre qualquer informação de saúde num só lugar — exame, medicamento, consulta, medida e mais</p>
          </div>
          <ChevronRight size={18} className="text-mauve/30 group-hover:text-petal transition-colors flex-shrink-0" />
        </ActionCard>
      </motion.div>

      {/* ───────────────────────── Destaques (o mais importante, no topo) ───────────────────────── */}

      {/* Próximo na Agenda — sensível ao tempo */}
      {!loading && journey.next && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}>
          <ActionCard onClick={() => router.push('/dashboard/agenda')} padding="md"
            className="flex items-center gap-4 group gradient-sintera-soft">
            <div className="w-12 h-12 rounded-2xl bg-white/70 flex items-center justify-center flex-shrink-0">
              <CalendarDays size={22} className="text-petal" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-body text-[11px] font-medium uppercase tracking-wider text-petal">Agenda · próximo</p>
              <p className="font-body text-sm font-semibold text-onyx break-words mt-0.5">{journey.next.title}</p>
              <p className="font-body text-xs text-mauve mt-0.5">{formatDate(journey.next.date)}</p>
            </div>
            <ChevronRight size={18} className="text-petal/50 group-hover:text-petal transition-colors flex-shrink-0" />
          </ActionCard>
        </motion.div>
      )}

      {/* Exames aguardando extração — sensível ao tempo */}
      {!loading && stats && stats.pendingExams > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
          <ActionCard onClick={() => router.push('/dashboard/exams')} padding="sm"
            className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-warm flex items-center justify-center flex-shrink-0">
              <Bell size={16} className="text-gold" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-body text-sm font-semibold text-onyx">
                {stats.pendingExams} exame{stats.pendingExams !== 1 ? 's' : ''} aguardando extração
              </p>
              <p className="font-body text-xs text-mauve mt-0.5">Em Exames</p>
            </div>
            <ChevronRight size={16} className="text-mauve/40 group-hover:text-gold transition-colors flex-shrink-0" />
          </ActionCard>
        </motion.div>
      )}

      {/* ───────────────────────── Estado vazio ───────────────────────── */}
      {isEmpty && (
        <MotionCard initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          padding="2xl" className="text-center">
          <div className="w-16 h-16 rounded-2xl gradient-sintera-soft flex items-center justify-center mx-auto mb-4">
            <Upload size={28} className="text-petal" />
          </div>
          <h2 className="font-display text-lg font-semibold text-onyx mb-2">Comece a organizar a sua saúde</h2>
          <p className="font-body text-sm text-mauve max-w-sm mx-auto mb-6">
            Registre um exame, um medicamento, uma consulta ou qualquer informação — a SINTERA organiza tudo para você acompanhar ao longo do tempo.
          </p>
          <button
            onClick={() => setIntakeOpen(true)}
            className="inline-flex items-center gap-2 gradient-sintera text-white font-body text-sm font-medium px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity shadow-sm">
            <FilePlus size={15} /> Adicionar registro
          </button>
        </MotionCard>
      )}

      {/* ───────────────────────── Acesso rápido (nomenclatura do menu) ───────────────────────── */}
      {!isEmpty && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <div className="flex items-center justify-between mb-2.5">
            <p className="font-body text-sm font-semibold text-onyx">Acesso rápido</p>
            <button onClick={() => setAgendar(true)}
              className="inline-flex items-center gap-1.5 font-body text-xs font-medium text-petal hover:underline">
              <Bell size={13} /> Criar lembrete
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {QUICK_ACCESS.map(card => {
              const Icon = card.icon
              return (
                <ActionCard key={card.href}
                  onClick={() => router.push(card.href)}
                  padding="sm" className="flex flex-col gap-2.5 group">
                  <div className={`w-10 h-10 rounded-2xl ${card.tile} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                    <Icon size={19} className={card.tint} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-body text-sm font-semibold text-onyx leading-tight">{card.label}</p>
                    <p className="font-body text-xs text-mauve mt-0.5">{navDescription(card.href)}</p>
                  </div>
                </ActionCard>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* ───────────────────────── Resumo (números) ───────────────────────── */}
      {!isEmpty && !loading && stats && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <p className="font-body text-sm font-semibold text-onyx mb-2.5">Resumo</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card padding="sm" className="text-center">
              <div className="w-9 h-9 rounded-xl bg-blush flex items-center justify-center mx-auto mb-2">
                <FileText size={17} className="text-petal" />
              </div>
              <p className="font-display text-2xl font-bold text-onyx">{stats.totalExams}</p>
              <p className="font-body text-xs text-mauve mt-0.5">Exame{stats.totalExams !== 1 ? 's' : ''}</p>
            </Card>
            <Card padding="sm" className="text-center">
              <div className="w-9 h-9 rounded-xl bg-blush flex items-center justify-center mx-auto mb-2">
                <CheckCircle size={17} className="text-petal" />
              </div>
              <p className="font-display text-2xl font-bold text-onyx">{stats.processedExams}</p>
              <p className="font-body text-xs text-mauve mt-0.5">Extraído{stats.processedExams !== 1 ? 's' : ''}</p>
            </Card>
            <Card padding="sm" className="text-center">
              <div className="w-9 h-9 rounded-xl bg-lavender-light flex items-center justify-center mx-auto mb-2">
                <FlaskConical size={17} className="text-lavender" />
              </div>
              <p className="font-display text-2xl font-bold text-onyx">{stats.totalBiomarkers}</p>
              <p className="font-body text-xs text-mauve mt-0.5">Biomarcadores</p>
            </Card>
            <Card padding="sm" className="text-center">
              <div className="w-9 h-9 rounded-xl bg-warm flex items-center justify-center mx-auto mb-2">
                <Clock size={17} className="text-gold" />
              </div>
              <p className="font-display text-2xl font-bold text-onyx">{stats.pendingExams}</p>
              <p className="font-body text-xs text-mauve mt-0.5">Aguardando</p>
            </Card>
          </div>
        </motion.div>
      )}

      {/* ───────────────────────── Exames recentes ───────────────────────── */}
      {!isEmpty && !loading && recentExams.length > 0 && (
        <MotionCard initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
          padding="none" className="overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border/40 flex items-center justify-between">
            <p className="font-body text-sm font-semibold text-onyx">Exames recentes</p>
            <button onClick={() => router.push('/dashboard/exams')}
              className="font-body text-xs text-petal hover:underline">
              Ver todos →
            </button>
          </div>
          <div className="divide-y divide-border/30">
            {recentExams.map((exam) => {
              const cfg  = STATUS_CONFIG[exam.status] ?? STATUS_CONFIG.pending
              const Icon = cfg.icon
              return (
                <button key={exam.id}
                  onClick={() => router.push('/dashboard/exams/' + exam.id)}
                  className="w-full flex items-start gap-3 px-5 py-3.5 hover:bg-blush/20 transition-colors text-left">
                  <div className="w-8 h-8 rounded-xl bg-blush flex items-center justify-center flex-shrink-0">
                    <FileText size={15} className="text-petal" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm font-medium text-onyx break-words line-clamp-2">{exam.type ?? 'Exame'}</p>
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      <p className="font-body text-xs text-mauve">Realizado em {formatDate(exam.exam_date ?? exam.created_at)}</p>
                      <span className={`inline-flex items-center gap-1 text-[11px] font-body font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                        <Icon size={9} />
                        {cfg.label}
                      </span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </MotionCard>
      )}

      {/* AgendarModal — salva na Agenda (caminho único) e oferece exportar depois */}
      <AgendarModal
        open={agendarOpen}
        onClose={() => setAgendar(false)}
        onSave={handleAgendarSave}
        onGoToHistory={() => router.push('/dashboard/timeline')}
      />

      {/* HUB-001 — Hub de Registro (ponto único de entrada): "O que você deseja registrar?" */}
      {intakeOpen && (
        <div ref={intakeRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="O que você deseja registrar?"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-onyx/30 backdrop-blur-sm outline-none"
          onClick={() => setIntakeOpen(false)}>
          <Card padding="lg" className="w-full max-w-md max-h-[88vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-end -mt-1 -mr-1 mb-1">
              <button onClick={() => setIntakeOpen(false)} aria-label="Fechar"
                className="text-mauve/40 hover:text-onyx transition-colors"><X size={18} /></button>
            </div>
            <RegistrationHub onDone={() => setIntakeOpen(false)} />
          </Card>
        </div>
      )}

    </div>
  )
}

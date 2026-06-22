'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  FileText, TrendingUp, Upload,
  CheckCircle, Clock, AlertCircle, ArrowRight, FlaskConical, CalendarDays,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/context/UserContext'
import AgendarModal from '@/components/AgendarModal'

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
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  processed:  { label: 'Dados extraídos',   color: 'text-sage',     bg: 'bg-sage-light',     icon: CheckCircle },
  pending:    { label: 'Aguardando',  color: 'text-gold',     bg: 'bg-warm',           icon: Clock       },
  processing: { label: 'Processando', color: 'text-lavender', bg: 'bg-lavender-light', icon: Clock       },
  error:      { label: 'Erro',        color: 'text-red-400',  bg: 'bg-red-50',         icon: AlertCircle },
}

export default function DashboardPage() {
  const { user, profile } = useUser()
  const router   = useRouter()
  const supabase = useRef(createClient()).current

  const [stats, setStats]         = useState<Stats | null>(null)
  const [recentExams, setRecent]   = useState<ExamSummary[]>([])
  const [journey, setJourney]     = useState<{ count: number; last: { title: string; date: string } | null; next: { title: string; date: string } | null }>({ count: 0, last: null, next: null })
  const [loading, setLoading]     = useState(true)
  const [agendarOpen, setAgendar] = useState(false)

  const hour        = new Date().getHours()
  const greeting    = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
  const displayName = profile?.name?.split(' ')[0] ?? 'por aqui'

  useEffect(() => {
    if (!user) return
    loadData()
  }, [user])

  async function loadData() {
    setLoading(true)

    const todayISO = new Date().toISOString().slice(0, 10)
    const [examsResult, bioResult, journeyResult, nextResult] = await Promise.all([
      supabase.from('exams').select('id,type,status,created_at,exam_date').eq('user_id', user!.id).order('exam_date', { ascending: false, nullsFirst: false }),
      supabase.from('biomarkers').select('id', { count: 'exact', head: true }).eq('user_id', user!.id).eq('synthetic', false),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from('health_events').select('title,event_date', { count: 'exact' }).eq('user_id', user!.id).eq('synthetic', false).order('event_date', { ascending: false }).limit(1),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from('health_events').select('title,event_date').eq('user_id', user!.id).eq('synthetic', false).gte('event_date', todayISO).order('event_date', { ascending: true }).limit(1),
    ])

    const exams = (examsResult.data ?? []) as ExamSummary[]
    const totalBiomarkers = bioResult.count ?? 0
    const lastEvent = ((journeyResult.data ?? []) as Array<{ title: string; event_date: string }>)[0]
    const nextEvent = ((nextResult.data ?? []) as Array<{ title: string; event_date: string }>)[0]
    setJourney({
      count: journeyResult.count ?? 0,
      last: lastEvent ? { title: lastEvent.title, date: lastEvent.event_date } : null,
      next: nextEvent ? { title: nextEvent.title, date: nextEvent.event_date } : null,
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

  return (
    <div className="max-w-4xl mx-auto space-y-5">

      {/* Saudação */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-semibold text-onyx">
          {greeting}, {displayName} 👋
        </h1>
        <p className="font-body text-sm text-mauve mt-1">
          Seus dados de saúde organizados em um lugar só.
        </p>
      </motion.div>

      {/* Cards de estatísticas */}
      {!loading && stats && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3">

          <div className="card-premium p-4 text-center">
            <div className="w-9 h-9 rounded-xl bg-blush flex items-center justify-center mx-auto mb-2">
              <FileText size={17} className="text-petal" />
            </div>
            <p className="font-display text-2xl font-bold text-onyx">{stats.totalExams}</p>
            <p className="font-body text-xs text-mauve mt-0.5">Exame{stats.totalExams !== 1 ? 's' : ''}</p>
          </div>

          <div className="card-premium p-4 text-center">
            <div className="w-9 h-9 rounded-xl bg-sage-light flex items-center justify-center mx-auto mb-2">
              <CheckCircle size={17} className="text-sage" />
            </div>
            <p className="font-display text-2xl font-bold text-onyx">{stats.processedExams}</p>
            <p className="font-body text-xs text-mauve mt-0.5">Extraído{stats.processedExams !== 1 ? 's' : ''}</p>
          </div>

          <div className="card-premium p-4 text-center">
            <div className="w-9 h-9 rounded-xl bg-lavender-light flex items-center justify-center mx-auto mb-2">
              <FlaskConical size={17} className="text-lavender" />
            </div>
            <p className="font-display text-2xl font-bold text-onyx">{stats.totalBiomarkers}</p>
            <p className="font-body text-xs text-mauve mt-0.5">Biomarcadores</p>
          </div>

          <div className="card-premium p-4 text-center">
            <div className="w-9 h-9 rounded-xl bg-warm flex items-center justify-center mx-auto mb-2">
              <TrendingUp size={17} className="text-gold" />
            </div>
            <p className="font-display text-2xl font-bold text-onyx">{stats.pendingExams}</p>
            <p className="font-body text-xs text-mauve mt-0.5">Aguardando</p>
          </div>
        </motion.div>
      )}

      {/* Estado vazio — nenhum exame e nenhuma jornada ainda */}
      {!loading && stats?.totalExams === 0 && journey.count === 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="card-premium p-10 text-center">
          <div className="w-16 h-16 rounded-2xl gradient-sintera-soft flex items-center justify-center mx-auto mb-4">
            <Upload size={28} className="text-petal" />
          </div>
          <h2 className="font-display text-lg font-semibold text-onyx mb-2">Comece enviando seu primeiro exame</h2>
          <p className="font-body text-sm text-mauve max-w-sm mx-auto mb-6">
            Faça upload de um laudo em PDF e a SINTERA extrai automaticamente todos os biomarcadores via IA.
          </p>
          <button
            onClick={() => router.push('/dashboard/exams')}
            className="inline-flex items-center gap-2 gradient-sintera text-white font-body text-sm font-medium px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity shadow-sm">
            <Upload size={15} /> Enviar exame
          </button>
        </motion.div>
      )}

      {/* Ações rápidas */}
      {!loading && stats && (stats.totalExams > 0 || journey.count > 0) && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3">

          <button
            onClick={() => router.push('/dashboard/exams')}
            className="card-premium p-5 text-left flex items-center gap-4 hover:shadow-md transition-shadow group">
            <div className="w-11 h-11 rounded-2xl gradient-sintera-soft flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <Upload size={20} className="text-petal" />
            </div>
            <div className="flex-1">
              <p className="font-body text-sm font-semibold text-onyx">Enviar novo exame</p>
              <p className="font-body text-xs text-mauve mt-0.5">Upload de PDF · extração automática</p>
            </div>
            <ArrowRight size={15} className="text-mauve/40 group-hover:text-petal transition-colors flex-shrink-0" />
          </button>

          <button
            onClick={() => router.push('/dashboard/historico')}
            className="card-premium p-5 text-left flex items-center gap-4 hover:shadow-md transition-shadow group">
            <div className="w-11 h-11 rounded-2xl bg-sage-light flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <TrendingUp size={20} className="text-sage" />
            </div>
            <div className="flex-1">
              <p className="font-body text-sm font-semibold text-onyx">Ver histórico</p>
              <p className="font-body text-xs text-mauve mt-0.5">Evolução dos seus biomarcadores</p>
            </div>
            <ArrowRight size={15} className="text-mauve/40 group-hover:text-sage transition-colors flex-shrink-0" />
          </button>

          <button
            onClick={() => setAgendar(true)}
            className="card-premium p-5 text-left flex items-center gap-4 hover:shadow-md transition-shadow group">
            <div className="w-11 h-11 rounded-2xl bg-lavender-light flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <CalendarDays size={20} className="text-lavender" />
            </div>
            <div className="flex-1">
              <p className="font-body text-sm font-semibold text-onyx">Criar lembrete de consulta ou exame</p>
              <p className="font-body text-xs text-mauve mt-0.5">Adiciona ao Google, Outlook ou .ics</p>
            </div>
            <ArrowRight size={15} className="text-mauve/40 group-hover:text-lavender transition-colors flex-shrink-0" />
          </button>

          <button
            onClick={() => router.push('/dashboard/timeline')}
            className="card-premium p-5 text-left flex items-center gap-4 hover:shadow-md transition-shadow group">
            <div className="w-11 h-11 rounded-2xl bg-blush flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <Clock size={20} className="text-petal" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-body text-sm font-semibold text-onyx">Minha Jornada</p>
              <p className="font-body text-xs text-mauve mt-0.5 truncate">
                {journey.next ? `Próximo: ${journey.next.title} · ${formatDate(journey.next.date)}`
                  : journey.last ? `Último: ${journey.last.title}`
                  : 'Registre consultas, vacinas e procedimentos'}
              </p>
            </div>
            <ArrowRight size={15} className="text-mauve/40 group-hover:text-petal transition-colors flex-shrink-0" />
          </button>
        </motion.div>
      )}

      {/* Exames recentes */}
      {!loading && recentExams.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="card-premium overflow-hidden">
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
                  className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-blush/20 transition-colors text-left">
                  <div className="w-8 h-8 rounded-xl bg-blush flex items-center justify-center flex-shrink-0">
                    <FileText size={15} className="text-petal" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm font-medium text-onyx truncate">{exam.type ?? 'Exame'}</p>
                    <p className="font-body text-xs text-mauve">Realizado em {formatDate(exam.exam_date ?? exam.created_at)}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-body font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${cfg.bg} ${cfg.color}`}>
                    <Icon size={10} />
                    {cfg.label}
                  </span>
                </button>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* AgendarModal */}
      <AgendarModal open={agendarOpen} onClose={() => setAgendar(false)} />

    </div>
  )
}

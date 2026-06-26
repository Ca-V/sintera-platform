'use client'

// Agenda — eventos FUTUROS da jornada de saúde (projeção do domínio HealthEvent).
// Consome SÓ o contrato @/lib/agenda (services), nunca o banco. O Histórico é a
// projeção dos eventos passados. Sem juízo clínico (RDC 657/2022).

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays, Plus, Check, Pencil, Ban, Loader2, CalendarClock, Sparkles, X } from 'lucide-react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import AgendarModal, { type AgendaEventInput, type EventType } from '@/components/AgendarModal'
import { buildExamRecencySuggestion, type AgendaSuggestion } from '@/lib/agenda/suggestions'
import { eventServicesFor, typeLabel, statusLabel, formatDateBR, formatTimeBR, type HealthEvent } from '@/lib/agenda'

const MODAL_TYPES: EventType[] = ['exame', 'consulta', 'retorno', 'medicacao', 'outro']
const toModalType = (t: string): EventType => (MODAL_TYPES as string[]).includes(t) ? (t as EventType) : 'outro'

const TYPE_EMOJI: Record<string, string> = {
  exame: '🧪', consulta: '👩‍⚕️', retorno: '📋', vacina: '💉', procedimento: '🩺',
  medicacao: '💊', medicamento: '💊', atividade: '🏃‍♀️', outro: '📅',
}

const STATUS_CLS: Record<string, string> = {
  planejado: 'bg-mauve/10 text-mauve', confirmado: 'bg-blue-50 text-blue-500',
  realizado: 'bg-sage-light text-sage', cancelado: 'bg-red-50 text-red-400',
  reagendado: 'bg-amber-50 text-amber-600', perdido: 'bg-red-50 text-red-400',
}

export default function AgendaPage() {
  const [supabase] = useState(() => createClient() as unknown as SupabaseClient)
  const services = useMemo(() => eventServicesFor(supabase), [supabase])

  const [userId, setUserId]   = useState<string | null>(null)
  const [events, setEvents]   = useState<HealthEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId]   = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing]     = useState<HealthEvent | null>(null)
  const [prefill, setPrefill]     = useState<Partial<AgendaEventInput> | undefined>(undefined)
  const [suggestion, setSuggestion] = useState<AgendaSuggestion | null>(null)
  const [dismissed, setDismissed]   = useState(false)

  useEffect(() => {
    let active = true
    ;(async () => {
      const { data: auth } = await supabase.auth.getUser()
      if (!active) return
      const uid = auth.user?.id ?? null
      setUserId(uid)
      if (!uid) { setLoading(false); return }
      const upcoming = await services.query.listUpcoming(uid)
      if (!active) return
      setEvents(upcoming)
      const { data: examData } = await supabase.from('exams').select('type, exam_date, status, created_at').eq('user_id', uid)
      if (!active) return
      const examsLite = (examData ?? []).map(e => {
        const r = e as { type: string | null; exam_date: string | null; status: string | null; created_at: string | null }
        return { type: r.type, status: r.status, date: (r.exam_date ?? r.created_at ?? '').slice(0, 10) }
      })
      setSuggestion(buildExamRecencySuggestion(examsLite, upcoming.some(e => e.type === 'exame')))
      setLoading(false)
    })()
    return () => { active = false }
  }, [supabase, services, reloadKey])

  const reload = () => setReloadKey(k => k + 1)

  async function onComplete(ev: HealthEvent) {
    if (!userId) return
    setBusyId(ev.id)
    try { await services.command.complete(userId, ev) } catch (e) { console.error('[SINTERA] complete:', e) }
    reload(); setBusyId(null)
  }
  async function onCancel(ev: HealthEvent) {
    if (!userId) return
    setBusyId(ev.id)
    try { await services.command.cancel(userId, ev) } catch (e) { console.error('[SINTERA] cancel:', e) }
    reload(); setBusyId(null)
  }

  async function handleSave(input: AgendaEventInput) {
    if (!userId) return
    await services.command.create(userId, {
      ...(editing ? { id: editing.id } : {}),
      type: input.eventType, title: input.title, date: input.date,
      time: input.time || null, durationMin: input.durationMin, notes: input.notes || null,
      reminderEnabled: input.reminderEnabled,
      status: editing?.status ?? 'planejado', source: editing?.source ?? 'manual',
    })
    setEditing(null); setModalOpen(false); setPrefill(undefined); reload()
  }

  function openAdd() { setEditing(null); setPrefill(undefined); setModalOpen(true) }
  function openEdit(ev: HealthEvent) { setEditing(ev); setPrefill(undefined); setModalOpen(true) }
  function openFromSuggestion(s: AgendaSuggestion) {
    setEditing(null); setPrefill({ eventType: s.suggestedEventType, title: s.suggestedTitle }); setModalOpen(true)
  }

  const today = new Date().toISOString().slice(0, 10)
  const editingInitial: Partial<AgendaEventInput> | undefined = editing
    ? {
        eventType: toModalType(editing.type), title: editing.title, date: editing.date,
        time: formatTimeBR(editing.time) ?? '08:00', durationMin: editing.durationMin ?? 60,
        notes: editing.notes ?? '', reminderEnabled: editing.reminderEnabled,
      }
    : prefill

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-onyx mb-1">Agenda</h1>
          <p className="font-body text-sm text-mauve">Seus próximos exames, consultas e retornos. O que já aconteceu fica no Histórico.</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-sintera text-white text-sm font-body font-medium hover:opacity-90 transition-opacity flex-shrink-0">
          <Plus size={16} /> Adicionar
        </button>
      </motion.div>

      {!loading && suggestion && !dismissed && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="card-premium p-4 flex items-start gap-3 border border-petal/20 bg-blush/20">
          <div className="w-9 h-9 rounded-2xl gradient-sintera-soft flex items-center justify-center flex-shrink-0">
            <Sparkles size={17} className="text-petal" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-body text-sm text-onyx leading-relaxed">{suggestion.message}</p>
            <button onClick={() => openFromSuggestion(suggestion)}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg gradient-sintera text-white text-xs font-body font-medium hover:opacity-90 transition-opacity">
              <Plus size={13} /> Registrar lembrete
            </button>
          </div>
          <button onClick={() => setDismissed(true)} title="Dispensar"
            className="p-1.5 rounded-lg text-mauve/50 hover:text-mauve hover:bg-white/50 transition-colors flex-shrink-0">
            <X size={15} />
          </button>
        </motion.div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-mauve"><Loader2 size={22} className="animate-spin" /></div>
      ) : events.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card-premium p-10 text-center">
          <div className="w-16 h-16 rounded-2xl gradient-sintera-soft flex items-center justify-center mx-auto mb-5">
            <CalendarDays size={28} className="text-petal" />
          </div>
          <h2 className="font-display text-lg font-semibold text-onyx mb-2">Nenhum evento futuro</h2>
          <p className="font-body text-sm text-mauve max-w-sm mx-auto leading-relaxed mb-5">
            Adicione um exame, consulta ou retorno para acompanhar seus próximos passos.
          </p>
          <button onClick={openAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-sintera text-white text-sm font-body font-medium hover:opacity-90 transition-opacity">
            <Plus size={16} /> Adicionar primeiro evento
          </button>
        </motion.div>
      ) : (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <CalendarClock size={15} className="text-petal" />
            <h2 className="font-body text-sm font-semibold text-onyx">Próximos ({events.length})</h2>
          </div>
          {events.map(ev => {
            const overdue = ev.date < today
            return (
              <motion.div key={ev.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="card-premium p-4 flex items-start gap-3">
                <div className="text-xl leading-none mt-0.5">{TYPE_EMOJI[ev.type] ?? '📅'}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-body text-sm font-semibold text-onyx truncate">{ev.title}</p>
                    <span className={`font-body text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_CLS[ev.status] ?? 'bg-mauve/10 text-mauve'}`}>{statusLabel(ev.status)}</span>
                  </div>
                  <p className="font-body text-xs text-mauve mt-0.5">
                    {typeLabel(ev.type)} · {formatDateBR(ev.date)}{formatTimeBR(ev.time) ? ` · ${formatTimeBR(ev.time)}` : ''}
                    {overdue && <span className="ml-2 text-petal font-medium">atrasado</span>}
                  </p>
                  {ev.notes && <p className="font-body text-xs text-mauve/70 mt-1 line-clamp-2">{ev.notes}</p>}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => onComplete(ev)} disabled={busyId === ev.id} title="Concluir"
                    className="p-2 rounded-lg text-mauve hover:text-sage hover:bg-sage-light transition-colors disabled:opacity-40">
                    {busyId === ev.id ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                  </button>
                  <button onClick={() => openEdit(ev)} title="Editar / exportar"
                    className="p-2 rounded-lg text-mauve hover:text-petal hover:bg-blush/40 transition-colors">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => onCancel(ev)} disabled={busyId === ev.id} title="Cancelar"
                    className="p-2 rounded-lg text-mauve hover:text-red-400 hover:bg-red-500/8 transition-colors disabled:opacity-40">
                    <Ban size={15} />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </section>
      )}

      <p className="font-body text-[11px] text-mauve/50 text-center leading-relaxed px-4">
        A SINTERA organiza seus eventos de saúde. Não oferece diagnóstico nem orientação clínica.
      </p>

      <AgendarModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); setPrefill(undefined) }}
        onSave={handleSave}
        initialEvent={editingInitial}
      />
    </div>
  )
}

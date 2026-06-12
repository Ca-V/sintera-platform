'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays, Plus, Check, Pencil, Trash2, Loader2, CalendarClock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import AgendarModal, { type AgendaEventInput, type EventType } from '@/components/AgendarModal'

interface AgendaEvent {
  id: string
  event_type: EventType
  title: string
  event_date: string          // YYYY-MM-DD
  event_time: string | null   // HH:mm[:ss]
  duration_min: number | null
  notes: string | null
  status: 'pending' | 'done' | 'cancelled'
  reminder_enabled: boolean
}

const TYPE_META: Record<EventType, { label: string; emoji: string }> = {
  exame:     { label: 'Exame',     emoji: '🧪' },
  consulta:  { label: 'Consulta',  emoji: '👩‍⚕️' },
  retorno:   { label: 'Retorno',   emoji: '📋' },
  medicacao: { label: 'Medicação', emoji: '💊' },
  outro:     { label: 'Outro',     emoji: '📅' },
}

function formatDate(d: string): string {
  // d = 'YYYY-MM-DD' — evita fuso construindo a data local explicitamente
  const [y, m, day] = d.split('-').map(Number)
  return new Date(y, m - 1, day).toLocaleDateString('pt-BR', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
  })
}

const todayStr = () => new Date().toISOString().split('T')[0]

export default function AgendaPage() {
  const [events, setEvents]   = useState<AgendaEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AgendaEvent | null>(null)
  const [busyId, setBusyId]   = useState<string | null>(null)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) { setLoading(false); return }
    // agenda_events ainda não está nos tipos gerados — cast necessário
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from('agenda_events') as any)
      .select('id, event_type, title, event_date, event_time, duration_min, notes, status, reminder_enabled')
      .eq('user_id', auth.user.id)
      .neq('status', 'cancelled')
      .order('event_date', { ascending: true })
      .order('event_time', { ascending: true })
    setEvents((data ?? []) as AgendaEvent[])
    setLoading(false)
  }, [])

  // Carga inicial dos eventos (mesmo padrão das páginas de exames/histórico).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  async function handleSave(input: AgendaEventInput) {
    const supabase = createClient()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return

    const payload = {
      user_id:          auth.user.id,
      event_type:       input.eventType,
      title:            input.title,
      event_date:       input.date,
      event_time:       input.time || null,
      duration_min:     input.durationMin,
      notes:            input.notes || null,
      reminder_enabled: input.reminderEnabled,
      // Re-arma o lembrete (ex.: data alterada na edição).
      reminder_sent_at: null,
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase.from('agenda_events') as any
    if (editing) {
      await sb.update(payload).eq('id', editing.id)
    } else {
      await sb.insert(payload)
    }
    setEditing(null)
    await load()
  }

  async function conclude(id: string) {
    setBusyId(id)
    const supabase = createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('agenda_events') as any).update({ status: 'done' }).eq('id', id)
    await load()
    setBusyId(null)
  }

  async function remove(id: string) {
    setBusyId(id)
    const supabase = createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('agenda_events') as any).delete().eq('id', id)
    await load()
    setBusyId(null)
  }

  function openAdd() {
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(ev: AgendaEvent) {
    setEditing(ev)
    setModalOpen(true)
  }

  const today = todayStr()
  const upcoming = events.filter(e => e.status === 'pending')
  const done     = events.filter(e => e.status === 'done').reverse()

  const editingInitial: Partial<AgendaEventInput> | undefined = editing
    ? {
        eventType:   editing.event_type,
        title:       editing.title,
        date:        editing.event_date,
        time:        editing.event_time?.slice(0, 5) ?? '08:00',
        durationMin: editing.duration_min ?? 60,
        notes:       editing.notes ?? '',
        reminderEnabled: editing.reminder_enabled,
      }
    : undefined

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-onyx mb-1">Planejamento de Saúde</h1>
          <p className="font-body text-sm text-mauve">Seus próximos exames, consultas e retornos — em um só lugar</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-sintera text-white text-sm font-body font-medium hover:opacity-90 transition-opacity flex-shrink-0">
          <Plus size={16} /> Adicionar
        </button>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-mauve">
          <Loader2 size={22} className="animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="card-premium p-10 text-center">
          <div className="w-16 h-16 rounded-2xl gradient-sintera-soft flex items-center justify-center mx-auto mb-5">
            <CalendarDays size={28} className="text-petal" />
          </div>
          <h2 className="font-display text-lg font-semibold text-onyx mb-2">Nenhum evento ainda</h2>
          <p className="font-body text-sm text-mauve max-w-sm mx-auto leading-relaxed mb-5">
            Adicione um exame, consulta ou retorno para acompanhar seus próximos passos
            e exportar para o Google, Apple ou Outlook.
          </p>
          <button onClick={openAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-sintera text-white text-sm font-body font-medium hover:opacity-90 transition-opacity">
            <Plus size={16} /> Adicionar primeiro evento
          </button>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {/* Próximos */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <CalendarClock size={15} className="text-petal" />
              <h2 className="font-body text-sm font-semibold text-onyx">Próximos ({upcoming.length})</h2>
            </div>
            {upcoming.length === 0 ? (
              <p className="font-body text-sm text-mauve/70 px-1">Nenhum evento futuro pendente.</p>
            ) : upcoming.map(ev => {
              const overdue = ev.event_date < today
              return (
                <motion.div key={ev.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="card-premium p-4 flex items-start gap-3">
                  <div className="text-xl leading-none mt-0.5">{TYPE_META[ev.event_type].emoji}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm font-semibold text-onyx truncate">{ev.title}</p>
                    <p className="font-body text-xs text-mauve mt-0.5">
                      {formatDate(ev.event_date)}{ev.event_time ? ` · ${ev.event_time.slice(0, 5)}` : ''}
                      {overdue && <span className="ml-2 text-petal font-medium">atrasado</span>}
                    </p>
                    {ev.notes && <p className="font-body text-xs text-mauve/70 mt-1 line-clamp-2">{ev.notes}</p>}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => conclude(ev.id)} disabled={busyId === ev.id} title="Concluir"
                      className="p-2 rounded-lg text-mauve hover:text-sage hover:bg-sage-light transition-colors disabled:opacity-40">
                      {busyId === ev.id ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                    </button>
                    <button onClick={() => openEdit(ev)} title="Editar / exportar"
                      className="p-2 rounded-lg text-mauve hover:text-petal hover:bg-blush/40 transition-colors">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => remove(ev.id)} disabled={busyId === ev.id} title="Excluir"
                      className="p-2 rounded-lg text-mauve hover:text-red-400 hover:bg-red-500/8 transition-colors disabled:opacity-40">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </section>

          {/* Concluídos */}
          {done.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Check size={15} className="text-sage" />
                <h2 className="font-body text-sm font-semibold text-onyx">Concluídos ({done.length})</h2>
              </div>
              {done.map(ev => (
                <div key={ev.id} className="card-premium p-4 flex items-center gap-3 opacity-60">
                  <div className="text-lg leading-none">{TYPE_META[ev.event_type].emoji}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm font-medium text-onyx truncate line-through">{ev.title}</p>
                    <p className="font-body text-xs text-mauve mt-0.5">{formatDate(ev.event_date)}</p>
                  </div>
                  <button onClick={() => remove(ev.id)} disabled={busyId === ev.id} title="Excluir"
                    className="p-2 rounded-lg text-mauve hover:text-red-400 hover:bg-red-500/8 transition-colors disabled:opacity-40 flex-shrink-0">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </section>
          )}
        </div>
      )}

      {/* Aviso de escopo — sem inteligência clínica (Fase 1) */}
      <p className="font-body text-[11px] text-mauve/50 text-center leading-relaxed px-4">
        A SINTERA organiza seus eventos de saúde. Não oferece diagnóstico nem orientação clínica.
      </p>

      <AgendarModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        onSave={handleSave}
        initialEvent={editingInitial}
      />
    </div>
  )
}

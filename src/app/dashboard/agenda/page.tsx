'use client'

// Agenda — eventos FUTUROS da jornada de saúde (projeção do domínio HealthEvent).
// Consome SÓ o contrato @/lib/agenda (services), nunca o banco. O Histórico é a
// projeção dos eventos passados. Sem juízo clínico (RDC 657/2022).

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { CalendarDays, Plus, Check, Pencil, Ban, Trash2, Loader2, CalendarClock, Sparkles, X } from 'lucide-react'
import AgendarModal, { type AgendaEventInput } from '@/components/AgendarModal'
import ConfirmDialog from '@/components/ConfirmDialog'
import { useEventForm, eventToInput } from '@/components/eventForm'
import { buildExamRecencySuggestion, type AgendaSuggestion } from '@/lib/agenda/suggestions'
import { typeLabel, statusLabel, formatDateBR, formatTimeBR, type HealthEvent } from '@/lib/agenda'

const STATUS_CLS: Record<string, string> = {
  planejado: 'bg-mauve/10 text-mauve',
  realizado: 'bg-sage-light text-sage', cancelado: 'bg-red-50 text-red-400',
  reagendado: 'bg-amber-50 text-amber-600', perdido: 'bg-red-50 text-red-400',
}
const TYPE_EMOJI: Record<string, string> = {
  consulta: '🩺', retorno: '📋', exame: '🧪', procedimento: '🩹', cirurgia: '⚕️',
  vacina: '💉', medicamento: '💊', medicacao: '💊', suplemento: '🌿', plano: '🏥', outro: '📌',
}

export default function AgendaPage() {
  const router = useRouter()
  const { services, supabase, saveEvent } = useEventForm()

  const [userId, setUserId]   = useState<string | null>(null)
  const [events, setEvents]   = useState<HealthEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId]   = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing]     = useState<HealthEvent | null>(null)
  const [prefill, setPrefill]     = useState<Partial<AgendaEventInput> | undefined>(undefined)
  const [suggestion, setSuggestion] = useState<AgendaSuggestion | null>(null)
  const [dismissed, setDismissed]   = useState(false)
  // Confirmação própria (não-bloqueante) p/ ações com consequência (concluir).
  const [confirm, setConfirm] = useState<{ message: string; confirmLabel: string; onYes: () => void } | null>(null)

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

  // Concluir tem consequência (sai da Agenda → Histórico, e Gastos se tiver valor).
  // Pede confirmação explicativa antes — reversível depois via "Reabrir".
  function onComplete(ev: HealthEvent) {
    if (!userId) return
    setConfirm({
      message: 'Concluir este evento? Ele sai da Agenda e passa para o Histórico — e para os Gastos, se tiver valor. Você pode reabri-lo depois, se precisar.',
      confirmLabel: 'Concluir',
      onYes: () => doComplete(ev),
    })
  }
  async function doComplete(ev: HealthEvent) {
    if (!userId) return
    setBusyId(ev.id); setActionError(null)
    try { await services.command.complete(userId, ev); reload() }
    catch (e) { setActionError(e instanceof Error ? e.message : 'Não foi possível concluir o evento.') }
    finally { setBusyId(null) }
  }
  async function onCancel(ev: HealthEvent) {
    if (!userId) return
    setBusyId(ev.id); setActionError(null)
    try { await services.command.cancel(userId, ev); reload() }
    catch (e) { setActionError(e instanceof Error ? e.message : 'Não foi possível cancelar o evento.') }
    finally { setBusyId(null) }
  }
  // Excluir = apagar DE VEZ (evento criado por engano), distinto de Cancelar.
  // Ação permanente → confirmação clara antes.
  function onDelete(ev: HealthEvent) {
    if (!userId) return
    setConfirm({
      message: 'Excluir este evento de vez? Ele será removido da Agenda, do Histórico e dos Gastos. Esta ação não pode ser desfeita.',
      confirmLabel: 'Excluir',
      onYes: () => doDelete(ev),
    })
  }
  async function doDelete(ev: HealthEvent) {
    if (!userId) return
    setBusyId(ev.id); setActionError(null)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from('health_events').delete().eq('id', ev.id)
      if (error) throw error
      // Legado: a Agenda também mostra lembretes de agenda_events (recompra/ciclo).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('agenda_events').delete().eq('id', ev.id)
      reload()
    } catch (e) { setActionError(e instanceof Error ? e.message : 'Não foi possível excluir o evento.') }
    finally { setBusyId(null) }
  }

  async function handleSave(input: AgendaEventInput) {
    if (!userId) return
    // Caminho ÚNICO de gravação (compartilhado com Histórico e Gastos).
    await saveEvent(userId, input, editing)
    setEditing(null); setModalOpen(false); setPrefill(undefined); reload()
  }

  function openAdd() { setEditing(null); setPrefill(undefined); setModalOpen(true) }
  async function openEdit(ev: HealthEvent) {
    // Medicamentos/suplementos foram REMOVIDOS do formulário de evento — editam-se na
    // página de Medicamentos. Roteia o lembrete de medicação (ex.: "Recomprar: X") para
    // lá, abrindo o próprio medicamento (achado pelo repurchase_event_id).
    const isMedType = ev.type === 'medicacao' || ev.type === 'medicamento' || ev.type === 'suplemento'
    const looksLikeRecompra = /^recomprar/i.test((ev.title ?? '').trim())
    // Detecção DEFINITIVA: existe um medicamento vinculado a este evento? (lembrete de recompra)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: medRow } = await (supabase as any).from('medications').select('id').eq('repurchase_event_id', ev.id).maybeSingle()
    const medId = (medRow?.id as string) ?? null
    if (medId || isMedType || looksLikeRecompra) {
      router.push(medId ? `/dashboard/medicamentos?edit=${medId}` : '/dashboard/medicamentos')
      return
    }
    setEditing(ev); setPrefill(undefined); setModalOpen(true)
  }
  function openFromSuggestion(s: AgendaSuggestion) {
    setEditing(null); setPrefill({ eventType: s.suggestedEventType, title: s.suggestedTitle }); setModalOpen(true)
  }

  const today = new Date().toISOString().slice(0, 10)
  const editingInitial: Partial<AgendaEventInput> | undefined = editing ? eventToInput(editing) : prefill

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

      {actionError && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="font-body text-xs text-red-600">{actionError}</p>
          <button onClick={() => setActionError(null)} className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0"><X size={14} /></button>
        </div>
      )}

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
                    {ev.priority && <span className={`w-2 h-2 rounded-full flex-shrink-0 ${ev.priority === 'alta' ? 'bg-red-400' : ev.priority === 'media' ? 'bg-amber-400' : 'bg-sage'}`} title={`Prioridade ${ev.priority}`} />}
                    <p className="font-body text-sm font-semibold text-onyx truncate">{ev.title}</p>
                    <span className={`font-body text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_CLS[ev.status] ?? 'bg-mauve/10 text-mauve'}`}>{statusLabel(ev.status)}</span>
                    {ev.recurrenceRule && <span className="font-body text-[10px] text-mauve/60" title="Evento recorrente">🔁</span>}
                  </div>
                  <p className="font-body text-xs text-mauve mt-0.5">
                    {typeLabel(ev.type)} · {formatDateBR(ev.date)}{formatTimeBR(ev.time) ? ` · ${formatTimeBR(ev.time)}` : ''}
                    {ev.directExpense && <span className="ml-2 text-sage">despesa direta</span>}
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
                  <button onClick={() => onCancel(ev)} disabled={busyId === ev.id} title="Cancelar (marca como cancelado — fica no Histórico)"
                    className="p-2 rounded-lg text-mauve hover:text-amber-500 hover:bg-amber-500/8 transition-colors disabled:opacity-40">
                    <Ban size={15} />
                  </button>
                  <button onClick={() => onDelete(ev)} disabled={busyId === ev.id} title="Excluir (apaga de vez — Agenda, Histórico e Gastos)"
                    className="p-2 rounded-lg text-mauve hover:text-red-500 hover:bg-red-500/8 transition-colors disabled:opacity-40">
                    <Trash2 size={15} />
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
        onGoToHistory={() => router.push('/dashboard/timeline')}
        initialEvent={editingInitial}
        isEditing={!!editing}
      />

      <ConfirmDialog
        open={!!confirm}
        message={confirm?.message ?? ''}
        confirmLabel={confirm?.confirmLabel ?? 'Confirmar'}
        onConfirm={() => { const c = confirm; setConfirm(null); c?.onYes() }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}

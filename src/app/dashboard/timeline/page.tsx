'use client'

// Health Timeline — a jornada de saúde consolidada (exames + eventos) numa linha
// do tempo única. ORGANIZAÇÃO FACTUAL, sem juízo clínico. Cada item carrega
// proveniência e confiança (autorrelato é marcado como tal). Eventos suportam
// criar / editar / excluir e anexo opcional.
// Ver docs/estrategia/SINTERA-VALUE-PROPOSITION-NORTH-STAR.md.

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Clock, Plus, X, Stethoscope, Syringe, Activity, FlaskConical, CalendarDays,
  Loader2, Pencil, Trash2, Paperclip, Info, Sparkles, Pill, Receipt, Dumbbell, Dna, CheckCircle2, RotateCcw,
} from 'lucide-react'
import Link from 'next/link'
import TimelineEntry from '@/components/entry/TimelineEntry'
import { useUser } from '@/context/UserContext'
import AgendarModal, { type AgendaEventInput } from '@/components/AgendarModal'
import ConfirmDialog from '@/components/ConfirmDialog'
import { useEventForm, eventToInput } from '@/components/eventForm'
import { rowToHealthEvent, type HealthEvent, type HealthEventRow } from '@/lib/agenda'
import HistoricoTabs from '@/components/HistoricoTabs'
import { DOMAIN_LABEL, type OmicsDomain } from '@/lib/omics/domains'

type EventType = 'consulta' | 'vacina' | 'procedimento' | 'estetico' | 'medicamento' | 'atividade' | 'exame' | 'omica' | 'outro'

interface TimelineItem {
  id: string
  rawId?: string            // health_events.id (só para eventos editáveis)
  kind: 'exam' | 'event' | 'omica'
  eventType: EventType
  title: string
  subtitle: string | null
  date: string
  source: string
  confidence: string
  attachmentUrl?: string | null
  amountCents?: number | null
  profKind?: string | null
  status?: string           // status do health_event (só kind 'event')
  href?: string             // link para o painel (ômica)
}

// Cobre a taxonomia única + tipos legados já gravados. NUNCA deve quebrar: o acesso
// usa fallback para 'outro' (ver renderItem) caso surja um tipo desconhecido.
const TYPE_META: Record<string, { label: string; Icon: React.ElementType; cls: string }> = {
  consulta:     { label: 'Consulta',     Icon: Stethoscope,  cls: 'bg-blush text-petal' },
  retorno:      { label: 'Consulta (retorno)', Icon: Stethoscope, cls: 'bg-blush text-petal' },
  vacina:       { label: 'Vacina',       Icon: Syringe,      cls: 'bg-sage-light text-sage' },
  procedimento: { label: 'Procedimento', Icon: Activity,     cls: 'bg-lavender-light text-lavender' },
  cirurgia:     { label: 'Cirurgia',     Icon: Activity,     cls: 'bg-lavender-light text-lavender' },
  estetico:     { label: 'Procedimento', Icon: Sparkles,     cls: 'bg-blush text-petal' },
  medicamento:  { label: 'Medicamento',  Icon: Pill,         cls: 'bg-sage-light text-sage' },
  medicacao:    { label: 'Medicamento',  Icon: Pill,         cls: 'bg-sage-light text-sage' },
  suplemento:   { label: 'Suplemento',   Icon: Pill,         cls: 'bg-sage-light text-sage' },
  atividade:    { label: 'Atividade física', Icon: Dumbbell, cls: 'bg-lavender-light text-lavender' },
  plano:        { label: 'Plano de saúde', Icon: Receipt,    cls: 'bg-warm text-gold' },
  exame:        { label: 'Exame',        Icon: FlaskConical, cls: 'bg-warm text-gold' },
  omica:        { label: 'Ômica',        Icon: Dna,          cls: 'bg-lavender-light text-lavender' },
  outro:        { label: 'Evento',       Icon: CalendarDays, cls: 'bg-ivory text-mauve' },
}

const PROF_LABEL: Record<string, string> = {
  medico: 'Médico(a)', psicologo: 'Psicólogo(a)', nutricionista: 'Nutricionista',
  fisioterapeuta: 'Fisioterapeuta', dentista: 'Dentista', outro: 'Outro profissional',
}

function fmt(date: string): string {
  const d = new Date(date.length <= 10 ? `${date}T00:00:00` : date)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// Passo 7 (cutover) — a rota decide legacy × v2 pelo Entry. Default: legacy.
// Flip por página via NEXT_PUBLIC_TIMELINE_V2=true.
export default function TimelineRoute() {
  return <TimelineEntry legacy={<LegacyTimeline />} />
}

function LegacyTimeline() {
  const { user } = useUser()
  // Caminho ÚNICO de evento: mesmo modal e mesma gravação da Agenda.
  const { supabase, saveEvent, services } = useEventForm()

  const [items, setItems] = useState<TimelineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [showOnboard, setShowOnboard] = useState(false)

  // Formulário único de evento (AgendarModal)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<HealthEvent | null>(null)
  // Confirmação própria (não-bloqueante) p/ ações com consequência (reabrir).
  const [confirm, setConfirm] = useState<{ message: string; confirmLabel: string; onYes: () => void } | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Lê preferência do onboarding uma vez na montagem (acesso a localStorage).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowOnboard(localStorage.getItem('sintera_journey_onboarded') !== '1')
    }
  }, [])
  function dismissOnboard() {
    if (typeof window !== 'undefined') localStorage.setItem('sintera_journey_onboarded', '1')
    setShowOnboard(false)
  }


  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const [examsRes, eventsRes, omicsRes] = await Promise.all([
      supabase.from('exams')
        .select('id, type, exam_date, status, notes, created_at')
        .eq('user_id', user.id),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from('health_events')
        .select('id, event_type, title, event_date, notes, source, confidence, attachment_url, amount_cents, professional_kind, synthetic, status')
        .eq('user_id', user.id)
        .eq('synthetic', false),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from('omics_panels')
        .select('id, domain, laboratory, total_features, collected_on, created_at')
        .eq('user_id', user.id),
    ])

    const merged: TimelineItem[] = []
    for (const e of (examsRes.data ?? []) as Array<Record<string, unknown>>) {
      merged.push({
        id: `exam-${e.id as string}`, kind: 'exam', eventType: 'exame',
        title: (e.type as string) || 'Exame laboratorial',
        subtitle: (e.status as string) === 'processed' ? 'Dados extraídos' : (e.status as string) ?? null,
        date: (e.exam_date as string) || (e.created_at as string),
        source: 'upload', confidence: 'alta',
        href: `/dashboard/exams/${e.id as string}`,
      })
    }
    for (const ev of (eventsRes.data ?? []) as Array<Record<string, unknown>>) {
      merged.push({
        id: `event-${ev.id as string}`, rawId: ev.id as string, kind: 'event',
        eventType: (ev.event_type as EventType) ?? 'outro',
        title: (ev.title as string) ?? 'Evento',
        subtitle: (ev.notes as string) ?? null,
        date: ev.event_date as string,
        source: (ev.source as string) ?? 'autorrelato',
        confidence: (ev.confidence as string) ?? 'baixa',
        attachmentUrl: (ev.attachment_url as string) ?? null,
        amountCents: (ev.amount_cents as number) ?? null,
        profKind: (ev.professional_kind as string) ?? null,
        status: (ev.status as string) ?? 'planejado',
      })
    }
    for (const p of (omicsRes.data ?? []) as Array<Record<string, unknown>>) {
      const total = p.total_features as number | null
      const sub = [p.laboratory as string | null, total != null ? `${total.toLocaleString('pt-BR')} marcadores` : null].filter(Boolean).join(' · ')
      merged.push({
        id: `omics-${p.id as string}`, kind: 'omica', eventType: 'omica',
        title: DOMAIN_LABEL[(p.domain as OmicsDomain)] ?? 'Ômica',
        subtitle: sub || null,
        date: (p.collected_on as string) || (p.created_at as string),
        source: 'upload', confidence: 'alta',
        href: `/dashboard/omics/${p.id as string}`,
      })
    }
    merged.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    setItems(merged)
    setLoading(false)
  }, [user, supabase])

  // Carrega na montagem (e após mutações); o setLoading(true) síncrono é intencional.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  function openCreate() { setEditingEvent(null); setModalOpen(true) }
  async function openEdit(it: TimelineItem) {
    if (!it.rawId) return
    setActionError(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).from('health_events').select('*').eq('id', it.rawId).single()
    if (error || !data) { setActionError('Não foi possível abrir o evento para edição.'); return }
    setEditingEvent(rowToHealthEvent(data as HealthEventRow)); setModalOpen(true)
  }

  // Salva via o MESMO caminho da Agenda (hook). Erros sobem para o modal (visíveis).
  async function handleSave(input: AgendaEventInput) {
    if (!user) return
    await saveEvent(user.id, input, editingEvent)
    setModalOpen(false); setEditingEvent(null); await load()
  }

  async function remove(rawId: string, label: string) {
    if (busyId) return
    if (!window.confirm(`Excluir "${label}" do seu Histórico?`)) return
    setBusyId(rawId); setActionError(null)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from('health_events').delete().eq('id', rawId)
      if (error) { setActionError(`Não foi possível excluir: ${error.message}`); return }
      await load()
    } finally {
      setBusyId(null)
    }
  }

  // Marca um evento do Histórico como Realizado — atualização CIRÚRGICA (só status +
  // completed_at) p/ preservar os demais campos. Realizado + valor entra em Gastos.
  // Carrega o evento completo e usa o MESMO comando da Agenda (com roll-forward da
  // recorrência: concluir um item de uso contínuo já deixa a próxima ocorrência na Agenda).
  async function withFullEvent(rawId: string, action: (ev: HealthEvent) => Promise<void>, errMsg: string) {
    if (busyId || !user) return
    setBusyId(rawId); setActionError(null)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).from('health_events').select('*').eq('id', rawId).single()
      if (error || !data) { setActionError(errMsg); return }
      await action(rowToHealthEvent(data as HealthEventRow))
      await load()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : errMsg)
    } finally {
      setBusyId(null)
    }
  }
  const markRealized = (rawId: string) =>
    withFullEvent(rawId, ev => services.command.complete(user!.id, ev), 'Não foi possível concluir o evento.')
  // Reabrir tem consequência (volta para a Agenda; sai do Histórico/Gastos).
  // Confirmação explicativa antes — importante no mobile, onde não há tooltip.
  const reopenEvent = (rawId: string) =>
    setConfirm({
      message: 'Reabrir este evento? Ele volta para a Agenda (sai do Histórico) — e sai dos Gastos, se estava lá.',
      confirmLabel: 'Reabrir',
      onYes: () => withFullEvent(rawId, ev => services.command.reopen(user!.id, ev), 'Não foi possível reabrir o evento.'),
    })

  const today = new Date().toISOString().slice(0, 10)
  // Histórico = SÓ o que já aconteceu. Eventos futuros ainda planejados vivem na Agenda
  // (regra definitiva: Agenda = futuro · Histórico = passado). Exames/ômica e eventos
  // realizados/cancelados aparecem; um evento futuro ainda "planejado" não.
  const isFuturePlanned = (it: TimelineItem) =>
    it.kind === 'event' && it.date.slice(0, 10) >= today && it.status !== 'realizado' && it.status !== 'cancelado'
  const history = items.filter(it => !isFuturePlanned(it)) // já ordenado: mais recente primeiro

  const renderItem = (it: TimelineItem, i: number) => {
    const meta = TYPE_META[it.eventType] ?? TYPE_META.outro
    return (
      <motion.div key={it.id}
        initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
        className="relative">
        <div className={`absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-cream ${meta.cls}`} />
        <div className="card-premium p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.cls}`}>
                <meta.Icon size={15} />
              </div>
              <div className="min-w-0">
                {it.href ? (
                  <Link href={it.href} className="font-body text-sm font-semibold text-onyx hover:text-petal hover:underline">{it.title}</Link>
                ) : it.rawId ? (
                  <button onClick={() => openEdit(it)} className="block font-body text-sm font-semibold text-onyx hover:text-petal text-left">{it.title}</button>
                ) : (
                  <p className="font-body text-sm font-semibold text-onyx">{it.title}</p>
                )}
                <p className="font-body text-[11px] text-mauve/60">{meta.label}{it.profKind && PROF_LABEL[it.profKind] ? ` · ${PROF_LABEL[it.profKind]}` : ''}{it.subtitle ? ` · ${it.subtitle}` : ''}</p>
                {it.amountCents != null && (
                  <span className="inline-block font-body text-[11px] font-medium text-sage bg-sage-light border border-sage/20 rounded-full px-2 py-0.5 mt-1">
                    {fmtBRL(it.amountCents)}
                  </span>
                )}
                {it.attachmentUrl && (
                  <a href={it.attachmentUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-body text-[11px] text-petal hover:underline mt-1">
                    <Paperclip size={11} /> Ver anexo
                  </a>
                )}
                {it.href && (
                  <Link href={it.href}
                    className="inline-flex items-center gap-1 font-body text-[11px] text-petal hover:underline mt-1">
                    {it.kind === 'exam' ? 'Ver exame' : 'Ver painel'} →
                  </Link>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <span className="font-body text-[11px] text-mauve/60">{fmt(it.date)}</span>
              {it.kind === 'event' && it.status === 'realizado' && (
                <span className="font-body text-[10px] text-sage">✓ realizado</span>
              )}
              {it.kind === 'event' && it.status === 'cancelado' && (
                <span className="font-body text-[10px] text-mauve/40 line-through">cancelado</span>
              )}
              {it.kind === 'event' && it.rawId && (
                <div className="flex items-center gap-1 mt-0.5">
                  {it.status !== 'realizado' && it.status !== 'cancelado' && (
                    <button aria-label="Marcar como realizado" title="Marcar como realizado (se tiver valor, entra em Gastos)"
                      disabled={busyId === it.rawId} onClick={() => markRealized(it.rawId!)}
                      className="w-6 h-6 rounded-lg hover:bg-sage-light flex items-center justify-center text-mauve/60 hover:text-sage transition-colors disabled:opacity-40">
                      <CheckCircle2 size={12} />
                    </button>
                  )}
                  {it.status === 'realizado' && (
                    <button aria-label="Reabrir" title="Reabrir (desfazer conclusão — volta para a Agenda)"
                      disabled={busyId === it.rawId} onClick={() => reopenEvent(it.rawId!)}
                      className="w-6 h-6 rounded-lg hover:bg-blush flex items-center justify-center text-mauve/60 hover:text-petal transition-colors disabled:opacity-40">
                      <RotateCcw size={12} />
                    </button>
                  )}
                  <button aria-label="Editar" onClick={() => openEdit(it)}
                    className="w-6 h-6 rounded-lg hover:bg-black/5 flex items-center justify-center text-mauve/60 hover:text-petal transition-colors">
                    <Pencil size={12} />
                  </button>
                  <button aria-label="Excluir" disabled={busyId === it.rawId}
                    onClick={() => remove(it.rawId!, it.title)}
                    className="w-6 h-6 rounded-lg hover:bg-red-50 flex items-center justify-center text-mauve/60 hover:text-red-400 transition-colors disabled:opacity-40">
                    <Trash2 size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-onyx mb-1">Histórico</h1>
          <p className="font-body text-sm text-mauve">Seu acompanhamento longitudinal — a linha do tempo com exames, consultas, vacinas, procedimentos e medicamentos</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-full gradient-sintera text-white font-body text-sm font-medium hover:opacity-90 transition-opacity flex-shrink-0">
          <Plus size={15} /> Adicionar evento
        </button>
      </motion.div>

      {/* Duas visões do mesmo registro longitudinal: Linha do Tempo (esta) · Evolução */}
      <HistoricoTabs active="linha" />

      {actionError && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="font-body text-xs text-red-600">{actionError}</p>
          <button onClick={() => setActionError(null)} className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0"><X size={14} /></button>
        </div>
      )}

      {/* Onboarding dispensável */}
      {showOnboard && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-petal/30 bg-blush/30 px-4 py-3 flex items-start gap-3">
          <Info size={16} className="text-petal flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-body text-xs text-onyx leading-relaxed">
              Este é o seu <strong>Histórico</strong>: o registro do que já aconteceu. Adicione seus
              exames, consultas, vacinas e procedimentos para mantê-lo completo. O que ainda está por
              vir permanece na <Link href="/dashboard/agenda" className="text-petal hover:underline">Agenda</Link>{' '}
              e, ao ser concluído, passa para cá.
            </p>
          </div>
          <button onClick={dismissOnboard} aria-label="Dispensar"
            className="text-mauve/50 hover:text-onyx transition-colors flex-shrink-0"><X size={14} /></button>
        </motion.div>
      )}

      {loading ? (
        <div className="card-premium p-10 text-center flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-petal" />
        </div>
      ) : history.length === 0 ? (
        <div className="card-premium p-10 text-center">
          <div className="w-14 h-14 rounded-2xl gradient-sintera-soft flex items-center justify-center mx-auto mb-4">
            <Clock size={26} className="text-petal" />
          </div>
          <h2 className="font-display text-lg font-semibold text-onyx mb-1">Seu Histórico começa aqui</h2>
          <p className="font-body text-sm text-mauve max-w-sm mx-auto">
            Envie um exame ou adicione uma consulta, vacina ou procedimento para começar a
            construir sua linha do tempo de saúde.
          </p>
        </div>
      ) : (
        <div className="relative pl-6">
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border/60" />
          <div className="space-y-4">{history.map(renderItem)}</div>
        </div>
      )}

      <p className="font-body text-[11px] text-mauve/40 text-center">
        Organização factual do seu Histórico. Não constitui diagnóstico nem avaliação clínica.
      </p>

      {/* Formulário ÚNICO de evento (criar/editar) — o MESMO da Agenda */}
      <AgendarModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingEvent(null) }}
        onSave={handleSave}
        initialEvent={editingEvent ? eventToInput(editingEvent) : undefined}
        isEditing={!!editingEvent}
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

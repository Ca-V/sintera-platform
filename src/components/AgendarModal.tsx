'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, ExternalLink, CalendarDays, Loader2, Check, ChevronDown } from 'lucide-react'
import { EVENT_TYPE_DEFS, EVENT_STATUS_UI } from '@/lib/agenda'

// Tipos vêm da FONTE ÚNICA (@/lib/agenda) — Agenda e Histórico falam a mesma língua.
export type EventType = typeof EVENT_TYPE_DEFS[number]['id']
export type EventStatusInput = 'planejado' | 'realizado' | 'cancelado'
export type EventModality = 'presencial' | 'telemedicina' | ''
export type RecurrenceFreq = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly'
export type PriorityInput = '' | 'alta' | 'media' | 'baixa'

/** Dados de um evento, usados para salvar na agenda da plataforma. */
export interface AgendaEventInput {
  eventType: EventType
  isReturn: boolean    // atributo da Consulta ("é um retorno")
  isSurgery: boolean   // subtipo do Procedimento ("é uma cirurgia")
  status: EventStatusInput
  title: string
  date: string         // 'YYYY-MM-DD'
  time: string         // 'HH:mm'
  durationMin: number
  notes: string
  reminderEnabled: boolean
  modality: EventModality
  professionalName: string
  establishment: string
  location: string
  preparation: string
  amount: string       // valor em reais, formato livre ("250,00")
  recurrenceFrequency: RecurrenceFreq
  recurrenceUntil: string   // '' ou 'YYYY-MM-DD'
  priority: PriorityInput
  directExpense: boolean
  outcome: string      // Desfecho (resumo) — preenchido após realizar
  operadora: string    // Plano de saúde
  carteirinha: string
  attachmentFile?: File | null   // nota fiscal / comprovante / laudo (novo upload)
  attachmentUrl?: string         // anexo já existente (exibição na edição)
}

interface AgendarModalProps {
  open: boolean
  onClose: () => void
  defaultTitle?: string
  defaultNotes?: string
  onSave?: (data: AgendaEventInput) => Promise<void> | void
  onGoToHistory?: () => void   // ação após salvar um evento "Realizado" (vai p/ Histórico)
  initialEvent?: Partial<AgendaEventInput>
  isEditing?: boolean          // true = editar evento existente; false/omisso = criar (mesmo com prefill)
}

const RECURRENCE_OPTS: { v: RecurrenceFreq; l: string }[] = [
  { v: 'none', l: 'Não repetir' }, { v: 'daily', l: 'Diariamente' }, { v: 'weekly', l: 'Semanalmente' },
  { v: 'biweekly', l: 'Quinzenalmente' }, { v: 'monthly', l: 'Mensalmente' }, { v: 'yearly', l: 'Anualmente' },
]

function fmtDate(date: Date): string { return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z' }
function buildGoogleCalendarUrl(title: string, start: Date, end: Date, details: string): string {
  const params = new URLSearchParams({ action: 'TEMPLATE', text: title, dates: `${fmtDate(start)}/${fmtDate(end)}`, details })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}
function buildOutlookUrl(title: string, start: Date, end: Date, body: string): string {
  const params = new URLSearchParams({ subject: title, startdt: start.toISOString().split('.')[0], enddt: end.toISOString().split('.')[0], body, path: '/calendar/action/compose', rru: 'addevent' })
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`
}
function buildICS(title: string, start: Date, end: Date, description: string): string {
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//SINTERA//Agenda de Saúde//PT', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT', `UID:sintera-${Date.now()}@sintera.app`, `SUMMARY:${title}`, `DTSTART:${fmtDate(start)}`, `DTEND:${fmtDate(end)}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n')}`, `DTSTAMP:${fmtDate(new Date())}`, 'STATUS:CONFIRMED', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n')
}
function downloadICS(ics: string, filename: string) {
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url)
}

const FIELD = 'w-full px-3 py-2.5 border border-border rounded-xl font-body text-sm text-onyx placeholder:text-mauve/40 focus:outline-none focus:ring-1 focus:ring-petal/40 transition-colors'
const LABEL = 'font-body text-xs font-semibold text-onyx/60 uppercase tracking-wider'

export default function AgendarModal({ open, onClose, defaultTitle = '', defaultNotes = '', onSave, onGoToHistory, initialEvent, isEditing = false }: AgendarModalProps) {
  const today = new Date().toISOString().split('T')[0]

  const [eventType, setEventType] = useState<EventType>('consulta')
  const [isReturn, setIsReturn]   = useState(false)
  const [isSurgery, setIsSurgery] = useState(false)
  const [status, setStatus]       = useState<EventStatusInput>('planejado')
  const [title, setTitle]   = useState(defaultTitle)
  const [date, setDate]     = useState('')
  const [time, setTime]     = useState('')
  const [duration, setDuration] = useState('60')
  const [notes, setNotes]   = useState(defaultNotes)
  const [reminderEnabled, setReminderEnabled] = useState(true)
  const [modality, setModality] = useState<EventModality>('')
  const [professionalName, setProfessionalName] = useState('')
  const [establishment, setEstablishment] = useState('')
  const [location, setLocation] = useState('')
  const [preparation, setPreparation] = useState('')
  const [amount, setAmount] = useState('')
  const [recurrence, setRecurrence] = useState<RecurrenceFreq>('none')
  const [recurrenceUntil, setRecurrenceUntil] = useState('')
  const [priority, setPriority] = useState<PriorityInput>('')
  const [directExpense, setDirectExpense] = useState(false)
  const [outcome, setOutcome] = useState('')
  const [operadora, setOperadora] = useState('')
  const [carteirinha, setCarteirinha] = useState('')
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [added, setAdded] = useState(false)
  const [savedToAgenda, setSavedToAgenda] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open) return
    setEventType(initialEvent?.eventType ?? 'consulta')
    setIsReturn(initialEvent?.isReturn ?? false)
    setIsSurgery(initialEvent?.isSurgery ?? false)
    setStatus(initialEvent?.status ?? 'planejado')
    setTitle(initialEvent?.title ?? defaultTitle)
    setDate(initialEvent?.date ?? '')
    setTime(initialEvent?.time ?? '')
    setDuration(initialEvent?.durationMin ? String(initialEvent.durationMin) : '60')
    setNotes(initialEvent?.notes ?? defaultNotes)
    setReminderEnabled(initialEvent?.reminderEnabled ?? true)
    setModality(initialEvent?.modality ?? '')
    setProfessionalName(initialEvent?.professionalName ?? '')
    setEstablishment(initialEvent?.establishment ?? '')
    setLocation(initialEvent?.location ?? '')
    setPreparation(initialEvent?.preparation ?? '')
    setAmount(initialEvent?.amount ?? '')
    setRecurrence(initialEvent?.recurrenceFrequency ?? 'none')
    setRecurrenceUntil(initialEvent?.recurrenceUntil ?? '')
    setPriority(initialEvent?.priority ?? '')
    setDirectExpense(initialEvent?.directExpense ?? false)
    setOutcome(initialEvent?.outcome ?? '')
    setOperadora(initialEvent?.operadora ?? '')
    setCarteirinha(initialEvent?.carteirinha ?? '')
    setAttachmentFile(null)
    setShowDetails(false)
    setAdded(false); setSaving(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])
  /* eslint-enable react-hooks/set-state-in-effect */

  // Plano de saúde: compromisso recorrente MENSAL — aparece como previsão na
  // Agenda e vira Gasto quando concluído (com "Reabrir" disponível). NÃO marca
  // "despesa direta" por padrão (decisão fundadora 27/06): quem quiser lançar
  // direto em Gastos sem previsão marca o checkbox em Mais detalhes. O modelo
  // financeiro completo (default, editar de Gastos, valores em camadas) é T2-FIN.
  function chooseType(t: EventType) {
    setEventType(t)
    if (t !== 'consulta') setIsReturn(false)
    if (t !== 'procedimento') setIsSurgery(false)
    if (t === 'plano') {
      setDirectExpense(false)
      setRecurrence(r => (r === 'none' ? 'monthly' : r))
      setShowDetails(true)
    }
  }

  // Automação: data no passado sugere "Realizado" (lançamento retroativo de algo já feito).
  function onDateChange(v: string) {
    setDate(v)
    if (v && v < today && status === 'planejado') setStatus('realizado')
  }

  const typeLabel = EVENT_TYPE_DEFS.find(t => t.id === eventType)?.label ?? 'Evento'
  // Automação: título sugerido a partir do tipo + profissional ("Consulta — Dra. X").
  const fullTitle = title.trim() || [typeLabel, professionalName.trim()].filter(Boolean).join(' — ') || `${typeLabel} de Saúde`
  const canExport = date !== ''

  function buildDates() {
    // Exportação p/ calendário precisa de hora; se a usuária não informou, usa 09:00
    // só no link do calendário (o evento salvo na SINTERA mantém horário vazio).
    const start = new Date(`${date}T${time || '09:00'}:00`)
    const end = new Date(start.getTime() + parseInt(duration) * 60 * 1000)
    return { start, end }
  }
  function buildDescription(): string {
    const lines = ['Agendado via SINTERA — plataforma de organização de dados de saúde.']
    if (notes.trim()) lines.push('', notes.trim())
    lines.push('', 'SINTERA não oferece diagnóstico ou orientação clínica.')
    return lines.join('\n')
  }
  function handleGoogle() { const { start, end } = buildDates(); window.open(buildGoogleCalendarUrl(fullTitle, start, end, buildDescription()), '_blank', 'noopener,noreferrer'); if (!onSave) setAdded(true) }
  function handleOutlook() { const { start, end } = buildDates(); window.open(buildOutlookUrl(fullTitle, start, end, buildDescription()), '_blank', 'noopener,noreferrer'); if (!onSave) setAdded(true) }
  function handleICS() { const { start, end } = buildDates(); downloadICS(buildICS(fullTitle, start, end, buildDescription()), `sintera_${fullTitle.toLowerCase().replace(/\s+/g, '_')}.ics`); if (!onSave) setAdded(true) }

  async function handleSave() {
    if (!onSave || !canExport || saving) return
    setSaving(true); setSaveError(null)
    try {
      await onSave({
        eventType, isReturn: eventType === 'consulta' ? isReturn : false,
        isSurgery: eventType === 'procedimento' ? isSurgery : false, status,
        title: fullTitle, date, time, durationMin: parseInt(duration), notes: notes.trim(), reminderEnabled,
        modality, professionalName: professionalName.trim(), establishment: establishment.trim(), location: location.trim(),
        preparation: preparation.trim(), amount: amount.trim(),
        recurrenceFrequency: recurrence, recurrenceUntil, priority, directExpense,
        outcome: outcome.trim(), operadora: operadora.trim(), carteirinha: carteirinha.trim(),
        attachmentFile, attachmentUrl: initialEvent?.attachmentUrl,
      })
      // Salvou na Agenda: mostra confirmação; exportar p/ calendário fica como ação
      // SECUNDÁRIA, oferecida só agora que o evento já existe.
      setSaving(false); setSavedToAgenda(true); setAdded(true)
    } catch (e) {
      // Falha de gravação: mostrar e MANTER o modal aberto para a usuária tentar de novo.
      setSaveError(e instanceof Error ? e.message : 'Não foi possível salvar. Tente novamente.')
      setSaving(false)
    }
  }

  function resetFields() {
    setTitle(defaultTitle); setDate(''); setTime(''); setDuration('60'); setNotes(defaultNotes)
    setEventType('consulta'); setIsReturn(false); setIsSurgery(false); setStatus('planejado'); setModality(''); setProfessionalName(''); setEstablishment(''); setLocation(''); setPreparation(''); setAmount('')
    setRecurrence('none'); setRecurrenceUntil(''); setPriority(''); setDirectExpense(false); setOutcome(''); setOperadora(''); setCarteirinha(''); setAttachmentFile(null)
    setShowDetails(false); setSaveError(null)
  }
  function addAnother() { resetFields(); setAdded(false); setSavedToAgenda(false) }
  function handleClose() { resetFields(); setAdded(false); setSavedToAgenda(false); onClose() }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={handleClose} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed inset-x-4 bottom-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 sm:w-full sm:max-w-md max-h-[88vh] overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl border border-border overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-blush flex items-center justify-center"><CalendarDays size={17} className="text-petal" /></div>
                  <div>
                    <p className="font-body text-sm font-semibold text-onyx">{isEditing ? 'Editar evento' : 'Adicionar à agenda'}</p>
                    <p className="font-body text-xs text-mauve">Registre um compromisso de saúde</p>
                  </div>
                </div>
                <button onClick={handleClose} className="text-mauve hover:text-onyx transition-colors"><X size={17} /></button>
              </div>

              {added ? (
                <div className="px-6 py-7 text-center">
                  <div className="w-14 h-14 rounded-full bg-sage-light flex items-center justify-center mx-auto mb-3"><Check size={24} className="text-sage" /></div>
                  <p className="font-body text-sm font-semibold text-onyx mb-1">{savedToAgenda ? (status === 'realizado' ? 'Salvo no seu Histórico' : 'Salvo na sua Agenda') : 'Adicionado ao calendário'}</p>
                  <p className="font-body text-xs text-mauve mb-5">{savedToAgenda ? (status === 'realizado' ? 'Como já foi realizado, ele está no Histórico.' : 'Quando for realizado, ele passa para o Histórico.') : 'Pronto.'}</p>

                  {savedToAgenda && status === 'realizado' && onGoToHistory && (
                    <button onClick={() => { handleClose(); onGoToHistory() }}
                      className="w-full mb-3 py-2.5 rounded-xl gradient-sintera text-white text-sm font-body font-medium hover:opacity-90 transition-opacity">
                      Ir para o Histórico
                    </button>
                  )}

                  {savedToAgenda && (
                    <div className="space-y-2 mb-5 text-left">
                      <p className={LABEL}>Exportar para calendário <span className="font-normal text-mauve/50 normal-case">(opcional)</span></p>
                      <button onClick={handleGoogle} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border border-border hover:border-petal/40 hover:bg-blush/30 transition-all">
                        <span className="font-body text-sm text-onyx flex-1 text-left">Google Calendar</span><ExternalLink size={13} className="text-mauve/50" />
                      </button>
                      <button onClick={handleOutlook} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border border-border hover:border-petal/40 hover:bg-blush/30 transition-all">
                        <span className="font-body text-sm text-onyx flex-1 text-left">Outlook / Microsoft</span><ExternalLink size={13} className="text-mauve/50" />
                      </button>
                      <button onClick={handleICS} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border border-border hover:border-petal/40 hover:bg-blush/30 transition-all">
                        <div className="w-[18px] h-[18px] rounded flex items-center justify-center bg-sage-light flex-shrink-0"><Download size={11} className="text-sage" /></div>
                        <span className="font-body text-sm text-onyx flex-1 text-left">Baixar .ics</span><span className="font-body text-[10px] text-mauve/50">Apple, outros</span>
                      </button>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button onClick={addAnother} className="flex-1 py-2.5 rounded-xl border border-border text-mauve text-sm font-body hover:border-petal/40 transition-colors">Adicionar outro</button>
                    <button onClick={handleClose} className="flex-1 py-2.5 rounded-xl gradient-sintera text-white text-sm font-body hover:opacity-90 transition-opacity">Concluir</button>
                  </div>
                </div>
              ) : (
                <div className="px-6 py-5 space-y-4">
                  {/* ── Essenciais (registrar em < 1 min) ────────── */}
                  <div className="space-y-2">
                    <label className={LABEL}>Tipo</label>
                    <div className="grid grid-cols-3 gap-2">
                      {EVENT_TYPE_DEFS.map(t => (
                        <button key={t.id} type="button" onClick={() => chooseType(t.id)}
                          className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-body font-medium transition-all ${eventType === t.id ? 'gradient-sintera text-white border-transparent shadow-sm' : 'border-border text-mauve hover:border-petal/40'}`}>
                          <span className="text-base">{t.emoji}</span>{t.label}
                        </button>
                      ))}
                    </div>
                    {eventType === 'consulta' && (
                      <label className="flex items-center gap-2 px-1 pt-1 cursor-pointer select-none">
                        <input type="checkbox" checked={isReturn} onChange={e => setIsReturn(e.target.checked)} className="w-4 h-4 rounded border-border accent-petal" />
                        <span className="font-body text-xs text-onyx/80">É um retorno</span>
                      </label>
                    )}
                    {eventType === 'procedimento' && (
                      <label className="flex items-center gap-2 px-1 pt-1 cursor-pointer select-none">
                        <input type="checkbox" checked={isSurgery} onChange={e => setIsSurgery(e.target.checked)} className="w-4 h-4 rounded border-border accent-petal" />
                        <span className="font-body text-xs text-onyx/80">É uma cirurgia</span>
                      </label>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className={LABEL}>Título</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                      placeholder={professionalName.trim() ? `${typeLabel} — ${professionalName.trim()}` : `${typeLabel} de Saúde`} className={FIELD} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5"><label className={LABEL}>Data</label>
                      {/* Sem min: permite data retroativa (lançar algo já feito, p/ controle anual). */}
                      <input type="date" value={date} onChange={e => onDateChange(e.target.value)} className={FIELD} /></div>
                    <div className="space-y-1.5"><label className={LABEL}>Horário</label>
                      <input type="time" value={time} onChange={e => setTime(e.target.value)} className={FIELD} /></div>
                  </div>

                  {/* Status (Agendado/Realizado/Cancelado) */}
                  <div className="space-y-1.5">
                    <label className={LABEL}>Status</label>
                    <div className="flex gap-2">
                      {EVENT_STATUS_UI.map(s => (
                        <button key={s.id} type="button" onClick={() => setStatus(s.id as EventStatusInput)}
                          className={`flex-1 py-2 rounded-xl text-xs font-body font-medium border transition-all ${status === s.id ? 'gradient-sintera text-white border-transparent shadow-sm' : 'border-border text-mauve hover:border-petal/40'}`}>{s.label}</button>
                      ))}
                    </div>
                    {date && date < today && status === 'realizado' && (
                      <p className="font-body text-[11px] text-gold">ℹ Como a data está no passado, o sistema marcou automaticamente como <strong>Realizado</strong> (vai ao Histórico e Gastos, não fica na Agenda). Mude o status acima se quiser agendá-lo.</p>
                    )}
                  </div>

                  {/* Valor + modelo do dinheiro (explícito) */}
                  <div className="space-y-1.5">
                    <label className={LABEL}>Valor — R$ <span className="font-normal text-mauve/50 normal-case">(opc.)</span></label>
                    <input type="text" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} placeholder="250,00" className={FIELD} />
                    <p className="font-body text-[11px] text-mauve/60">Entra em <strong>Gastos</strong> quando o status for <strong>Realizado</strong> — ou marque como <strong>despesa direta</strong> (em Mais detalhes).</p>
                  </div>

                  {/* ── Mais detalhes ────────────────────────────── */}
                  <button type="button" onClick={() => setShowDetails(v => !v)}
                    className="w-full flex items-center justify-between px-1 py-1.5 font-body text-sm text-petal hover:text-petal/80 transition-colors">
                    <span>Mais detalhes</span>
                    <ChevronDown size={16} className={`transition-transform ${showDetails ? 'rotate-180' : ''}`} />
                  </button>

                  {showDetails && (
                    <div className="space-y-4 pt-1 border-t border-border/40">
                      {/* Repetir (recorrência única para qualquer tipo) */}
                      <div className="space-y-1.5 pt-3">
                        <label className={LABEL}>Repetir</label>
                        <select value={recurrence} onChange={e => setRecurrence(e.target.value as RecurrenceFreq)} className={FIELD}>
                          {RECURRENCE_OPTS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                        </select>
                        {recurrence !== 'none' && (
                          <div className="flex items-center gap-2 pt-1">
                            <span className="font-body text-xs text-mauve/70">até (opcional):</span>
                            <input type="date" value={recurrenceUntil} min={date || today} onChange={e => setRecurrenceUntil(e.target.value)}
                              className="flex-1 px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx focus:outline-none focus:ring-1 focus:ring-petal/40" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5"><label className={LABEL}>Profissional <span className="font-normal text-mauve/50 normal-case">(opc.)</span></label>
                        <input type="text" value={professionalName} onChange={e => setProfessionalName(e.target.value)} placeholder="Dr(a). …" className={FIELD} /></div>

                      {eventType === 'plano' && (
                        <div className="grid grid-cols-2 gap-3 pt-3">
                          <div className="space-y-1.5"><label className={LABEL}>Operadora</label>
                            <input type="text" value={operadora} onChange={e => setOperadora(e.target.value)} placeholder="Ex.: Unimed" className={FIELD} /></div>
                          <div className="space-y-1.5"><label className={LABEL}>Carteirinha</label>
                            <input type="text" value={carteirinha} onChange={e => setCarteirinha(e.target.value)} className={FIELD} /></div>
                        </div>
                      )}

                      <div className="space-y-1.5"><label className={LABEL}>Formato</label>
                        <div className="flex gap-2">
                          {([['', '—'], ['presencial', 'Presencial'], ['telemedicina', 'Teleconsulta']] as [EventModality, string][]).map(([v, l]) => (
                            <button key={v} type="button" onClick={() => setModality(v)}
                              className={`flex-1 py-2 rounded-xl text-xs font-body font-medium border transition-all ${modality === v ? 'gradient-sintera text-white border-transparent shadow-sm' : 'border-border text-mauve hover:border-petal/40'}`}>{l}</button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5"><label className={LABEL}>Local <span className="font-normal text-mauve/50 normal-case">(clínica / endereço)</span></label>
                        <input type="text" value={establishment} onChange={e => setEstablishment(e.target.value)} placeholder="Clínica, hospital, endereço…" className={FIELD} /></div>

                      <div className="space-y-1.5"><label className={LABEL}>Prioridade</label>
                        <div className="flex gap-1.5">
                          {([['', '—'], ['alta', 'Alta'], ['media', 'Média'], ['baixa', 'Baixa']] as [PriorityInput, string][]).map(([v, l]) => (
                            <button key={v} type="button" onClick={() => setPriority(v)}
                              className={`flex-1 py-2 rounded-lg text-[11px] font-body font-medium border transition-all ${priority === v ? 'gradient-sintera text-white border-transparent' : 'border-border text-mauve hover:border-petal/40'}`}>{l}</button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5"><label className={LABEL}>Orientações de preparo</label>
                        <input type="text" value={preparation} onChange={e => setPreparation(e.target.value)} placeholder="Ex.: jejum de 8h" className={FIELD} /></div>

                      {status === 'realizado' && (
                        <div className="space-y-1.5"><label className={LABEL}>Como foi</label>
                          <textarea value={outcome} onChange={e => setOutcome(e.target.value)} rows={2} placeholder="Resumo, conduta, encaminhamentos…" className={`${FIELD} resize-none`} /></div>
                      )}

                      <div className="space-y-1.5"><label className={LABEL}>Duração estimada</label>
                        <div className="flex gap-2">
                          {[{ v: '30', l: '30 min' }, { v: '60', l: '1h' }, { v: '90', l: '1h30' }, { v: '120', l: '2h' }].map(opt => (
                            <button key={opt.v} type="button" onClick={() => setDuration(opt.v)}
                              className={`flex-1 py-2 rounded-xl text-xs font-body font-medium border transition-all ${duration === opt.v ? 'gradient-sintera text-white border-transparent shadow-sm' : 'border-border text-mauve hover:border-petal/40'}`}>{opt.l}</button>
                          ))}
                        </div></div>

                      <div className="space-y-1.5"><label className={LABEL}>Observações</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Ex.: levar laudos anteriores…" className={`${FIELD} resize-none`} /></div>

                      <div className="space-y-1.5"><label className={LABEL}>Nota fiscal / comprovante / anexo <span className="font-normal text-mauve/50 normal-case">(PDF, JPG, PNG)</span></label>
                        <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setAttachmentFile(e.target.files?.[0] ?? null)}
                          className="block w-full text-xs font-body text-mauve file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:bg-blush file:text-petal file:font-medium" />
                        {initialEvent?.attachmentUrl && !attachmentFile && (
                          <p className="font-body text-[11px] text-mauve/60">Anexo atual mantido. Escolha um arquivo para substituir.</p>
                        )}
                      </div>

                      <label className="flex items-center gap-2.5 px-1 cursor-pointer select-none">
                        <input type="checkbox" checked={directExpense} onChange={e => setDirectExpense(e.target.checked)} className="w-4 h-4 rounded border-border accent-petal" />
                        <span className="font-body text-xs text-onyx/80">Despesa direta — conta em Gastos sem precisar concluir (plano, academia, compra…)</span>
                      </label>
                      {directExpense && status !== 'realizado' && (
                        <p className="font-body text-[11px] text-mauve/60 px-1">Aparece na <strong>Agenda</strong> (previsão) e já entra em <strong>Gastos</strong>, mesmo antes de concluir.</p>
                      )}
                    </div>
                  )}

                  {/* Salvar + lembrete */}
                  {onSave && (
                    <div className="pt-1 space-y-2.5">
                      <label className="flex items-center gap-2.5 px-1 cursor-pointer select-none">
                        <input type="checkbox" checked={reminderEnabled} onChange={e => setReminderEnabled(e.target.checked)} className="w-4 h-4 rounded border-border accent-petal" />
                        <span className="font-body text-xs text-onyx/80">Receber lembrete por e-mail no dia anterior</span>
                      </label>
                      <button onClick={handleSave} disabled={!canExport || saving}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl gradient-sintera text-white text-sm font-body font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                        {saving ? <><Loader2 size={15} className="animate-spin" /> Salvando…</> : <><Check size={15} /> {isEditing ? 'Salvar alterações' : 'Salvar na minha agenda'}</>}
                      </button>
                      {saveError && (
                        <p className="font-body text-xs text-red-500 text-center px-2">{saveError}</p>
                      )}
                    </div>
                  )}

                  {/* Exportar para um calendário externo (Google/Outlook/.ics). Fica NO
                      formulário (não num painel pós-salvar, que as telas fechavam → BUG
                      FND-1). No modo Agenda é opcional e independente do "Salvar". */}
                  <div className="space-y-2 pt-1">
                    <p className={LABEL}>{onSave ? 'Exportar para o calendário (opcional)' : 'Adicionar ao calendário'}</p>
                    <button onClick={handleGoogle} disabled={!canExport} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border hover:border-petal/40 hover:bg-blush/30 disabled:opacity-40 transition-all">
                      <span className="font-body text-sm text-onyx flex-1 text-left">Google Calendar</span><ExternalLink size={13} className="text-mauve/50" />
                    </button>
                    <button onClick={handleOutlook} disabled={!canExport} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border hover:border-petal/40 hover:bg-blush/30 disabled:opacity-40 transition-all">
                      <span className="font-body text-sm text-onyx flex-1 text-left">Outlook / Microsoft</span><ExternalLink size={13} className="text-mauve/50" />
                    </button>
                    <button onClick={handleICS} disabled={!canExport} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border hover:border-petal/40 hover:bg-blush/30 disabled:opacity-40 transition-all">
                      <div className="w-[18px] h-[18px] rounded flex items-center justify-center bg-sage-light flex-shrink-0"><Download size={11} className="text-sage" /></div>
                      <span className="font-body text-sm text-onyx flex-1 text-left">Baixar .ics</span><span className="font-body text-[10px] text-mauve/50">Apple, outros</span>
                    </button>
                    {!canExport && <p className="font-body text-xs text-mauve/50 text-center">Selecione uma data para continuar</p>}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

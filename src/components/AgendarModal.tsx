'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, Download, ExternalLink, CalendarDays, Loader2, Check } from 'lucide-react'

export type EventType = 'exame' | 'consulta' | 'retorno' | 'medicacao' | 'outro'

/** Dados de um evento, usados para salvar na agenda da plataforma. */
export interface AgendaEventInput {
  eventType: EventType
  title: string
  date: string         // 'YYYY-MM-DD'
  time: string         // 'HH:mm'
  durationMin: number
  notes: string
  reminderEnabled: boolean
}

interface AgendarModalProps {
  open: boolean
  onClose: () => void
  defaultTitle?: string   // pré-preenche o título (ex: "Repetir Hemograma")
  defaultNotes?: string   // pré-preenche as notas
  // Persistência na agenda (Fase 1). Quando fornecido, exibe "Salvar na minha agenda".
  onSave?: (data: AgendaEventInput) => Promise<void> | void
  // Pré-preenche o formulário ao editar um evento existente.
  initialEvent?: Partial<AgendaEventInput>
}

const EVENT_TYPES: { id: EventType; label: string; emoji: string }[] = [
  { id: 'exame',     label: 'Exame',     emoji: '🧪' },
  { id: 'consulta',  label: 'Consulta',  emoji: '👩‍⚕️' },
  { id: 'retorno',   label: 'Retorno',   emoji: '📋' },
  { id: 'medicacao', label: 'Medicação', emoji: '💊' },
  { id: 'outro',     label: 'Outro',     emoji: '📅' },
]

function formatGoogleDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

function formatICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

function formatOutlookDate(date: Date): string {
  return date.toISOString().split('.')[0]
}

function buildGoogleCalendarUrl(title: string, start: Date, end: Date, details: string): string {
  const params = new URLSearchParams({
    action:  'TEMPLATE',
    text:    title,
    dates:   `${formatGoogleDate(start)}/${formatGoogleDate(end)}`,
    details: details,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

function buildOutlookUrl(title: string, start: Date, end: Date, body: string): string {
  const params = new URLSearchParams({
    subject:  title,
    startdt:  formatOutlookDate(start),
    enddt:    formatOutlookDate(end),
    body:     body,
    path:     '/calendar/action/compose',
    rru:      'addevent',
  })
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`
}

function buildICS(title: string, start: Date, end: Date, description: string): string {
  const uid = `sintera-${Date.now()}@sintera.app`
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SINTERA//Agenda de Saúde//PT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `SUMMARY:${title}`,
    `DTSTART:${formatICSDate(start)}`,
    `DTEND:${formatICSDate(end)}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
    `DTSTAMP:${formatICSDate(new Date())}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

function downloadICS(ics: string, filename: string) {
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function AgendarModal({ open, onClose, defaultTitle = '', defaultNotes = '', onSave, initialEvent }: AgendarModalProps) {
  const today = new Date().toISOString().split('T')[0]

  const [eventType, setEventType]   = useState<EventType>('exame')
  const [title, setTitle]           = useState(defaultTitle)
  const [date, setDate]             = useState('')
  const [time, setTime]             = useState('08:00')
  const [duration, setDuration]     = useState('60')
  const [notes, setNotes]           = useState(defaultNotes)
  const [reminderEnabled, setReminderEnabled] = useState(true)
  const [added, setAdded]           = useState(false)
  const [saving, setSaving]         = useState(false)

  // Sincroniza o formulário ao abrir (suporta edição via initialEvent).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open) return
    setEventType(initialEvent?.eventType ?? 'exame')
    setTitle(initialEvent?.title ?? defaultTitle)
    setDate(initialEvent?.date ?? '')
    setTime(initialEvent?.time ?? '08:00')
    setDuration(initialEvent?.durationMin ? String(initialEvent.durationMin) : '60')
    setNotes(initialEvent?.notes ?? defaultNotes)
    setReminderEnabled(initialEvent?.reminderEnabled ?? true)
    setAdded(false)
    setSaving(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])
  /* eslint-enable react-hooks/set-state-in-effect */

  const typeLabel = EVENT_TYPES.find(t => t.id === eventType)?.label ?? 'Evento'
  const fullTitle = title.trim() || `${typeLabel} de Saúde`

  function buildDates() {
    const start = new Date(`${date}T${time}:00`)
    const end   = new Date(start.getTime() + parseInt(duration) * 60 * 1000)
    return { start, end }
  }

  function buildDescription(): string {
    const lines = ['Agendado via SINTERA — plataforma de organização de dados de saúde.']
    if (notes.trim()) lines.push('', notes.trim())
    lines.push('', 'SINTERA não oferece diagnóstico ou orientação clínica.')
    return lines.join('\n')
  }

  function handleGoogle() {
    const { start, end } = buildDates()
    const url = buildGoogleCalendarUrl(fullTitle, start, end, buildDescription())
    window.open(url, '_blank', 'noopener,noreferrer')
    setAdded(true)
  }

  function handleOutlook() {
    const { start, end } = buildDates()
    const url = buildOutlookUrl(fullTitle, start, end, buildDescription())
    window.open(url, '_blank', 'noopener,noreferrer')
    setAdded(true)
  }

  function handleICS() {
    const { start, end } = buildDates()
    const ics = buildICS(fullTitle, start, end, buildDescription())
    downloadICS(ics, `sintera_${fullTitle.toLowerCase().replace(/\s+/g, '_')}.ics`)
    setAdded(true)
  }

  async function handleSave() {
    if (!onSave || !canExport || saving) return
    setSaving(true)
    try {
      await onSave({
        eventType,
        title: fullTitle,
        date,
        time,
        durationMin: parseInt(duration),
        notes: notes.trim(),
        reminderEnabled,
      })
      handleClose()
    } catch {
      setSaving(false)
    }
  }

  const canExport = date !== ''

  function handleClose() {
    setAdded(false)
    setTitle(defaultTitle)
    setDate('')
    setTime('08:00')
    setDuration('60')
    setNotes(defaultNotes)
    setEventType('exame')
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{   opacity: 0, scale: 0.95, y: 20  }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed inset-x-4 bottom-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 w-full sm:max-w-md"
          >
            <div className="bg-white rounded-3xl shadow-2xl border border-border overflow-hidden">

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-blush flex items-center justify-center">
                    <CalendarDays size={17} className="text-petal" />
                  </div>
                  <div>
                    <p className="font-body text-sm font-semibold text-onyx">Adicionar à agenda</p>
                    <p className="font-body text-xs text-mauve">Google, Outlook ou qualquer calendário</p>
                  </div>
                </div>
                <button onClick={handleClose} className="text-mauve hover:text-onyx transition-colors">
                  <X size={17} />
                </button>
              </div>

              {added ? (
                /* Confirmação */
                <div className="px-6 py-8 text-center">
                  <div className="w-14 h-14 rounded-full bg-sage-light flex items-center justify-center mx-auto mb-3">
                    <Calendar size={24} className="text-sage" />
                  </div>
                  <p className="font-body text-sm font-semibold text-onyx mb-1">Evento criado!</p>
                  <p className="font-body text-xs text-mauve mb-5">
                    O evento foi adicionado ao seu calendário.
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => setAdded(false)}
                      className="flex-1 py-2.5 rounded-xl border border-border text-mauve text-sm font-body hover:border-petal/40 transition-colors">
                      Adicionar outro
                    </button>
                    <button onClick={handleClose}
                      className="flex-1 py-2.5 rounded-xl gradient-sintera text-white text-sm font-body hover:opacity-90 transition-opacity">
                      Fechar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="px-6 py-5 space-y-4">

                  {/* Tipo de evento */}
                  <div className="space-y-2">
                    <label className="font-body text-xs font-semibold text-onyx/60 uppercase tracking-wider">Tipo</label>
                    <div className="grid grid-cols-4 gap-2">
                      {EVENT_TYPES.map(t => (
                        <button key={t.id} onClick={() => setEventType(t.id)}
                          className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-body font-medium transition-all ${
                            eventType === t.id
                              ? 'gradient-sintera text-white border-transparent shadow-sm'
                              : 'border-border text-mauve hover:border-petal/40'
                          }`}>
                          <span className="text-base">{t.emoji}</span>
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Título */}
                  <div className="space-y-1.5">
                    <label className="font-body text-xs font-semibold text-onyx/60 uppercase tracking-wider">Título</label>
                    <input
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder={`${typeLabel} de Saúde`}
                      className="w-full px-3 py-2.5 border border-border rounded-xl font-body text-sm text-onyx placeholder:text-mauve/40 focus:outline-none focus:ring-1 focus:ring-petal/40 transition-colors"
                    />
                  </div>

                  {/* Data e hora */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="font-body text-xs font-semibold text-onyx/60 uppercase tracking-wider">Data</label>
                      <input
                        type="date"
                        value={date}
                        min={today}
                        onChange={e => setDate(e.target.value)}
                        className="w-full px-3 py-2.5 border border-border rounded-xl font-body text-sm text-onyx focus:outline-none focus:ring-1 focus:ring-petal/40 transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-body text-xs font-semibold text-onyx/60 uppercase tracking-wider">Horário</label>
                      <input
                        type="time"
                        value={time}
                        onChange={e => setTime(e.target.value)}
                        className="w-full px-3 py-2.5 border border-border rounded-xl font-body text-sm text-onyx focus:outline-none focus:ring-1 focus:ring-petal/40 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Duração */}
                  <div className="space-y-1.5">
                    <label className="font-body text-xs font-semibold text-onyx/60 uppercase tracking-wider">Duração estimada</label>
                    <div className="flex gap-2">
                      {[
                        { v: '30',  l: '30 min' },
                        { v: '60',  l: '1 hora'  },
                        { v: '90',  l: '1h30'    },
                        { v: '120', l: '2 horas'  },
                      ].map(opt => (
                        <button key={opt.v} onClick={() => setDuration(opt.v)}
                          className={`flex-1 py-2 rounded-xl text-xs font-body font-medium border transition-all ${
                            duration === opt.v
                              ? 'gradient-sintera text-white border-transparent shadow-sm'
                              : 'border-border text-mauve hover:border-petal/40'
                          }`}>
                          {opt.l}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notas */}
                  <div className="space-y-1.5">
                    <label className="font-body text-xs font-semibold text-onyx/60 uppercase tracking-wider">
                      Observações <span className="font-normal text-mauve/50 normal-case">(opcional)</span>
                    </label>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      rows={2}
                      placeholder="Ex: Levar laudos anteriores, em jejum de 12h…"
                      className="w-full px-3 py-2.5 border border-border rounded-xl font-body text-sm text-onyx placeholder:text-mauve/40 resize-none focus:outline-none focus:ring-1 focus:ring-petal/40 transition-colors"
                    />
                  </div>

                  {/* Salvar na agenda da plataforma (Fase 1) + lembrete (Fase 2) */}
                  {onSave && (
                    <div className="pt-1 space-y-2.5">
                      <label className="flex items-center gap-2.5 px-1 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={reminderEnabled}
                          onChange={e => setReminderEnabled(e.target.checked)}
                          className="w-4 h-4 rounded border-border accent-petal"
                        />
                        <span className="font-body text-xs text-onyx/80">
                          Receber lembrete por e-mail no dia anterior
                        </span>
                      </label>
                      <button
                        onClick={handleSave}
                        disabled={!canExport || saving}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl gradient-sintera text-white text-sm font-body font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                        {saving
                          ? <><Loader2 size={15} className="animate-spin" /> Salvando…</>
                          : <><Check size={15} /> {initialEvent ? 'Salvar alterações' : 'Salvar na minha agenda'}</>}
                      </button>
                      <p className="font-body text-[11px] text-mauve/60 text-center">
                        Fica guardado aqui e você ainda pode exportar abaixo.
                      </p>
                    </div>
                  )}

                  {/* Botões de export */}
                  <div className="space-y-2 pt-1">
                    <p className="font-body text-xs font-semibold text-onyx/60 uppercase tracking-wider">
                      {onSave ? 'Exportar para calendário' : 'Adicionar ao calendário'}
                    </p>

                    <button
                      onClick={handleGoogle}
                      disabled={!canExport}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border hover:border-petal/40 hover:bg-blush/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="#fff"/>
                        <path d="M17.64 12.204c0-.4-.036-.784-.104-1.156H12v2.187h3.144a2.687 2.687 0 01-1.166 1.763v1.465h1.889c1.105-1.018 1.744-2.516 1.744-4.259z" fill="#4285F4"/>
                        <path d="M12 18c1.575 0 2.896-.522 3.862-1.413l-1.888-1.465c-.523.35-1.192.557-1.974.557-1.517 0-2.8-1.025-3.258-2.4H6.796v1.513A5.997 5.997 0 0012 18z" fill="#34A853"/>
                        <path d="M8.742 13.279A3.603 3.603 0 018.555 12c0-.445.076-.876.187-1.279V9.208H6.796A5.997 5.997 0 006 12c0 .967.232 1.88.796 2.792l1.946-1.513z" fill="#FBBC05"/>
                        <path d="M12 8.321c.856 0 1.623.295 2.227.873l1.67-1.67C14.892 6.52 13.572 6 12 6a5.997 5.997 0 00-5.204 3.208l1.946 1.513C9.2 9.346 10.483 8.321 12 8.321z" fill="#EA4335"/>
                      </svg>
                      <span className="font-body text-sm text-onyx flex-1 text-left">Google Calendar</span>
                      <ExternalLink size={13} className="text-mauve/50" />
                    </button>

                    <button
                      onClick={handleOutlook}
                      disabled={!canExport}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border hover:border-petal/40 hover:bg-blush/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <rect width="24" height="24" rx="4" fill="#0078D4"/>
                        <path d="M13 6h6v12h-6V6z" fill="#50D9FF" opacity=".8"/>
                        <path d="M5 6h8v12H5V6z" fill="white"/>
                        <rect x="6.5" y="7.5" width="5" height="1.5" rx=".75" fill="#0078D4"/>
                        <rect x="6.5" y="10" width="5" height="1.5" rx=".75" fill="#0078D4"/>
                        <rect x="6.5" y="12.5" width="3.5" height="1.5" rx=".75" fill="#0078D4"/>
                      </svg>
                      <span className="font-body text-sm text-onyx flex-1 text-left">Outlook / Microsoft</span>
                      <ExternalLink size={13} className="text-mauve/50" />
                    </button>

                    <button
                      onClick={handleICS}
                      disabled={!canExport}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border hover:border-petal/40 hover:bg-blush/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                      <div className="w-[18px] h-[18px] rounded flex items-center justify-center bg-sage-light flex-shrink-0">
                        <Download size={11} className="text-sage" />
                      </div>
                      <span className="font-body text-sm text-onyx flex-1 text-left">Baixar .ics</span>
                      <span className="font-body text-[10px] text-mauve/50">Apple, outros</span>
                    </button>

                    {!canExport && (
                      <p className="font-body text-xs text-mauve/50 text-center">Selecione uma data para continuar</p>
                    )}
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

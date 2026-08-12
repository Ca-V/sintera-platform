// @sintera/core — export de evento para o calendário (mecanismo cross-platform sem
// dependência nativa: URL do Google Calendar, aberta por Linking no Mobile e por link na
// Web). PURO e determinístico: monta a partir de date/time/durationMin, sem relógio ambiente.
import type { HealthEvent } from './event'

function pad(n: number): string { return String(n).padStart(2, '0') }

type CalendarEventInput = Pick<HealthEvent, 'title' | 'date' | 'time' | 'durationMin' | 'notes' | 'establishment' | 'location'>

/**
 * URL do Google Calendar (action=TEMPLATE) para adicionar o evento.
 * - Com horário: intervalo `YYYYMMDDTHHMMSS/YYYYMMDDTHHMMSS` (hora local; duração = durationMin ou 60min).
 * - Sem horário: evento de dia inteiro `YYYYMMDD/YYYYMMDD(+1)` (fim exclusivo do Google).
 */
export function googleCalendarUrl(ev: CalendarEventInput): string {
  const title = ev.title?.trim() || 'Evento'
  const details = [ev.notes, ev.establishment, ev.location].map(s => s?.trim()).filter(Boolean).join(' · ')
  let dates: string
  if (ev.time) {
    const [y, m, d] = ev.date.split('-').map(Number)
    const [hh, mm] = ev.time.slice(0, 5).split(':').map(Number)
    const startMin = hh * 60 + mm
    const endMin = startMin + (ev.durationMin && ev.durationMin > 0 ? ev.durationMin : 60)
    const stamp = (mins: number) => `${y}${pad(m)}${pad(d)}T${pad(Math.floor(mins / 60) % 24)}${pad(mins % 60)}00`
    dates = `${stamp(startMin)}/${stamp(endMin)}`
  } else {
    const [y, m, d] = ev.date.split('-').map(Number)
    const start = `${y}${pad(m)}${pad(d)}`
    // Fim exclusivo (dia seguinte) — usa aritmética de data UTC (sem relógio ambiente).
    const next = new Date(Date.UTC(y, m - 1, d + 1))
    const end = `${next.getUTCFullYear()}${pad(next.getUTCMonth() + 1)}${pad(next.getUTCDate())}`
    dates = `${start}/${end}`
  }
  const params = new URLSearchParams({ action: 'TEMPLATE', text: title, dates })
  if (details) params.set('details', details)
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

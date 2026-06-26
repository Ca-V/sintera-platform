import { describe, it, expect } from 'vitest'
import { formatDateBR, formatTimeBR, eventToNotificationInput, rowToHealthEvent, agendaRowToHealthEvent, type HealthEvent, type HealthEventRow } from './event'
import { buildEventNotification, notificationToInline } from './notification'

function event(p: Partial<HealthEvent>): HealthEvent {
  return {
    id: 'e1', type: 'consulta', title: 'Consulta de Cardiologia', status: 'planejado',
    date: '2026-07-18', time: '14:30:00', durationMin: null, reminderEnabled: true, reminderSentAt: null,
    professionalKind: 'medico', professionalName: 'Dr. João Silva',
    establishment: 'Clínica ABC', location: null, modality: 'presencial', preparation: null,
    notes: null, amountCents: null, attachmentUrl: null, links: [], recurrenceRule: null,
    seriesId: null, completedAt: null, ...p,
  }
}

describe('formatadores puros', () => {
  it('formatDateBR YYYY-MM-DD -> DD/MM/YYYY', () => {
    expect(formatDateBR('2026-07-18')).toBe('18/07/2026')
    expect(formatDateBR('')).toBe('')
  })
  it('formatTimeBR HH:MM[:SS] -> HH:MM; vazio -> null', () => {
    expect(formatTimeBR('14:30:00')).toBe('14:30')
    expect(formatTimeBR('09:05')).toBe('09:05')
    expect(formatTimeBR(null)).toBeNull()
  })
})

describe('rowToHealthEvent (mapeador DB → domínio)', () => {
  const row: HealthEventRow = {
    id: 'e1', event_type: 'consulta', title: 'Consulta', status: 'confirmado',
    event_date: '2026-07-18', event_time: '14:30:00', professional_name: 'Dr. João',
    establishment: 'Clínica ABC', modality: 'presencial', preparation: 'Jejum',
    links: [{ kind: 'exam', id: 'x1' }], amount_cents: 25000,
  }
  it('mapeia snake_case → domínio e preserva links/valores', () => {
    const ev = rowToHealthEvent(row)
    expect(ev.type).toBe('consulta')
    expect(ev.status).toBe('confirmado')
    expect(ev.professionalName).toBe('Dr. João')
    expect(ev.modality).toBe('presencial')
    expect(ev.links).toEqual([{ kind: 'exam', id: 'x1' }])
    expect(ev.amountCents).toBe(25000)
  })
  it('tolera status/modality inesperados e links não-array', () => {
    const ev = rowToHealthEvent({ ...row, status: 'xpto', modality: 'foo', links: null })
    expect(ev.status).toBe('planejado')
    expect(ev.modality).toBeNull()
    expect(ev.links).toEqual([])
  })
})

describe('agendaRowToHealthEvent (adaptador legado agenda_events → domínio)', () => {
  it('mapeia status legado pending/done/cancelled → enum canônico', () => {
    expect(agendaRowToHealthEvent({ id: 'a', event_type: 'exame', title: 'Hemograma', event_date: '2026-07-01', status: 'pending' }).status).toBe('planejado')
    expect(agendaRowToHealthEvent({ id: 'b', event_type: 'exame', title: 'X', event_date: '2026-07-01', status: 'done' }).status).toBe('realizado')
    expect(agendaRowToHealthEvent({ id: 'c', event_type: 'exame', title: 'X', event_date: '2026-07-01', status: 'cancelled' }).status).toBe('cancelado')
    expect(agendaRowToHealthEvent({ id: 'd', event_type: 'exame', title: 'X', event_date: '2026-07-01', status: 'xyz' }).status).toBe('planejado')
  })
  it('expõe o mesmo HealthEvent (campos de agendamento preservados)', () => {
    const ev = agendaRowToHealthEvent({ id: 'a', event_type: 'consulta', title: 'Cardio', event_date: '2026-07-18', event_time: '14:30:00', duration_min: 30, reminder_enabled: false })
    expect(ev.time).toBe('14:30:00')
    expect(ev.durationMin).toBe(30)
    expect(ev.reminderEnabled).toBe(false)
  })
})

describe('eventToNotificationInput (projeção de domínio)', () => {
  it('projeta o evento e o formatter gera a linha completa', () => {
    const n = buildEventNotification(eventToNotificationInput(event({})))
    expect(notificationToInline(n)).toBe('📅 18/07/2026 · 🕒 14:30 · 👨‍⚕️ Dr. João Silva · 📍 Clínica ABC')
  })

  it('teleconsulta sem local projeta modalidade', () => {
    const n = buildEventNotification(eventToNotificationInput(event({
      modality: 'telemedicina', establishment: null, professionalName: 'Dra. Ana', time: '09:00',
    })))
    expect(notificationToInline(n)).toBe('📅 18/07/2026 · 🕒 09:00 · 💻 Telemedicina · 👨‍⚕️ Dra. Ana')
  })

  it('sem horário e sem profissional omite as linhas', () => {
    const n = buildEventNotification(eventToNotificationInput(event({ time: null, professionalName: null })))
    expect(n.lines.some(l => l.icon === '🕒')).toBe(false)
    expect(n.lines.some(l => l.icon === '👨‍⚕️')).toBe(false)
  })
})

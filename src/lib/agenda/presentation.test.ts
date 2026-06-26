import { describe, it, expect } from 'vitest'
import { formatDateBR, formatTimeBR, eventToNotificationInput, typeLabel } from './presentation'
import { buildEventNotification, notificationToInline } from './notification'
import type { HealthEvent } from './event'

function ev(p: Partial<HealthEvent>): HealthEvent {
  return {
    id: 'e1', type: 'consulta', title: 'Consulta de Cardiologia', status: 'planejado', source: 'manual',
    date: '2026-07-18', time: '14:30:00', durationMin: null, reminderEnabled: true, reminderSentAt: null,
    professionalKind: 'medico', professionalName: 'Dr. João Silva', establishment: 'Clínica ABC',
    location: null, modality: 'presencial', preparation: null, notes: null, amountCents: null,
    attachmentUrl: null, links: [], recurrenceRule: null, seriesId: null,
    parentEventId: null, rootEventId: null, completedAt: null, ...p,
  }
}

describe('formatadores de apresentação', () => {
  it('formatDateBR / formatTimeBR / typeLabel', () => {
    expect(formatDateBR('2026-07-18')).toBe('18/07/2026')
    expect(formatTimeBR('14:30:00')).toBe('14:30')
    expect(formatTimeBR(null)).toBeNull()
    expect(typeLabel('exame')).toBe('Exame')
    expect(typeLabel('desconhecido')).toBe('Evento')
  })
})

describe('eventToNotificationInput → buildEventNotification (REQ-NOTIF-001)', () => {
  it('presencial com todos os campos principais', () => {
    const n = buildEventNotification(eventToNotificationInput(ev({})))
    expect(notificationToInline(n)).toBe('📅 18/07/2026 · 🕒 14:30 · 👨‍⚕️ Dr. João Silva · 📍 Clínica ABC')
  })
  it('teleconsulta sem local projeta modalidade', () => {
    const n = buildEventNotification(eventToNotificationInput(ev({ modality: 'telemedicina', establishment: null, professionalName: 'Dra. Ana', time: '09:00' })))
    expect(notificationToInline(n)).toBe('📅 18/07/2026 · 🕒 09:00 · 💻 Telemedicina · 👨‍⚕️ Dra. Ana')
  })
  it('sem horário e sem profissional omite as linhas', () => {
    const n = buildEventNotification(eventToNotificationInput(ev({ time: null, professionalName: null })))
    expect(n.lines.some(l => l.icon === '🕒')).toBe(false)
    expect(n.lines.some(l => l.icon === '👨‍⚕️')).toBe(false)
  })
})

import { describe, it, expect } from 'vitest'
import { formatDateBR, formatTimeBR, eventToNotificationInput, type HealthEvent } from './event'
import { buildEventNotification, notificationToInline } from './notification'

function event(p: Partial<HealthEvent>): HealthEvent {
  return {
    id: 'e1', type: 'consulta', title: 'Consulta de Cardiologia', status: 'planejado',
    date: '2026-07-18', time: '14:30:00', professionalKind: 'medico', professionalName: 'Dr. João Silva',
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

import { describe, it, expect } from 'vitest'
import { buildEventNotification, notificationToInline } from './notification'

const base = { typeLabel: 'Consulta', title: 'Consulta de Cardiologia', dateLabel: '18/07/2026' }

describe('buildEventNotification (REQ-NOTIF-001)', () => {
  it('consulta presencial com data, horário, profissional e estabelecimento', () => {
    const n = buildEventNotification({
      ...base, timeLabel: '14:30', professional: 'Dr. João Silva',
      establishment: 'Clínica ABC', modality: 'presencial',
    })
    expect(notificationToInline(n)).toBe('📅 18/07/2026 · 🕒 14:30 · 👨‍⚕️ Dr. João Silva · 📍 Clínica ABC')
  })

  it('teleconsulta mostra modalidade e não inventa local', () => {
    const n = buildEventNotification({ ...base, timeLabel: '09:00', professional: 'Dra. Ana', modality: 'telemedicina' })
    expect(n.lines.some(l => l.text === 'Telemedicina')).toBe(true)
    expect(n.lines.some(l => l.icon === '📍')).toBe(false)
    expect(notificationToInline(n)).toBe('📅 18/07/2026 · 🕒 09:00 · 💻 Telemedicina · 👨‍⚕️ Dra. Ana')
  })

  it('ausência de horário → sem linha de horário', () => {
    const n = buildEventNotification({ ...base, professional: 'Dr. João' })
    expect(n.lines.some(l => l.icon === '🕒')).toBe(false)
  })

  it('ausência de profissional → sem linha de profissional', () => {
    const n = buildEventNotification({ ...base, timeLabel: '14:30', establishment: 'Clínica ABC' })
    expect(n.lines.some(l => l.icon === '👨‍⚕️')).toBe(false)
    expect(notificationToInline(n)).toBe('📅 18/07/2026 · 🕒 14:30 · 📍 Clínica ABC')
  })

  it('todos os campos preenchidos incluem preparo e local composto', () => {
    const n = buildEventNotification({
      ...base, timeLabel: '14:30', professional: 'Dr. João Silva',
      establishment: 'Clínica ABC', location: 'Av. Brasil, 100',
      modality: 'presencial', preparation: 'Jejum de 8h',
    })
    expect(notificationToInline(n)).toBe(
      '📅 18/07/2026 · 🕒 14:30 · 👨‍⚕️ Dr. João Silva · 📍 Clínica ABC · Av. Brasil, 100 · 📋 Jejum de 8h'
    )
  })
})

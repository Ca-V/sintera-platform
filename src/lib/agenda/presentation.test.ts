import { describe, it, expect } from 'vitest'
import { formatDateBR, formatTimeBR, toLocalDate, eventToNotificationInput, typeLabel, professionalLabel } from './presentation'
import { buildEventNotification, notificationToInline } from './notification'
import type { HealthEvent } from './event'

describe('toLocalDate — data-only sem deslocamento de fuso (regressão: Painel mostrava 02/07 p/ consulta de 03/07)', () => {
  it('mantém o dia para uma data-only em qualquer fuso', () => {
    const d = toLocalDate('2026-07-03')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(6) // julho (0-based)
    expect(d.getDate()).toBe(3)  // com o bug (new Date('2026-07-03')=UTC), em UTC-3 seria 2
  })
  it('preserva timestamps completos (com hora)', () => {
    const iso = '2026-07-03T15:30:00Z'
    expect(toLocalDate(iso).getTime()).toBe(new Date(iso).getTime())
  })
})

function ev(p: Partial<HealthEvent>): HealthEvent {
  return {
    id: 'e1', type: 'consulta', title: 'Consulta de Cardiologia', isReturn: false, status: 'planejado', source: 'manual', priority: null,
    date: '2026-07-18', time: '14:30:00', durationMin: null, reminderEnabled: true, reminderSentAt: null,
    professionalKind: 'medico', professionalName: 'Dr. João Silva', establishment: 'Clínica ABC',
    location: null, modality: 'presencial', preparation: null, notes: null, amountCents: null,
    directExpense: false, attachmentUrl: null, links: [], outcome: null, recurrenceRule: null, seriesId: null,
    parentEventId: null, rootEventId: null, completedAt: null, ...p,
  }
}

describe('formatadores de apresentação', () => {
  it('formatDateBR / formatTimeBR / typeLabel', () => {
    expect(formatDateBR('2026-07-18')).toBe('18/07/2026')
    expect(formatTimeBR('14:30:00')).toBe('14:30')
    expect(formatTimeBR(null)).toBeNull()
    expect(typeLabel('exame')).toBe('Exame')
    expect(typeLabel('desconhecido')).toBe('Outro')
  })
})

describe('fonte ÚNICA de rótulos — consolidação da camada de apresentação (Sprint UX)', () => {
  it('typeLabel usa o rótulo mais específico e NUNCA "Evento"', () => {
    expect(typeLabel('estetico')).toBe('Procedimento estético')
    expect(typeLabel('medicacao')).toBe('Medicamento')
    expect(typeLabel('retorno')).toBe('Consulta')
    expect(typeLabel('outro')).toBe('Outro')         // padrão oficial é "Outro", não "Evento"
    expect(typeLabel('desconhecido')).toBe('Outro')  // fallback canônico
  })
  it('professionalLabel mapeia conhecidos e devolve "" para ausente/desconhecido', () => {
    expect(professionalLabel('medico')).toBe('Médico(a)')
    expect(professionalLabel('outro')).toBe('Outro profissional')
    expect(professionalLabel(null)).toBe('')
    expect(professionalLabel(undefined)).toBe('')
    expect(professionalLabel('inexistente')).toBe('')
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

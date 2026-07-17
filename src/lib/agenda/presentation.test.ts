import { describe, it, expect } from 'vitest'
import { formatDateBR, formatTimeBR, parseDateOnly, eventToNotificationInput, typeLabel, modalityLabel, outcomeSummary, hasOutcome, professionalKindLabel, PROFESSIONAL_KIND_DEFS, priorityBadge, priorityRank, byPriority } from './presentation'
import { buildEventNotification, notificationToInline } from './notification'
import type { HealthEvent } from './event'

describe('parseDateOnly — data civil sem deslocamento de fuso (regressão: Painel mostrava 02/07 p/ consulta de 03/07)', () => {
  it('mantém o dia para uma data-only em qualquer fuso', () => {
    const d = parseDateOnly('2026-07-03')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(6) // julho (0-based)
    expect(d.getDate()).toBe(3)  // com o bug (new Date('2026-07-03')=UTC), em UTC-3 seria 2
  })
  it('preserva timestamps completos (com hora)', () => {
    const iso = '2026-07-03T15:30:00Z'
    expect(parseDateOnly(iso).getTime()).toBe(new Date(iso).getTime())
  })
})

function ev(p: Partial<HealthEvent>): HealthEvent {
  return {
    id: 'e1', type: 'consulta', title: 'Consulta de Cardiologia', isReturn: false, status: 'planejado', source: 'manual', priority: null,
    date: '2026-07-18', time: '14:30:00', durationMin: null, reminderEnabled: true, reminderSentAt: null,
    professionalKind: 'medico', professionalName: 'Dr. João Silva', establishment: 'Clínica ABC',
    location: null, modality: 'presencial', preparation: null, notes: null, amountCents: null,
    directExpense: false, attachmentUrl: null, expenseDocType: null, links: [], outcome: null, recurrenceRule: null, seriesId: null,
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

describe('EVT-C2 (NC-0007) — surfacar modalidade/desfecho na Agenda/Histórico', () => {
  it('modalityLabel: presencial/telemedicina/ausente', () => {
    expect(modalityLabel('telemedicina')).toBe('Telemedicina')
    expect(modalityLabel('presencial')).toBe('Presencial')
    expect(modalityLabel(null)).toBeNull()
  })
  it('outcomeSummary prioriza resumo › diagnóstico › conduta › observações', () => {
    expect(outcomeSummary({ diagnosis: 'HAS', conduct: 'Losartana' })).toBe('HAS')
    expect(outcomeSummary({ conduct: 'Repouso' })).toBe('Repouso')
    expect(outcomeSummary({})).toBeNull()
    expect(outcomeSummary(null)).toBeNull()
  })
  it('hasOutcome detecta qualquer campo preenchido (inclui encaminhamentos/exames)', () => {
    expect(hasOutcome({ referrals: 'Cardiologia' })).toBe(true)
    expect(hasOutcome({ requestedExams: 'Hemograma' })).toBe(true)
    expect(hasOutcome({ summary: '   ' })).toBe(false)
    expect(hasOutcome(null)).toBe(false)
  })
})

describe('EVT-C3 (NC-0012) — tipo de profissional: fonte única + rótulo', () => {
  it('professionalKindLabel resolve os tipos conhecidos e degrada para null', () => {
    expect(professionalKindLabel('medico')).toBe('Médico(a)')
    expect(professionalKindLabel('fisioterapeuta')).toBe('Fisioterapeuta')
    expect(professionalKindLabel('desconhecido')).toBeNull()
    expect(professionalKindLabel('')).toBeNull()
    expect(professionalKindLabel(null)).toBeNull()
  })
  it('os DEFS do seletor cobrem os rótulos usados nas telas (fonte única, sem duplicação)', () => {
    expect(PROFESSIONAL_KIND_DEFS.map(d => d.id)).toContain('medico')
    for (const d of PROFESSIONAL_KIND_DEFS) expect(professionalKindLabel(d.id)).toBe(d.label)
  })
})

describe('EVT-C5 (NC-0017) — prioridade: exibir + ordenar', () => {
  it('priorityBadge devolve rótulo+ícone (null quando ausente)', () => {
    expect(priorityBadge('alta')).toEqual({ label: 'Alta', icon: '🔴' })
    expect(priorityBadge('baixa')).toEqual({ label: 'Baixa', icon: '🟢' })
    expect(priorityBadge(null)).toBeNull()
  })
  it('priorityRank ordena alta<media<baixa<ausente', () => {
    expect(priorityRank('alta')).toBeLessThan(priorityRank('media'))
    expect(priorityRank('media')).toBeLessThan(priorityRank('baixa'))
    expect(priorityRank('baixa')).toBeLessThan(priorityRank(null))
  })
  it('byPriority é um comparador estável (alta primeiro; ausente por último)', () => {
    const arr = [{ priority: 'baixa' as const }, { priority: null }, { priority: 'alta' as const }, { priority: 'media' as const }]
    expect([...arr].sort(byPriority).map(x => x.priority)).toEqual(['alta', 'media', 'baixa', null])
  })
})

import { describe, it, expect } from 'vitest'
import {
  rowToHealthEvent, agendaRowToHealthEvent,
  isUpcoming, isPast, isConcluded, isClosed, hasActiveReminder, hasCost, isDerived,
  selectUpcoming, selectHistorical, selectByLink, selectFinancial, isFinancial,
  completeRule, cancelRule, rescheduleRule, canTransition,
  type HealthEvent, type HealthEventRow,
} from './event'

function ev(p: Partial<HealthEvent>): HealthEvent {
  return {
    id: 'e1', type: 'consulta', title: 'Consulta', isReturn: false, status: 'planejado', source: 'manual', priority: null,
    date: '2026-07-18', time: '14:30:00', durationMin: null, reminderEnabled: true, reminderSentAt: null,
    professionalKind: null, professionalName: null, establishment: null, location: null,
    modality: null, preparation: null, notes: null, amountCents: null, directExpense: false, attachmentUrl: null,
    links: [], outcome: null, recurrenceRule: null, seriesId: null, parentEventId: null, rootEventId: null, completedAt: null, ...p,
  }
}

describe('rowToHealthEvent', () => {
  it('mapeia snake_case → domínio com source/links/reminder', () => {
    const row: HealthEventRow = {
      id: 'e1', event_type: 'consulta', title: 'Consulta', status: 'confirmado', source: 'protocol',
      event_date: '2026-07-18', event_time: '14:30:00', duration_min: 30, reminder_enabled: false,
      modality: 'presencial', links: [{ type: 'exam', id: 'x1' }],
    }
    const e = rowToHealthEvent(row)
    expect(e.status).toBe('confirmado')
    expect(e.source).toBe('protocol')
    expect(e.durationMin).toBe(30)
    expect(e.reminderEnabled).toBe(false)
    expect(e.modality).toBe('presencial')
    expect(e.links).toEqual([{ type: 'exam', id: 'x1' }])
  })
  it('tolera status/modality inválidos; source default manual; links não-array → []', () => {
    const e = rowToHealthEvent({ id: 'a', event_type: 'x', title: 'X', event_date: '2026-01-01', status: 'zzz', modality: 'foo', links: null })
    expect(e.status).toBe('planejado')
    expect(e.modality).toBeNull()
    expect(e.source).toBe('manual')
    expect(e.links).toEqual([])
  })
})

describe('agendaRowToHealthEvent (adaptador legado)', () => {
  it('mapeia status pending/done/cancelled → canônico e marca source agenda_legacy', () => {
    expect(agendaRowToHealthEvent({ id: 'a', event_type: 'exame', title: 'H', event_date: '2026-07-01', status: 'pending' }).status).toBe('planejado')
    expect(agendaRowToHealthEvent({ id: 'b', event_type: 'exame', title: 'H', event_date: '2026-07-01', status: 'done' }).status).toBe('realizado')
    expect(agendaRowToHealthEvent({ id: 'c', event_type: 'exame', title: 'H', event_date: '2026-07-01', status: 'cancelled' }).status).toBe('cancelado')
    expect(agendaRowToHealthEvent({ id: 'd', event_type: 'exame', title: 'H', event_date: '2026-07-01' }).source).toBe('agenda_legacy')
  })
})

describe('predicados de projeção (telas só filtram por estes)', () => {
  const ref = '2026-07-18'
  it('isUpcoming / isPast pela data e status', () => {
    expect(isUpcoming(ev({ date: '2026-08-01' }), ref)).toBe(true)
    expect(isUpcoming(ev({ date: '2026-07-01' }), ref)).toBe(false)
    expect(isUpcoming(ev({ date: '2026-08-01', status: 'cancelado' }), ref)).toBe(false)
    expect(isPast(ev({ date: '2026-07-01' }), ref)).toBe(true)
    expect(isPast(ev({ date: '2026-08-01', status: 'realizado' }), ref)).toBe(true)
  })
  it('isConcluded / isClosed / hasActiveReminder / hasCost / isDerived', () => {
    expect(isConcluded(ev({ status: 'realizado' }))).toBe(true)
    expect(isClosed(ev({ status: 'perdido' }))).toBe(true)
    expect(hasActiveReminder(ev({ reminderEnabled: true, status: 'planejado' }))).toBe(true)
    expect(hasActiveReminder(ev({ reminderEnabled: true, status: 'realizado' }))).toBe(false)
    expect(hasCost(ev({ amountCents: 25000 }))).toBe(true)
    expect(hasCost(ev({ amountCents: null }))).toBe(false)
    expect(isDerived(ev({ source: 'protocol' }))).toBe(true)
    expect(isDerived(ev({ source: 'manual' }))).toBe(false)
  })
})

describe('seletores e regras de transição (puros)', () => {
  const ref = '2026-07-18'
  it('selectUpcoming / selectHistorical / selectByLink', () => {
    const list = [
      ev({ id: 'fut', date: '2026-08-01' }),
      ev({ id: 'pas', date: '2026-07-01' }),
      ev({ id: 'lnk', date: '2026-08-02', links: [{ type: 'exam', id: 'x1' }] }),
    ]
    expect(selectUpcoming(list, ref).map(e => e.id).sort()).toEqual(['fut', 'lnk'])
    expect(selectHistorical(list, ref).map(e => e.id)).toEqual(['pas'])
    expect(selectByLink(list, 'exam', 'x1').map(e => e.id)).toEqual(['lnk'])
  })
  it('isFinancial / selectFinancial = realizado-com-valor OU despesa direta (Gastos = projeção)', () => {
    expect(isFinancial(ev({ status: 'realizado', amountCents: 25000 }))).toBe(true)
    expect(isFinancial(ev({ status: 'planejado', amountCents: 25000 }))).toBe(false) // não realizado e não-direto
    expect(isFinancial(ev({ status: 'planejado', amountCents: 25000, directExpense: true }))).toBe(true) // despesa direta (plano)
    expect(isFinancial(ev({ status: 'realizado', amountCents: null }))).toBe(false)  // sem valor
    const list = [
      ev({ id: 'a', status: 'realizado', amountCents: 100 }),
      ev({ id: 'b', status: 'planejado', amountCents: 100 }),
      ev({ id: 'd', status: 'planejado', amountCents: 100, directExpense: true }),
      ev({ id: 'c', status: 'realizado', amountCents: null }),
    ]
    expect(selectFinancial(list).map(e => e.id).sort()).toEqual(['a', 'd'])
  })
  it('completeRule / cancelRule / rescheduleRule retornam novo estado', () => {
    expect(completeRule(ev({}), '2026-07-18T10:00:00Z')).toMatchObject({ status: 'realizado', completedAt: '2026-07-18T10:00:00Z' })
    expect(cancelRule(ev({})).status).toBe('cancelado')
    const r = rescheduleRule(ev({ date: '2026-07-18', time: '14:30' }), '2026-08-01', '09:00')
    expect(r).toMatchObject({ status: 'reagendado', date: '2026-08-01', time: '09:00' })
  })
})

describe('canTransition (invariantes de status)', () => {
  it('permite planejado→confirmado→realizado', () => {
    expect(canTransition('planejado', 'confirmado')).toBe(true)
    expect(canTransition('confirmado', 'realizado')).toBe(true)
  })
  it('proíbe cancelado→realizado e a partir de estados terminais', () => {
    expect(canTransition('cancelado', 'realizado')).toBe(false)
    expect(canTransition('realizado', 'planejado')).toBe(false)
  })
  it('no-op (from===to) é válido', () => {
    expect(canTransition('planejado', 'planejado')).toBe(true)
  })
})

describe('modelo do dinheiro (Gastos) — exatamente 2 formas', () => {
  it('realizado + valor = entra em Gastos', () => {
    expect(isFinancial(ev({ status: 'realizado', amountCents: 120000 }))).toBe(true)
  })
  it('planejado + valor = NÃO entra (precisa concluir)', () => {
    expect(isFinancial(ev({ status: 'planejado', amountCents: 120000 }))).toBe(false)
  })
  it('despesa direta + valor = entra sem precisar concluir (ex.: plano)', () => {
    expect(isFinancial(ev({ status: 'planejado', amountCents: 55000, directExpense: true }))).toBe(true)
  })
  it('sem valor = nunca entra', () => {
    expect(isFinancial(ev({ status: 'realizado', amountCents: null }))).toBe(false)
  })
})

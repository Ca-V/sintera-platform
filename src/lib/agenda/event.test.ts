import { describe, it, expect } from 'vitest'
import {
  rowToHealthEvent, agendaRowToHealthEvent,
  isUpcoming, isPast, isConcluded, isClosed, hasActiveReminder, hasCost, isDerived,
  selectUpcoming, selectNextUpcoming, selectHistorical, selectByLink, selectFinancial, isFinancial,
  completeRule, cancelRule, rescheduleRule, canTransition,
  type HealthEvent, type HealthEventRow,
} from './event'
import { sortByWhen } from './event'

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
      id: 'e1', event_type: 'consulta', title: 'Consulta', status: 'reagendado', source: 'protocol',
      event_date: '2026-07-18', event_time: '14:30:00', duration_min: 30, reminder_enabled: false,
      modality: 'presencial', links: [{ type: 'exam', id: 'x1' }],
    }
    const e = rowToHealthEvent(row)
    expect(e.status).toBe('reagendado')
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
  it('permite planejado→realizado e reagendado→realizado', () => {
    expect(canTransition('planejado', 'realizado')).toBe(true)
    expect(canTransition('reagendado', 'realizado')).toBe(true)
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

describe('selectNextUpcoming — "próximo evento" tem UMA definição (REV-04)', () => {
  const ref = '2026-06-27'

  it('Dashboard ("próximo") == 1º da Agenda (mesma pipeline: ordena + filtra)', () => {
    // Lista propositalmente FORA de ordem e misturando origens (manual + legado).
    const list = [
      ev({ id: 'h-far',    date: '2026-07-25', status: 'planejado', source: 'manual' }),
      ev({ id: 'leg-near', date: '2026-06-28', status: 'planejado', source: 'agenda_legacy' }),
      ev({ id: 'past',     date: '2026-06-01', status: 'planejado', source: 'manual' }),
      ev({ id: 'done',     date: '2026-06-27', status: 'realizado', source: 'manual' }),
    ]
    // 1º item da Agenda = pipeline do repositório (sortByWhen → selectUpcoming).
    const agendaFirst = selectUpcoming(sortByWhen(list), ref)[0] ?? null
    // "próximo" do Dashboard = função única.
    const dashboardNext = selectNextUpcoming(list, ref)
    expect(dashboardNext).toEqual(agendaFirst)
    expect(dashboardNext?.id).toBe(agendaFirst?.id) // MESMO registro (identidade), não só equivalente
    expect(dashboardNext?.id).toBe('leg-near')
  })

  it('identidade: com EMPATE de data/horário, retorna o MESMO registro (id) nos dois caminhos', () => {
    // Dois eventos no mesmo dia e horário, origens diferentes — só o id desempata.
    // Garante que Dashboard e Agenda não escolham itens "equivalentes" distintos.
    const list = [
      ev({ id: 'b', date: '2026-06-28', time: '09:00:00', status: 'planejado', source: 'agenda_legacy' }),
      ev({ id: 'a', date: '2026-06-28', time: '09:00:00', status: 'planejado', source: 'manual' }),
    ]
    const agendaFirst = selectUpcoming(sortByWhen(list), ref)[0] ?? null
    const dashboardNext = selectNextUpcoming(list, ref)
    expect(dashboardNext?.id).toBe(agendaFirst?.id) // desempate determinístico idêntico
    expect(dashboardNext?.id).toBe('a')
  })

  it('inclui eventos legados (agenda_events) na decisão do "próximo"', () => {
    const list = [
      ev({ id: 'h',   date: '2026-08-10', status: 'planejado', source: 'manual' }),
      ev({ id: 'leg', date: '2026-06-28', status: 'planejado', source: 'agenda_legacy' }),
    ]
    expect(selectNextUpcoming(list, ref)?.id).toBe('leg')
  })

  it('ignora fechados e passados; null quando não há futuro', () => {
    const list = [
      ev({ id: 'done',   date: '2026-07-01', status: 'realizado' }),
      ev({ id: 'cancel', date: '2026-07-02', status: 'cancelado' }),
      ev({ id: 'past',   date: '2026-06-01', status: 'planejado' }),
    ]
    expect(selectNextUpcoming(list, ref)).toBeNull()
  })
})

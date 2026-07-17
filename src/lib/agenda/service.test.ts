import { describe, it, expect } from 'vitest'
import { createEventQueryService, createEventCommandService, InvalidTransitionError } from './service'
import { createEventBus, type DomainEvent } from './bus'
import type { EventRepository } from './repository'
import type { HealthEvent } from './event'

function ev(p: Partial<HealthEvent>): HealthEvent {
  return {
    id: 'e1', type: 'consulta', title: 'Consulta', isReturn: false, status: 'planejado', source: 'manual', priority: null,
    date: '2026-07-18', time: '14:30', durationMin: null, reminderEnabled: true, reminderSentAt: null,
    professionalKind: null, professionalName: null, establishment: null, location: null,
    modality: null, preparation: null, notes: null, amountCents: null, directExpense: false, attachmentUrl: null,
    links: [], outcome: null, recurrenceRule: null, seriesId: null, parentEventId: null, rootEventId: null, completedAt: null, ...p,
  }
}

function fakeRepo() {
  const calls: { method: string; args: unknown[] }[] = []
  const savedAll: (Partial<HealthEvent> & { type: string })[] = []
  const repo: EventRepository = {
    listAllEvents: async (...a) => { calls.push({ method: 'listAllEvents', args: a }); return [] },
    listUpcomingEvents: async (...a) => { calls.push({ method: 'listUpcomingEvents', args: a }); return [] },
    listHistoricalEvents: async (...a) => { calls.push({ method: 'listHistoricalEvents', args: a }); return [] },
    listEventsByExam: async () => [],
    listEventsByBiomarker: async () => [],
    listEventsByProtocol: async () => [],
    listFinancialEntries: async () => [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    save: async (_u, e) => { savedAll.push(e as any) },
  }
  return { repo, calls, getSaved: () => savedAll[savedAll.length - 1] ?? null, getSavedAll: () => savedAll }
}

const clock = { today: () => '2026-07-18', now: () => '2026-07-18T10:00:00Z' }

describe('EventQueryService (leitura)', () => {
  it('Agenda/Histórico usam as capacidades com a data de hoje', async () => {
    const { repo, calls } = fakeRepo()
    const q = createEventQueryService(repo, clock)
    await q.listUpcoming('u1')
    await q.listHistorical('u1')
    expect(calls[0]).toEqual({ method: 'listUpcomingEvents', args: ['u1', '2026-07-18'] })
    expect(calls[1]).toEqual({ method: 'listHistoricalEvents', args: ['u1', '2026-07-18'] })
  })
  it('listAll delega ao repositório (união legado+canônico), sem recorte temporal', async () => {
    const { repo, calls } = fakeRepo()
    const q = createEventQueryService(repo, clock)
    await q.listAll('u1')
    expect(calls[0]).toEqual({ method: 'listAllEvents', args: ['u1'] })
  })
})

describe('EventCommandService (escrita + transições no bus)', () => {
  it('complete aplica a regra e emite EventCompleted com fromStatus', async () => {
    const { repo, getSaved } = fakeRepo()
    const bus = createEventBus()
    const seen: DomainEvent[] = []
    bus.subscribe('EventCompleted', e => { seen.push(e) })
    const cmd = createEventCommandService(repo, bus, clock)
    await cmd.complete('u1', ev({ status: 'planejado' }))
    expect(getSaved()).toMatchObject({ status: 'realizado', completedAt: '2026-07-18T10:00:00Z' })
    expect(seen).toHaveLength(1)
    expect(seen[0]).toMatchObject({ type: 'EventCompleted', fromStatus: 'planejado', actor: { kind: 'user', id: 'u1' } })
    expect(seen[0].eventId).toBeTruthy()
    expect(seen[0].aggregateId).toBe('e1')
  })

  it('proíbe transição inválida (cancelado→realizado) via InvalidTransitionError', async () => {
    const { repo, getSaved } = fakeRepo()
    const bus = createEventBus()
    const cmd = createEventCommandService(repo, bus, clock)
    await expect(cmd.complete('u1', ev({ status: 'cancelado' }))).rejects.toBeInstanceOf(InvalidTransitionError)
    expect(getSaved()).toBeNull()
  })
  it('cancel e reschedule emitem suas transições', async () => {
    const { repo } = fakeRepo()
    const bus = createEventBus()
    const seen: string[] = []
    ;(['EventCancelled', 'EventRescheduled'] as const).forEach(t => bus.subscribe(t, () => { seen.push(t) }))
    const cmd = createEventCommandService(repo, bus, clock)
    await cmd.cancel('u1', ev({}))
    await cmd.reschedule('u1', ev({}), '2026-08-01', '09:00')
    expect(seen).toEqual(['EventCancelled', 'EventRescheduled'])
  })

  it('create recorrente salva 1 evento (a série rola ao concluir, não na criação)', async () => {
    const { repo, getSavedAll } = fakeRepo()
    const cmd = createEventCommandService(repo, createEventBus(), clock)
    await cmd.create('u1', { type: 'medicamento', title: 'EFEXOR', date: '2026-07-18', recurrenceRule: 'freq=monthly;interval=1;until=2026-12-18' })
    expect(getSavedAll()).toHaveLength(1)
  })

  it('concluir recorrente gera a PRÓXIMA ocorrência planejada (uso contínuo nunca some)', async () => {
    const { repo, getSavedAll } = fakeRepo()
    const cmd = createEventCommandService(repo, createEventBus(), clock)
    await cmd.complete('u1', ev({ status: 'planejado', date: '2026-07-18', recurrenceRule: 'freq=monthly;interval=1;until=2026-12-18' }))
    const all = getSavedAll()
    expect(all.map(e => e.status)).toEqual(['realizado', 'planejado'])
    expect(all[1].date).toBe('2026-08-18')
    // Rastreabilidade da cadeia (NC-0018): a ocorrência registra a provenance.
    expect(all[1].parentEventId).toBe('e1')   // rolou do evento concluído
    expect(all[1].rootEventId).toBe('e1')     // raiz da série (1ª ocorrência)
  })

  it('concluir recorrente após o until NÃO gera próxima', async () => {
    const { repo, getSavedAll } = fakeRepo()
    const cmd = createEventCommandService(repo, createEventBus(), clock)
    await cmd.complete('u1', ev({ status: 'planejado', date: '2026-12-18', recurrenceRule: 'freq=monthly;interval=1;until=2026-12-18' }))
    expect(getSavedAll()).toHaveLength(1)
  })

  it('reopen desfaz a conclusão (volta a planejado, limpa completedAt)', async () => {
    const { repo, getSaved } = fakeRepo()
    const cmd = createEventCommandService(repo, createEventBus(), clock)
    await cmd.reopen('u1', ev({ status: 'realizado', completedAt: '2026-07-18T10:00:00Z' }))
    expect(getSaved()).toMatchObject({ status: 'planejado', completedAt: null })
  })

  it('create sem recorrência salva 1 evento', async () => {
    const { repo, getSavedAll } = fakeRepo()
    const cmd = createEventCommandService(repo, createEventBus(), clock)
    await cmd.create('u1', { type: 'consulta', title: 'X', date: '2026-07-18' })
    expect(getSavedAll()).toHaveLength(1)
  })

  it('create com status realizado carimba completedAt (lançamento já realizado)', async () => {
    const { repo, getSaved } = fakeRepo()
    const cmd = createEventCommandService(repo, createEventBus(), clock)
    await cmd.create('u1', { type: 'consulta', title: 'Botox', date: '2026-03-20', status: 'realizado', amountCents: 120000 })
    expect(getSaved()).toMatchObject({ status: 'realizado', completedAt: '2026-07-18T10:00:00Z' })
  })
})

describe('EventBus', () => {
  it('publica para assinantes do tipo e respeita unsubscribe', async () => {
    const bus = createEventBus()
    const de = (type: 'EventCreated' | 'EventCompleted'): DomainEvent =>
      ({ type, eventId: 'x', aggregateId: 'e1', actor: { kind: 'user' }, at: 'x', event: ev({}) })
    let n = 0
    const off = bus.subscribe('EventCreated', () => { n++ })
    await bus.publish(de('EventCreated'))
    await bus.publish(de('EventCompleted')) // outro tipo: ignora
    off()
    await bus.publish(de('EventCreated'))   // após unsubscribe: ignora
    expect(n).toBe(1)
  })
})

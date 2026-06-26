import { describe, it, expect } from 'vitest'
import { createEventQueryService, createEventCommandService, InvalidTransitionError } from './service'
import { createEventBus, type DomainEvent } from './bus'
import type { EventRepository } from './repository'
import type { HealthEvent } from './event'

function ev(p: Partial<HealthEvent>): HealthEvent {
  return {
    id: 'e1', type: 'consulta', title: 'Consulta', status: 'planejado', source: 'manual',
    date: '2026-07-18', time: '14:30', durationMin: null, reminderEnabled: true, reminderSentAt: null,
    professionalKind: null, professionalName: null, establishment: null, location: null,
    modality: null, preparation: null, notes: null, amountCents: null, attachmentUrl: null,
    links: [], recurrenceRule: null, seriesId: null, parentEventId: null, rootEventId: null, completedAt: null, ...p,
  }
}

function fakeRepo() {
  const calls: { method: string; args: unknown[] }[] = []
  let saved: (Partial<HealthEvent> & { type: string }) | null = null
  const repo: EventRepository = {
    listUpcomingEvents: async (...a) => { calls.push({ method: 'listUpcomingEvents', args: a }); return [] },
    listHistoricalEvents: async (...a) => { calls.push({ method: 'listHistoricalEvents', args: a }); return [] },
    listEventsByExam: async () => [],
    listEventsByBiomarker: async () => [],
    listEventsByProtocol: async () => [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    save: async (_u, e) => { saved = e as any },
  }
  return { repo, calls, getSaved: () => saved }
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
})

describe('EventCommandService (escrita + transições no bus)', () => {
  it('complete aplica a regra e emite EventCompleted com fromStatus', async () => {
    const { repo, getSaved } = fakeRepo()
    const bus = createEventBus()
    const seen: DomainEvent[] = []
    bus.subscribe('EventCompleted', e => { seen.push(e) })
    const cmd = createEventCommandService(repo, bus, clock)
    await cmd.complete('u1', ev({ status: 'confirmado' }))
    expect(getSaved()).toMatchObject({ status: 'realizado', completedAt: '2026-07-18T10:00:00Z' })
    expect(seen).toHaveLength(1)
    expect(seen[0]).toMatchObject({ type: 'EventCompleted', fromStatus: 'confirmado', actor: { kind: 'user', id: 'u1' } })
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

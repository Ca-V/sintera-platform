import { describe, it, expect } from 'vitest'
import { createEventService } from './service'
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

// Repositório falso que registra as chamadas — testa as regras do serviço sem banco.
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

describe('EventService (regras na camada de serviço)', () => {
  it('listUpcoming/listHistorical usam o repositório com a data de hoje', async () => {
    const { repo, calls } = fakeRepo()
    const svc = createEventService(repo, clock)
    await svc.listUpcoming('u1')
    await svc.listHistorical('u1')
    expect(calls[0]).toEqual({ method: 'listUpcomingEvents', args: ['u1', '2026-07-18'] })
    expect(calls[1]).toEqual({ method: 'listHistoricalEvents', args: ['u1', '2026-07-18'] })
  })

  it('complete aplica a regra (realizado + completed_at) antes de salvar', async () => {
    const { repo, getSaved } = fakeRepo()
    const svc = createEventService(repo, clock)
    await svc.complete('u1', ev({}))
    expect(getSaved()).toMatchObject({ status: 'realizado', completedAt: '2026-07-18T10:00:00Z' })
  })

  it('cancel e reschedule aplicam as regras', async () => {
    const { repo, getSaved } = fakeRepo()
    const svc = createEventService(repo, clock)
    await svc.cancel('u1', ev({}))
    expect(getSaved()).toMatchObject({ status: 'cancelado' })
    await svc.reschedule('u1', ev({}), '2026-08-01', '09:00')
    expect(getSaved()).toMatchObject({ status: 'reagendado', date: '2026-08-01', time: '09:00' })
  })
})

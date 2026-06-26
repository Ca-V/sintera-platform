import { describe, it, expect } from 'vitest'
import { sortByWhen } from './repository'
import type { HealthEvent } from './event'

function ev(id: string, date: string, time: string | null): HealthEvent {
  return {
    id, type: 'consulta', title: id, status: 'planejado', source: 'manual',
    date, time, durationMin: null, reminderEnabled: true, reminderSentAt: null,
    professionalKind: null, professionalName: null, establishment: null, location: null,
    modality: null, preparation: null, notes: null, amountCents: null, attachmentUrl: null,
    links: [], recurrenceRule: null, seriesId: null, completedAt: null,
  }
}

describe('sortByWhen', () => {
  it('ordena por data e depois horário (ascendente)', () => {
    const out = sortByWhen([
      ev('c', '2026-07-18', '15:00'),
      ev('a', '2026-07-10', null),
      ev('b', '2026-07-18', '09:00'),
    ])
    expect(out.map(e => e.id)).toEqual(['a', 'b', 'c'])
  })
})

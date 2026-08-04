// @sintera/core — Histórico de Saúde: projeção unificada (eventos + exames), ordem cronológica, aditiva.
import { describe, it, expect } from 'vitest'
import { mergeTimeline, examToTimelineEntry, eventToTimelineEntry, type ExamTimelineLike } from '../../packages/core/src/domain/timelineProjection'
import type { HealthEvent } from '../../packages/core/src/domain/agenda/event'

function ev(p: Partial<HealthEvent>): HealthEvent {
  return {
    id: 'e', type: 'consulta', title: 'Cardiologista', isReturn: false, status: 'realizado', source: 'manual', priority: null,
    date: '2026-05-10', time: null, durationMin: null, reminderEnabled: false, reminderSentAt: null, professionalKind: null,
    professionalName: null, establishment: null, location: null, modality: null, preparation: null, notes: null,
    amountCents: null, directExpense: false, attachmentUrl: null, expenseDocType: null, links: [], outcome: null,
    recurrenceRule: null, seriesId: null, parentEventId: null, rootEventId: null, completedAt: null, ...p,
  }
}
const exam: ExamTimelineLike = { id: 'x1', exam_date: '2026-06-01', display_title: 'Hemograma', type: null, issuer: 'Fleury', status: 'processed' }

describe('mergeTimeline (Histórico unificado)', () => {
  it('une eventos + exames em ordem cronológica desc, com domínio e refId', () => {
    const out = mergeTimeline([ev({ id: 'e1', date: '2026-05-10' })], [exam])
    expect(out.map(e => e.id)).toEqual(['exam:x1', 'event:e1']) // 06-01 antes de 05-10 (desc)
    expect(out[0]).toMatchObject({ domain: 'exam', refId: 'x1', title: 'Hemograma', subtitle: 'Exame · Fleury' })
    expect(out[1]).toMatchObject({ domain: 'event', refId: 'e1', title: 'Cardiologista', subtitle: 'Consulta' })
  })
  it('exame sem exam_date cai na data de entrada (created_at)', () => {
    const e = examToTimelineEntry({ id: 'x2', exam_date: null, created_at: '2026-07-03T10:00:00Z', display_title: 'Exame', type: null, issuer: null, status: 'processed' })
    expect(e.date).toBe('2026-07-03')
  })
  it('evento é encerrado só quando fechado (realizado/cancelado/perdido)', () => {
    expect(eventToTimelineEntry(ev({ status: 'planejado' })).closed).toBe(false)
    expect(eventToTimelineEntry(ev({ status: 'realizado' })).closed).toBe(true)
  })
})

// @sintera/core — Histórico de Saúde: projeção unificada (eventos + exames), ordem cronológica, aditiva.
import { describe, it, expect } from 'vitest'
import { mergeTimeline, selectHistory, examToTimelineEntry, eventToTimelineEntry, omicsToTimelineEntry, contraceptiveToTimelineEntry, type ExamTimelineLike } from '../../packages/core/src/domain/timelineProjection'
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
  it('selectHistory descarta eventos ABERTOS (só fatos fechados no Histórico)', () => {
    const merged = mergeTimeline([ev({ id: 'aberto', status: 'planejado', date: '2026-08-10' }), ev({ id: 'feito', status: 'realizado', date: '2026-05-01' })], [exam])
    const hist = selectHistory(merged)
    expect(hist.some(e => e.id === 'event:aberto')).toBe(false)
    expect(hist.some(e => e.id === 'event:feito')).toBe(true)
    expect(hist.some(e => e.id === 'exam:x1')).toBe(true) // exame sempre histórico
  })
  it('projeta ômicas e contracepção (fontes adicionais, sempre fechadas)', () => {
    const out = mergeTimeline([], [],
      [{ id: 'p1', domain: 'metabolomics', laboratory: 'Lab', total_features: 200, collected_on: '2026-04-01' }],
      [{ id: 'c1', kind: 'diu_hormonal', brand: 'Mirena', started_on: '2026-03-01' }])
    expect(out.find(e => e.domain === 'omics')).toMatchObject({ refId: 'p1', title: 'Metabolômica', closed: true })
    expect(out.find(e => e.domain === 'contraceptive')).toMatchObject({ refId: 'c1', closed: true })
  })
  it('DEDUP FB-008: evento vinculado a exame COM valor é ocultado (o exame é o fato)', () => {
    const linked = ev({ id: 'dup', status: 'realizado', amountCents: 5000, links: [{ type: 'exam', id: 'x1' }] as never })
    const out = mergeTimeline([linked], [exam])
    expect(out.some(e => e.id === 'event:dup')).toBe(false)
    expect(out.some(e => e.id === 'exam:x1')).toBe(true)
  })
})

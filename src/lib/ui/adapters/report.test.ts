import { describe, it, expect } from 'vitest'
import { buildReport, buildDocuments, buildTimeline, buildSummary, type ExamRow, type ReportInput } from './report'
import type { HealthEventRow } from '../../agenda/event'

const exam = (o: Partial<ExamRow>): ExamRow => ({ id: 'e', type: 'Hemograma', status: 'processed', created_at: '2026-06-01', exam_date: '2026-06-01', ...o })
const evRow = (o: Partial<HealthEventRow>): HealthEventRow => ({ id: 'id', event_type: 'consulta', title: 'Consulta', event_date: '2026-06-10', ...o })

const input = (o: Partial<ReportInput> = {}): ReportInput => ({
  name: 'Carina', objective: 'consulta', bioRows: [], eventRows: [], examRows: [], generatedAt: '2026-07-01', ...o,
})

describe('reportAdapter — determinismo (seções e ordem estáveis)', () => {
  const exams = [exam({ id: 'b', exam_date: '2026-06-05' }), exam({ id: 'a', exam_date: '2026-06-20' })]

  it('documentos: data desc, id asc — independe da ordem de entrada', () => {
    const out1 = buildDocuments(exams).map((d) => d.description)
    const out2 = buildDocuments([exams[1], exams[0]]).map((d) => d.description)
    expect(out1).toEqual(out2)
    expect(out1[0]).toBe('20 jun 2026') // mais recente primeiro
  })

  it('buildReport: mesma entrada → mesma saída', () => {
    const i = input({ examRows: exams, eventRows: [evRow({ id: 'x' }), evRow({ id: 'y', event_date: '2026-06-12' })] })
    expect(buildReport(i)).toEqual(buildReport(i))
  })
})

describe('reportAdapter — Estado 2 sai vazio, leitura sai real', () => {
  it('situação (catálogo) vazia; resumo conta exames/eventos reais', () => {
    const model = buildReport(input({ examRows: [exam({}), exam({ id: 'e2' })], eventRows: [evRow({})] }))
    expect(model.situation).toEqual([])
    const summary = Object.fromEntries(buildSummary([exam({}), exam({ id: 'e2' })], [evRow({})]).map((s) => [s.label, s.value]))
    expect(summary['exames no período']).toBe('2')
    expect(summary['eventos']).toBe('1')
    expect(summary['condições']).toBe('—') // Estado 2
  })

  it('sem biomarcadores → evolução ausente (undefined)', () => {
    expect(buildReport(input()).evolution).toBeUndefined()
  })

  it('cover: período derivado das datas reais', () => {
    const model = buildReport(input({ examRows: [exam({ exam_date: '2026-03-01' })], eventRows: [evRow({ event_date: '2026-07-01' })] }))
    expect(model.cover.period).toBe('mar 2026 – jul 2026')
  })
})

describe('reportAdapter — timeline reusa o adapter validado', () => {
  it('linha do tempo limita a 6 e mantém o formato do TimelineEvent', () => {
    const rows = Array.from({ length: 8 }, (_, i) => evRow({ id: 'e' + i, event_date: `2026-06-0${(i % 9) + 1}` }))
    const out = buildTimeline(rows)
    expect(out.length).toBe(6)
    expect(Object.keys(out[0]).sort()).toEqual(['context', 'nature', 'title', 'when'].sort())
  })
})

// FUNC — normalizadores puros do read-model do Relatório (dataset de comunicação).
// Estas regras eram duplicadas em /dashboard/relatorio e /r/[token]; agora vivem
// numa única camada proprietária e são testadas uma vez.
import { describe, it, expect } from 'vitest'
import {
  toMed, toExam, toMeasure, toCondition, toEyewear, toOmics, toContraceptive, toMenstruation,
} from '@/lib/communication/reportDataset'

describe('reportDataset — normalizadores', () => {
  it('toMed: defaults de kind/status; vazios → null', () => {
    expect(toMed({ name: 'Losartana' })).toEqual({
      name: 'Losartana', kind: 'medicamento', dose: null, frequency: null,
      startedOn: null, untilOn: null, status: 'em_uso',
    })
    const m = toMed({ name: 'Whey', kind: 'suplemento', dose: '30 g', started_on: '2026-01-02', until_date: '2026-06-01', status: 'suspenso' })
    expect(m.kind).toBe('suplemento'); expect(m.startedOn).toBe('2026-01-02'); expect(m.untilOn).toBe('2026-06-01')
  })

  it('toExam: data = exam_date || created_at; type default "Exame"', () => {
    expect(toExam({ id: 'e1', exam_date: '2026-03-01', created_at: '2026-02-01', file_url: 'u' }))
      .toEqual({ id: 'e1', type: 'Exame', date: '2026-03-01', fileUrl: 'u' })
    expect(toExam({ id: 'e2', type: 'Hemograma', created_at: '2026-02-01' }).date).toBe('2026-02-01')
  })

  it('toMeasure: mapeia measured_on → date e exam_id → examId', () => {
    expect(toMeasure({ metric: 'peso', value_text: '70', unit: 'kg', measured_on: '2026-04-01', exam_id: 'x1' }))
      .toEqual({ metric: 'peso', label: null, valueText: '70', unit: 'kg', date: '2026-04-01', examId: 'x1' })
  })

  it('toCondition: since_label → since', () => {
    expect(toCondition({ name: 'HAS', since_label: '2020' }).since).toBe('2020')
    expect(toCondition({}).scope).toBe('propria')
  })

  it('toEyewear: achata attributes.od/oe e vision_kind', () => {
    const e = toEyewear({
      started_on: '2026-01-10', prescriber: 'Dra. X', file_url: 'f',
      attributes: { vision_kind: 'lentes_contato', od: { sph: '-1.0', cyl: '-0.5', axis: '180', add: '+1' }, oe: { sph: '-1.25' }, dnp: '62', bc: '8.6', dia: '14.2' },
    })
    expect(e.kind).toBe('lentes_contato')
    expect(e.prescribedOn).toBe('2026-01-10')
    expect(e.odSph).toBe('-1.0'); expect(e.odCyl).toBe('-0.5'); expect(e.odAxis).toBe('180'); expect(e.odAdd).toBe('+1')
    expect(e.oeSph).toBe('-1.25'); expect(e.oeCyl).toBeNull()
    expect(e.dnp).toBe('62'); expect(e.bc).toBe('8.6'); expect(e.dia).toBe('14.2'); expect(e.fileUrl).toBe('f')
  })

  it('toEyewear: sem attributes → kind "oculos" e campos null', () => {
    const e = toEyewear({ started_on: null })
    expect(e.kind).toBe('oculos'); expect(e.odSph).toBeNull(); expect(e.fileUrl).toBeNull()
  })

  it('toOmics: date = collected_on || created_at; default domain', () => {
    expect(toOmics({ laboratory: 'Lab', total_features: 1200, created_at: '2026-02-02' }))
      .toEqual({ domain: 'metabolomics', laboratory: 'Lab', totalFeatures: 1200, date: '2026-02-02' })
    expect(toOmics({ domain: 'proteomics', collected_on: '2026-05-01', created_at: '2026-02-02' }).date).toBe('2026-05-01')
  })

  it('toContraceptive: defaults kind/status', () => {
    expect(toContraceptive({ started_on: '2026-01-01', replace_on: '2029-01-01' }))
      .toEqual({ kind: 'outro', brand: null, startedOn: '2026-01-01', replaceOn: '2029-01-01', status: 'ativo' })
  })

  it('toMenstruation: started_on → startedOn', () => {
    expect(toMenstruation({ started_on: '2026-06-01', notes: 'x' })).toEqual({ startedOn: '2026-06-01', notes: 'x' })
  })
})

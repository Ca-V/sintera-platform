// FUNC — serviço de domínio de Medidas corporais (lógica pura de payload).
import { describe, it, expect } from 'vitest'
import { buildMeasurePayload, MeasureValidationError } from '@/lib/medidas/service'

describe('buildMeasurePayload', () => {
  it('exige valor e data', () => {
    expect(() => buildMeasurePayload('u1', { metric: 'peso', value: ' ', measuredOn: '2026-08-11' }))
      .toThrow(MeasureValidationError)
    expect(() => buildMeasurePayload('u1', { metric: 'peso', value: '72', measuredOn: '' }))
      .toThrow(MeasureValidationError)
  })

  it('normaliza valor e carimba user_id/metric/data', () => {
    const p = buildMeasurePayload('u1', { metric: 'peso', value: ' 72,5 ', measuredOn: '2026-08-11' })
    expect(p.value_text).toBe('72,5')
    expect(p.user_id).toBe('u1')
    expect(p.metric).toBe('peso')
  })

  it('label só em outro (default "Medida"); demais métricas → null', () => {
    expect(buildMeasurePayload('u1', { metric: 'outro', value: '1', measuredOn: '2026-08-11', label: ' Cintura panturrilha ' }).label).toBe('Cintura panturrilha')
    expect(buildMeasurePayload('u1', { metric: 'outro', value: '1', measuredOn: '2026-08-11' }).label).toBe('Medida')
    expect(buildMeasurePayload('u1', { metric: 'peso', value: '1', measuredOn: '2026-08-11', label: 'ignorado' }).label).toBeNull()
  })

  it('unit/notes: trim; vazios viram null', () => {
    const cheio = buildMeasurePayload('u1', { metric: 'peso', value: '72', measuredOn: '2026-08-11', unit: ' kg ', notes: ' manhã ' })
    expect(cheio.unit).toBe('kg')
    expect(cheio.notes).toBe('manhã')
    const vazio = buildMeasurePayload('u1', { metric: 'peso', value: '72', measuredOn: '2026-08-11', unit: '', notes: '  ' })
    expect(vazio.unit).toBeNull()
    expect(vazio.notes).toBeNull()
  })

  it('examId: trim; vazio vira null', () => {
    expect(buildMeasurePayload('u1', { metric: 'peso', value: '72', measuredOn: '2026-08-11', examId: ' e9 ' }).exam_id).toBe('e9')
    expect(buildMeasurePayload('u1', { metric: 'peso', value: '72', measuredOn: '2026-08-11', examId: '' }).exam_id).toBeNull()
  })

  it('metric desconhecido cai para outro', () => {
    // @ts-expect-error — normalização de entrada inesperada
    expect(buildMeasurePayload('u1', { metric: 'colesterol', value: '1', measuredOn: '2026-08-11' }).metric).toBe('outro')
  })
})

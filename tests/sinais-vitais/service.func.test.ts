// FUNC — serviço de domínio de Sinais vitais (lógica pura de payload).
// Garante que a extração da lógica preserva as regras que viviam na página.
import { describe, it, expect } from 'vitest'
import { buildVitalPayload } from '@/lib/sinais-vitais/service'
import { ValidationError } from '@/lib/api/http'

describe('buildVitalPayload', () => {
  it('exige valor — vazio lança ValidationError', () => {
    expect(() => buildVitalPayload('u1', { metric: 'glicemia', value: '  ', measuredOn: '2026-08-11' }))
      .toThrow(ValidationError)
  })

  it('exige data — vazia lança ValidationError', () => {
    expect(() => buildVitalPayload('u1', { metric: 'glicemia', value: '95', measuredOn: '' }))
      .toThrow(ValidationError)
  })

  it('normaliza valor (trim) e carimba user_id/metric/data', () => {
    const p = buildVitalPayload('u1', { metric: 'glicemia', value: '  95  ', measuredOn: '2026-08-11' })
    expect(p.value_text).toBe('95')
    expect(p.user_id).toBe('u1')
    expect(p.metric).toBe('glicemia')
    expect(p.measured_on).toBe('2026-08-11')
  })

  it('label só existe em outro_sinal (default "Sinal" quando vazio)', () => {
    expect(buildVitalPayload('u1', { metric: 'outro_sinal', value: '1', measuredOn: '2026-08-11', label: ' SpO2 esforço ' }).label).toBe('SpO2 esforço')
    expect(buildVitalPayload('u1', { metric: 'outro_sinal', value: '1', measuredOn: '2026-08-11', label: '  ' }).label).toBe('Sinal')
    expect(buildVitalPayload('u1', { metric: 'glicemia', value: '1', measuredOn: '2026-08-11', label: 'ignorado' }).label).toBeNull()
  })

  it('unit e notes: trim; vazios viram null', () => {
    const cheio = buildVitalPayload('u1', { metric: 'glicemia', value: '95', measuredOn: '2026-08-11', unit: ' mg/dL ', notes: ' jejum ' })
    expect(cheio.unit).toBe('mg/dL')
    expect(cheio.notes).toBe('jejum')
    const vazio = buildVitalPayload('u1', { metric: 'glicemia', value: '95', measuredOn: '2026-08-11', unit: '', notes: '   ' })
    expect(vazio.unit).toBeNull()
    expect(vazio.notes).toBeNull()
  })

  it('metric desconhecido cai para outro_sinal', () => {
    // @ts-expect-error — valida a normalização de entrada inesperada
    const p = buildVitalPayload('u1', { metric: 'pressao_ocular', value: '20', measuredOn: '2026-08-11' })
    expect(p.metric).toBe('outro_sinal')
  })
})

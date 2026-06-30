import { describe, it, expect } from 'vitest'
import { analyzeSeries, referenceReadout } from './longitudinal'

describe('analyzeSeries — direção factual', () => {
  it('detecta alta acima do limiar de 5%', () => {
    const a = analyzeSeries([{ value: 100, date: '2025-01-01' }, { value: 120, date: '2025-03-01' }])
    expect(a?.direction).toBe('up')
    expect(a?.totalDeltaPercent).toBe(20)
  })
  it('detecta queda', () => {
    const a = analyzeSeries([{ value: 100, date: '2025-01-01' }, { value: 80, date: '2025-03-01' }])
    expect(a?.direction).toBe('down')
  })
  it('trata variação pequena como estável', () => {
    const a = analyzeSeries([{ value: 100, date: '2025-01-01' }, { value: 103, date: '2025-03-01' }])
    expect(a?.direction).toBe('stable')
  })
  it('uma só medição → estável, sem rate', () => {
    const a = analyzeSeries([{ value: 100, date: '2025-01-01' }])
    expect(a?.count).toBe(1)
    expect(a?.ratePerMonth).toBeNull()
  })
  it('série vazia → null', () => {
    expect(analyzeSeries([])).toBeNull()
  })
})

describe('referenceReadout — aderência factual à faixa impressa', () => {
  it('conta dentro/avaliáveis e o status da MAIS RECENTE (ordem cronológica)', () => {
    const r = referenceReadout(['dentro_da_referencia', 'acima_da_referencia', 'dentro_da_referencia'])
    expect(r.evaluable).toBe(3)
    expect(r.within).toBe(2)
    expect(r.last).toBe('within')
  })
  it('ignora interpretações sem referência avaliável', () => {
    const r = referenceReadout(['sem_referencia_identificada', null, 'abaixo_da_referencia'])
    expect(r.evaluable).toBe(1)
    expect(r.within).toBe(0)
    expect(r.last).toBe('below')
  })
  it('lista vazia → tudo zero e last unknown', () => {
    expect(referenceReadout([])).toEqual({ evaluable: 0, within: 0, last: 'unknown' })
  })
})

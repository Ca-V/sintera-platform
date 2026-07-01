import { describe, it, expect } from 'vitest'
import { biomarkerToIndicatorView, interpretationToStatus } from './indicator'
import type { BiomarkerSummary, Measurement } from '@/lib/biomarkers/grouping'

const m = (value: number, date: string, interpretation: string | null, refMax: number | null = 7): Measurement => ({
  examId: 'e' + date, date, value, unit: '%', referenceMin: null, referenceMax: refMax, interpretation,
})

function summary(partial: Partial<BiomarkerSummary>): BiomarkerSummary {
  const ms = partial.measurements ?? []
  return {
    canonicalName: 'hba1c', displayName: 'HbA1c', unit: '%',
    latest: ms[ms.length - 1] ?? null, first: ms[0] ?? null, count: ms.length,
    trend: 'down', deltaPercent: null, totalDeltaPercent: -13,
    hasUnitMismatch: false, units: ['%'], measurements: ms, ...partial,
  }
}

describe('adapter biomarkerToIndicatorView', () => {
  const s = summary({
    measurements: [
      m(7.9, '2025-09-01', 'acima_da_referencia'),
      m(7.1, '2026-03-01', 'acima_da_referencia'),
      m(6.8, '2026-07-03', 'dentro_da_referencia'),
    ],
  })
  const p = biomarkerToIndicatorView(s)

  it('mapeia situação atual (Q1) do latest', () => {
    expect(p.name).toBe('HbA1c')
    expect(p.value).toBe('6,8')
    expect(p.status).toBe('within')
  })

  it('gera leituras factuais (Q2): tendência, variação, aderência', () => {
    expect(p.readings.length).toBe(3)
    expect(p.readings.some((r) => r.text.includes('queda'))).toBe(true)
    expect(p.readings.some((r) => r.text.includes('-13%'))).toBe(true)
    expect(p.readings.some((r) => r.text.includes('1 de 3'))).toBe(true)
  })

  it('série (Q3) preserva as medições em ordem', () => {
    expect(p.series.map((pt) => pt.y)).toEqual([7.9, 7.1, 6.8])
  })

  it('linha de referência quando refMax é constante', () => {
    expect(p.reference).toBe(7)
  })

  it('Q4/Q5 vazios até o Estado 2', () => {
    expect(p.influences).toEqual([])
    expect(p.nextFollowUp).toBe('—')
  })
})

describe('interpretationToStatus', () => {
  it('mapeia dentro/fora/desconhecido', () => {
    expect(interpretationToStatus('dentro_da_referencia')).toBe('within')
    expect(interpretationToStatus('acima_da_referencia')).toBe('outside')
    expect(interpretationToStatus('abaixo_da_referencia')).toBe('outside')
    expect(interpretationToStatus('sem_referencia_identificada')).toBe('unknown')
    expect(interpretationToStatus(null)).toBe('unknown')
  })
})

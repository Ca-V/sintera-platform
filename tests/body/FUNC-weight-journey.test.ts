// FUNC · FB-007 — cálculo da jornada de peso (acompanhamento GLP-1). PURO.
import { describe, it, expect } from 'vitest'
import { computeWeightJourney } from '@/lib/body/weight-journey'

describe('FB-007 · computeWeightJourney', () => {
  it('calcula perda, ritmo, progresso à meta e preservação de massa magra', () => {
    const weight = [
      { value: 90, date: '2026-01-01' },
      { value: 85, date: '2026-02-05' },  // ~5 semanas depois
    ]
    const lean = [
      { value: 55, date: '2026-01-01' },
      { value: 54, date: '2026-02-05' },
    ]
    const j = computeWeightJourney(weight, lean, 80)
    expect(j.startWeight).toBe(90)
    expect(j.currentWeight).toBe(85)
    expect(j.lostKg).toBe(5)
    expect(j.spanWeeks).toBe(5)
    expect(j.rateKgPerWeek).toBe(1)               // 5 kg / 5 semanas
    expect(j.goalKg).toBe(80)
    expect(j.remainingKg).toBe(5)                 // 85 − 80
    expect(j.progressPct).toBe(50)                // perdeu 5 de 10 até a meta
    expect(j.leanStartKg).toBe(55)
    expect(j.leanCurrentKg).toBe(54)
    expect(j.leanDeltaKg).toBe(-1)                // perdeu 1 kg de massa magra
  })

  it('sem meta → sem restante/progresso, mas mantém perda e ritmo', () => {
    const j = computeWeightJourney([{ value: 80, date: '2026-01-01' }, { value: 78, date: '2026-01-15' }], [], null)
    expect(j.goalKg).toBeNull()
    expect(j.remainingKg).toBeNull()
    expect(j.progressPct).toBeNull()
    expect(j.lostKg).toBe(2)
    expect(j.spanWeeks).toBe(2)
    expect(j.rateKgPerWeek).toBe(1)
  })

  it('uma única medição → sem ritmo (span 0), sem inventar', () => {
    const j = computeWeightJourney([{ value: 80, date: '2026-01-01' }], [], 75)
    expect(j.startWeight).toBe(80)
    expect(j.currentWeight).toBe(80)
    expect(j.lostKg).toBe(0)
    expect(j.spanWeeks).toBeNull()
    expect(j.rateKgPerWeek).toBeNull()
    expect(j.remainingKg).toBe(5)
  })

  it('sem peso mas com massa magra → só reporta a massa magra', () => {
    const j = computeWeightJourney([], [{ value: 50, date: '2026-01-01' }, { value: 52, date: '2026-03-01' }], null)
    expect(j.startWeight).toBeNull()
    expect(j.leanDeltaKg).toBe(2)
  })

  it('meta já atingida (progresso 100, não estoura)', () => {
    const j = computeWeightJourney([{ value: 90, date: '2026-01-01' }, { value: 78, date: '2026-04-01' }], [], 80)
    expect(j.progressPct).toBe(100)              // perdeu mais do que o alvo → clamp 100
    expect(j.remainingKg).toBe(-2)               // já abaixo da meta
  })

  it('ordena por data (entrada fora de ordem não quebra)', () => {
    const j = computeWeightJourney([{ value: 85, date: '2026-02-05' }, { value: 90, date: '2026-01-01' }], [], null)
    expect(j.startWeight).toBe(90)
    expect(j.currentWeight).toBe(85)
  })
})

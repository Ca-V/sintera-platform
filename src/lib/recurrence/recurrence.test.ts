import { describe, it, expect } from 'vitest'
import { serializeRule, parseRule, addToDate, generateOccurrences, NO_RECURRENCE } from './index'

describe('serialize/parse', () => {
  it('none → null e ida e volta', () => {
    expect(serializeRule(NO_RECURRENCE)).toBeNull()
    expect(parseRule(null)).toEqual(NO_RECURRENCE)
    const r = { frequency: 'weekly' as const, interval: 1, until: '2026-12-31', count: null }
    expect(parseRule(serializeRule(r))).toMatchObject({ frequency: 'weekly', interval: 1, until: '2026-12-31' })
  })
  it('parse tolera entrada inválida', () => {
    expect(parseRule('freq=xpto;interval=0').frequency).toBe('none')
    expect(parseRule('freq=monthly;interval=0').interval).toBe(1)
  })
})

describe('addToDate', () => {
  it('soma por frequência (UTC, fim de mês/ano)', () => {
    expect(addToDate('2026-01-31', 'daily', 1)).toBe('2026-02-01')
    expect(addToDate('2026-07-18', 'weekly', 1)).toBe('2026-07-25')
    expect(addToDate('2026-07-18', 'biweekly', 1)).toBe('2026-08-01')
    expect(addToDate('2026-01-15', 'monthly', 1)).toBe('2026-02-15')
    expect(addToDate('2024-02-29', 'yearly', 1)).toBe('2025-03-01') // 2025 não bissexto
  })
})

describe('generateOccurrences', () => {
  it('none → só a data inicial', () => {
    expect(generateOccurrences(NO_RECURRENCE, '2026-07-18')).toEqual(['2026-07-18'])
  })
  it('semanal com count', () => {
    expect(generateOccurrences({ frequency: 'weekly', interval: 1, until: null, count: 3 }, '2026-07-18'))
      .toEqual(['2026-07-18', '2026-07-25', '2026-08-01'])
  })
  it('mensal com until (inclusive)', () => {
    expect(generateOccurrences({ frequency: 'monthly', interval: 1, until: '2026-09-30', count: null }, '2026-07-15'))
      .toEqual(['2026-07-15', '2026-08-15', '2026-09-15'])
  })
  it('sem fim é limitado por maxDefault', () => {
    expect(generateOccurrences({ frequency: 'monthly', interval: 1, until: null, count: null }, '2026-01-01', 5)).toHaveLength(5)
  })
})

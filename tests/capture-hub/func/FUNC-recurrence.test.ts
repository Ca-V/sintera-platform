// FUNC · Recorrência (F9 / E8) — serialize/parse/addToDate/generateOccurrences. Puro/determinístico.

import { describe, it, expect } from 'vitest'
import {
  serializeRule, parseRule, addToDate, generateOccurrences, NO_RECURRENCE, type RecurrenceRule,
} from '@/lib/recurrence'

describe('serializeRule / parseRule', () => {
  it('none → null; parse de null → NO_RECURRENCE', () => {
    expect(serializeRule({ frequency: 'none', interval: 1, until: null, count: null })).toBeNull()
    expect(parseRule(null)).toEqual(NO_RECURRENCE)
  })

  it('serializa freq/interval/until/count', () => {
    expect(serializeRule({ frequency: 'weekly', interval: 2, until: '2026-12-31', count: 5 }))
      .toBe('freq=weekly;interval=2;until=2026-12-31;count=5')
  })

  it('ida e volta preserva a regra', () => {
    const r: RecurrenceRule = { frequency: 'monthly', interval: 1, until: '2027-01-01', count: null }
    expect(parseRule(serializeRule(r))).toEqual(r)
  })

  it('frequência inválida → none; interval mínimo 1', () => {
    expect(parseRule('freq=xpto;interval=0').frequency).toBe('none')
    expect(parseRule('freq=daily;interval=0').interval).toBe(1)
  })
})

describe('addToDate (UTC determinístico)', () => {
  it('soma por frequência', () => {
    expect(addToDate('2026-01-01', 'daily', 1)).toBe('2026-01-02')
    expect(addToDate('2026-01-01', 'weekly', 1)).toBe('2026-01-08')
    expect(addToDate('2026-01-01', 'biweekly', 1)).toBe('2026-01-15')
    expect(addToDate('2026-01-31', 'monthly', 1)).toBe('2026-03-03') // 31/jan +1 mês = 03/mar (overflow UTC)
    expect(addToDate('2026-01-01', 'yearly', 1)).toBe('2027-01-01')
  })
  it('interval > 1', () => {
    expect(addToDate('2026-01-01', 'daily', 10)).toBe('2026-01-11')
  })
})

describe('generateOccurrences', () => {
  it('none → só a data inicial', () => {
    expect(generateOccurrences(NO_RECURRENCE, '2026-01-01')).toEqual(['2026-01-01'])
  })
  it('respeita count (inclui a primeira)', () => {
    const occ = generateOccurrences({ frequency: 'weekly', interval: 1, until: null, count: 3 }, '2026-01-01')
    expect(occ).toEqual(['2026-01-01', '2026-01-08', '2026-01-15'])
  })
  it('respeita until (inclusive)', () => {
    const occ = generateOccurrences({ frequency: 'daily', interval: 1, until: '2026-01-03', count: null }, '2026-01-01')
    expect(occ).toEqual(['2026-01-01', '2026-01-02', '2026-01-03'])
  })
  it('sem fim → limitado por maxDefault', () => {
    expect(generateOccurrences({ frequency: 'daily', interval: 1, until: null, count: null }, '2026-01-01', 5)).toHaveLength(5)
  })
})

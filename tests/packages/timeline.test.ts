// @sintera/core — projeção cronológica (Timeline): pura, determinística.
import { describe, it, expect } from 'vitest'
import { periodKey, sortByDate, groupByPeriod } from '../../packages/core/src/domain/timeline'

type Item = { id: string; date: string | null }
const items: Item[] = [
  { id: 'a', date: '2026-07-01' },
  { id: 'b', date: '2026-07-15' },
  { id: 'c', date: '2026-06-20' },
  { id: 'd', date: null },
  { id: 'e', date: '2025-12-31' },
]

describe('timeline · periodKey', () => {
  it('extrai ano/mês/dia por fatiamento (sem Date)', () => {
    expect(periodKey('2026-07-01', 'year')).toBe('2026')
    expect(periodKey('2026-07-01', 'month')).toBe('2026-07')
    expect(periodKey('2026-07-01', 'day')).toBe('2026-07-01')
  })
})

describe('timeline · sortByDate', () => {
  it('desc (padrão): mais recentes primeiro; nulos por último', () => {
    expect(sortByDate(items).map((i) => i.id)).toEqual(['b', 'a', 'c', 'e', 'd'])
  })
  it('asc: mais antigos primeiro; nulos por último', () => {
    expect(sortByDate(items, 'asc').map((i) => i.id)).toEqual(['e', 'c', 'a', 'b', 'd'])
  })
  it('é puro (não muta a entrada)', () => {
    const copy = [...items]
    sortByDate(items)
    expect(items).toEqual(copy)
  })
})

describe('timeline · groupByPeriod', () => {
  it('agrupa por mês em ordem desc; sem-data ao fim', () => {
    const g = groupByPeriod(items, 'month')
    expect(g.map((x) => x.key)).toEqual(['2026-07', '2026-06', '2025-12', 'sem-data'])
    expect(g[0].items.map((i) => i.id)).toEqual(['b', 'a']) // dentro do mês, desc
    expect(g[3].items.map((i) => i.id)).toEqual(['d'])
  })
  it('agrupa por ano', () => {
    const g = groupByPeriod(items, 'year')
    expect(g.map((x) => x.key)).toEqual(['2026', '2025', 'sem-data'])
    expect(g[0].items).toHaveLength(3)
  })
})

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

describe('timeline · casos extremos', () => {
  it('lista vazia → [] (sort e group)', () => {
    expect(sortByDate([])).toEqual([])
    expect(groupByPeriod([], 'month')).toEqual([])
  })

  it('datas IGUAIS → ordem relativa preservada (sort estável)', () => {
    const same: Item[] = [{ id: 'a', date: '2026-07-01' }, { id: 'b', date: '2026-07-01' }, { id: 'c', date: '2026-07-01' }]
    expect(sortByDate(same).map((i) => i.id)).toEqual(['a', 'b', 'c'])
    expect(sortByDate(same, 'asc').map((i) => i.id)).toEqual(['a', 'b', 'c'])
  })

  it('todos sem data → um grupo "sem-data"', () => {
    const nulls: Item[] = [{ id: 'a', date: null }, { id: 'b', date: null }]
    const g = groupByPeriod(nulls, 'month')
    expect(g).toHaveLength(1)
    expect(g[0].key).toBe('sem-data')
    expect(g[0].items.map((i) => i.id)).toEqual(['a', 'b'])
  })

  it('periodKey com ISO parcial/atípico não quebra', () => {
    expect(periodKey('2026', 'month')).toBe('2026')      // sem mês → cai no ano
    expect(periodKey('2026-07', 'day')).toBe('2026-07')  // sem dia → devolve o que há
    expect(periodKey('', 'year')).toBe('')               // vazio não lança
  })

  it('groupByPeriod com uma data atípica não lança', () => {
    const g = groupByPeriod([{ id: 'x', date: 'sem-formato' }], 'month')
    expect(g).toHaveLength(1)
    expect(g[0].items[0].id).toBe('x')
  })
})

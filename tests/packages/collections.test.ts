// @sintera/utils — coleções e comparadores genéricos.
import { describe, it, expect } from 'vitest'
import { byField, groupBy, uniqueBy } from '../../packages/utils/src'

type Row = { id: string; cat: string; n: number }
const rows: Row[] = [
  { id: 'a', cat: 'x', n: 3 },
  { id: 'b', cat: 'y', n: 1 },
  { id: 'c', cat: 'x', n: 2 },
  { id: 'a', cat: 'z', n: 9 }, // id duplicado
]

describe('utils · byField', () => {
  it('ordena asc/desc por campo (não muta a entrada)', () => {
    const copy = [...rows]
    expect([...rows].sort(byField('n')).map((r) => r.n)).toEqual([1, 2, 3, 9])
    expect([...rows].sort(byField('n', 'desc')).map((r) => r.n)).toEqual([9, 3, 2, 1])
    expect(rows).toEqual(copy)
  })
})

describe('utils · groupBy', () => {
  it('agrupa por chave, preservando ordem de aparição', () => {
    const g = groupBy(rows, (r) => r.cat)
    expect([...g.keys()]).toEqual(['x', 'y', 'z'])
    expect(g.get('x')!.map((r) => r.id)).toEqual(['a', 'c'])
  })
})

describe('utils · uniqueBy', () => {
  it('mantém o primeiro de cada chave', () => {
    const u = uniqueBy(rows, (r) => r.id)
    expect(u.map((r) => r.id)).toEqual(['a', 'b', 'c'])
    expect(u.find((r) => r.id === 'a')!.cat).toBe('x') // o primeiro 'a'
  })
})

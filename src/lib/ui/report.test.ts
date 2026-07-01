import { describe, it, expect } from 'vitest'
import { orderedVisible, type ReportSectionModel } from './report'

const s = (id: string, order: number, visible = true): ReportSectionModel => ({ id, title: id, order, visible })

describe('ReportSection — ordem e visibilidade', () => {
  it('ordena por order', () => {
    const out = orderedVisible([s('c', 3), s('a', 1), s('b', 2)])
    expect(out.map((x) => x.id)).toEqual(['a', 'b', 'c'])
  })

  it('remove seções ocultas', () => {
    const out = orderedVisible([s('a', 1), s('b', 2, false), s('c', 3)])
    expect(out.map((x) => x.id)).toEqual(['a', 'c'])
  })

  it('vazio quando nada visível', () => {
    expect(orderedVisible([s('a', 1, false)])).toEqual([])
  })
})

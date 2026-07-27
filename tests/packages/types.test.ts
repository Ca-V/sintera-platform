// @sintera/types — os contratos compilam e têm a forma esperada (só tipos; teste exercita a composição).
import { describe, it, expect } from 'vitest'
import type {
  Result, UserId, ExamId, PageRequest, PageResponse, DateRange, Sort,
} from '../../packages/types/src'

describe('types · contratos', () => {
  it('Result discrimina ok/erro', () => {
    const good: Result<number> = { ok: true, value: 1 }
    const bad: Result<number> = { ok: false, error: 'x' }
    expect(good.ok && good.value).toBe(1)
    expect(!bad.ok && bad.error).toBe('x')
  })

  it('PageRequest/PageResponse/DateRange/Sort compõem', () => {
    const req: PageRequest = { limit: 10, offset: 0 }
    const res: PageResponse<number> = { items: [1, 2], total: 2, ...req }
    const range: DateRange = { from: '2026-01-01', to: '2026-12-31' }
    const sort: Sort<'exam_date'> = { field: 'exam_date', dir: 'desc' }
    expect(res.items).toHaveLength(2)
    expect(res.limit).toBe(10)
    expect(range.from).toBe('2026-01-01')
    expect(sort.dir).toBe('desc')
  })

  it('IDs branded são strings em runtime', () => {
    const u = 'u1' as UserId
    const e = 'e1' as ExamId
    expect(typeof u).toBe('string')
    expect(typeof e).toBe('string')
  })
})

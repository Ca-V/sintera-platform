// @sintera/types — os contratos compilam e têm a forma esperada (só tipos consumidos: Result, PageRequest, DateRange).
import { describe, it, expect } from 'vitest'
import type { Result, PageRequest, DateRange } from '../../packages/types/src'

describe('types · contratos', () => {
  it('Result discrimina ok/erro', () => {
    const good: Result<number> = { ok: true, value: 1 }
    const bad: Result<number> = { ok: false, error: 'x' }
    expect(good.ok && good.value).toBe(1)
    expect(!bad.ok && bad.error).toBe('x')
  })

  it('PageRequest/DateRange compõem (consumidos pelo ExamsQuery)', () => {
    const req: PageRequest = { limit: 10, offset: 0 }
    const range: DateRange = { from: '2026-01-01', to: '2026-12-31' }
    expect(req.limit).toBe(10)
    expect(range.from).toBe('2026-01-01')
  })
})

import { describe, it, expect } from 'vitest'
import { parseLocal, dayDiff, fmtDayMonthYear, fmtDayMonth, fmtMonthYear, fmtMonthShortYear } from './date'

describe('date — data civil sem off-by-one de fuso', () => {
  it('parseLocal trata YYYY-MM-DD como meia-noite local', () => {
    const d = parseLocal('2026-07-03')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(6) // julho
    expect(d.getDate()).toBe(3)  // não 2 (seria o bug de UTC em BR)
  })

  it('dayDiff conta dias locais (a − b)', () => {
    expect(dayDiff('2026-07-10', '2026-07-10')).toBe(0)
    expect(dayDiff('2026-07-11', '2026-07-10')).toBe(1)
    expect(dayDiff('2026-07-04', '2026-07-10')).toBe(-6)
  })
})

describe('date — formatadores determinísticos (sem locale)', () => {
  it('fmtDayMonthYear', () => {
    expect(fmtDayMonthYear('2026-07-03')).toBe('03 jul 2026')
  })
  it('fmtDayMonth (sem ano)', () => {
    expect(fmtDayMonth('2026-08-20')).toBe('20 ago')
  })
  it('fmtMonthYear', () => {
    expect(fmtMonthYear('2026-03-01')).toBe('mar 2026')
    expect(fmtMonthYear('lixo')).toBe('—')
  })
  it('fmtMonthShortYear (ano 2 dígitos)', () => {
    expect(fmtMonthShortYear('2026-07-15')).toBe('jul 26')
  })
})

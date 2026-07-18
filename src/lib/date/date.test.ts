// FUNC · SSOT de cálculos de data. PURO/determinístico.
import { describe, it, expect } from 'vitest'
import { addDays, addMonths, daysBetween, nextOccurrenceByDays } from './index'

describe('date · primitivos', () => {
  it('addDays soma/subtrai e atravessa mês/ano', () => {
    expect(addDays('2026-07-18', 7)).toBe('2026-07-25')
    expect(addDays('2026-07-31', 1)).toBe('2026-08-01')
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31')
  })
  it('addMonths normaliza overflow (31/01 +1 → 03/03 em ano não bissexto)', () => {
    expect(addMonths('2026-01-15', 1)).toBe('2026-02-15')
    expect(addMonths('2026-01-31', 1)).toBe('2026-03-03')
    expect(addMonths('2026-03-15', -1)).toBe('2026-02-15')
  })
  it('daysBetween (b − a) com sinal', () => {
    expect(daysBetween('2026-07-18', '2026-07-25')).toBe(7)
    expect(daysBetween('2026-07-25', '2026-07-18')).toBe(-7)
    expect(daysBetween('2026-07-18', '2026-07-18')).toBe(0)
  })
})

describe('date · nextOccurrenceByDays', () => {
  it('avança a partir de start até estritamente depois de `from`', () => {
    // start no passado, cadência 30d: próxima após 2026-07-18
    expect(nextOccurrenceByDays('2026-06-01', 30, '2026-07-18')).toBe('2026-07-31')
    // exatamente em `from` → pula para a próxima (estritamente depois)
    expect(nextOccurrenceByDays('2026-07-01', 7, '2026-07-15')).toBe('2026-07-22')
    // start futuro → primeira ocorrência = start + step
    expect(nextOccurrenceByDays('2026-08-01', 30, '2026-07-18')).toBe('2026-08-31')
  })
  it('stepDays inválido degrada para start (não quebra)', () => {
    expect(nextOccurrenceByDays('2026-07-18', 0, '2026-07-18')).toBe('2026-07-18')
    expect(nextOccurrenceByDays('2026-07-18', -5, '2026-07-18')).toBe('2026-07-18')
  })
})

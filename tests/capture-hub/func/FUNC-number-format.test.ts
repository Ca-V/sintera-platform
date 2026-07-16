// FUNC · Formatação numérica pt-BR (valores/faixas de Exames). Fidelidade sem arredondar.
import { describe, it, expect } from 'vitest'
import { fmtNum, formatRef } from '@/lib/ui/number'

describe('fmtNum', () => {
  it('agrupa milhar e usa vírgula decimal, sem arredondar', () => {
    expect(fmtNum(1234.5)).toBe('1.234,5')
    expect(fmtNum(1000000)).toBe('1.000.000')
    expect(fmtNum(50)).toBe('50')
    expect(fmtNum(0.001)).toBe('0,001')
  })
  it('preserva o sinal negativo — inclusive em |valor| < 1 (ex.: base excess)', () => {
    expect(fmtNum(-2.5)).toBe('-2,5')
    expect(fmtNum(-0.5)).toBe('-0,5')      // antes virava "0,5" (sinal perdido)
    expect(fmtNum(-1234.5)).toBe('-1.234,5')
  })
  it('valores minúsculos NÃO viram "0" (sem notação científica)', () => {
    expect(fmtNum(0.0000001)).toBe('0,0000001')   // antes String() → "1e-7" → "0"
    expect(fmtNum(0)).toBe('0')
  })
})

describe('formatRef', () => {
  it('formata faixa/limites e vazio', () => {
    expect(formatRef(10, 20)).toBe('10 – 20')
    expect(formatRef(3.5, null)).toBe('> 3,5')
    expect(formatRef(null, 5)).toBe('< 5')
    expect(formatRef(null, null)).toBe('—')
  })
})

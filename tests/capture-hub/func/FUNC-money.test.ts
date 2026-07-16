// FUNC · Parsing financeiro (F8 — valor + NF). parseAmountToCents ⇄ centsToAmount.

import { describe, it, expect } from 'vitest'
import { parseAmountToCents, centsToAmount } from '@/lib/agenda/money'

describe('parseAmountToCents', () => {
  it('vírgula decimal → centavos', () => {
    expect(parseAmountToCents('250,00')).toBe(25000)
    expect(parseAmountToCents('49,90')).toBe(4990)
  })
  it('R$ e ponto de milhar', () => {
    expect(parseAmountToCents('R$ 1.234,56')).toBe(123456)
    expect(parseAmountToCents('R$1.000,00')).toBe(100000)
  })
  it('ponto decimal (sem vírgula) também vale', () => {
    expect(parseAmountToCents('1234.56')).toBe(123456)
    expect(parseAmountToCents('50')).toBe(5000)
    expect(parseAmountToCents('1.5')).toBe(150)      // ponto+1 dígito = decimal (R$1,50)
  })
  it('ponto de milhar SEM decimais (pt-BR) → não é decimal', () => {
    expect(parseAmountToCents('1.234')).toBe(123400)       // mil duzentos e trinta e quatro
    expect(parseAmountToCents('1.234.567')).toBe(123456700)
    expect(parseAmountToCents('R$ 2.000')).toBe(200000)
  })
  it('vazio/nulo/inválido/negativo → null', () => {
    expect(parseAmountToCents('')).toBeNull()
    expect(parseAmountToCents(null)).toBeNull()
    expect(parseAmountToCents('abc')).toBeNull()
    expect(parseAmountToCents('-10')).toBeNull()
  })
})

describe('centsToAmount', () => {
  it('centavos → "1234,56"; null → vazio', () => {
    expect(centsToAmount(123456)).toBe('1234,56')
    expect(centsToAmount(0)).toBe('0,00')
    expect(centsToAmount(null)).toBe('')
  })
  it('ida e volta preserva o valor', () => {
    expect(centsToAmount(parseAmountToCents('R$ 1.234,56'))).toBe('1234,56')
  })
})

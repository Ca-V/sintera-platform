// FUNC · parseExamDate — valida a data do laudo devolvida pela IA (FATO impresso, não juízo).
// Aceita só YYYY-MM-DD REAL e não-futura distante; rejeita formato/tipo/data inexistente.
import { describe, it, expect } from 'vitest'
import { parseExamDate } from './gateway'

describe('parseExamDate', () => {
  it('aceita data real bem formada', () => {
    expect(parseExamDate('2024-05-11')).toBe('2024-05-11')
    expect(parseExamDate(' 2024-05-11 ')).toBe('2024-05-11')  // apara espaços
  })
  it('rejeita tipo/format inválido', () => {
    expect(parseExamDate(null)).toBeNull()
    expect(parseExamDate(20240511)).toBeNull()
    expect(parseExamDate('11/05/2024')).toBeNull()
    expect(parseExamDate('2024-5-1')).toBeNull()
    expect(parseExamDate('2024-05-11T00:00:00')).toBeNull()
  })
  it('rejeita data inexistente (roundtrip) e mês/dia inválidos', () => {
    expect(parseExamDate('2026-02-30')).toBeNull()  // fev não tem 30
    expect(parseExamDate('2024-13-01')).toBeNull()  // mês 13
    expect(parseExamDate('2024-00-10')).toBeNull()  // mês 00
    expect(parseExamDate('2024-06-31')).toBeNull()  // junho não tem 31
  })
  it('rejeita ano fora da faixa (1900..ano+1)', () => {
    expect(parseExamDate('1899-01-01')).toBeNull()
    expect(parseExamDate('3000-01-01')).toBeNull()
  })
  it('aceita 29/02 em ano bissexto e rejeita em não-bissexto', () => {
    expect(parseExamDate('2024-02-29')).toBe('2024-02-29')  // 2024 bissexto
    expect(parseExamDate('2023-02-29')).toBeNull()          // 2023 não
  })
})

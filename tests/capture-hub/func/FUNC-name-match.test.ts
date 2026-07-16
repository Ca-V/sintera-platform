// FUNC · Conferência de identidade do paciente (nameMatch) — AVISO factual, não bloqueio.
// Importa a implementação REAL (o smoke .mjs duplicava a lógica; este teste evita drift).
import { describe, it, expect } from 'vitest'
import { compareNames, nameTokens } from '@/lib/exams/nameMatch'

describe('nameTokens', () => {
  it('normaliza acento/maiúsculas, remove conectivos e tokens curtos', () => {
    expect(nameTokens('José Antônio de Souza')).toEqual(['jose', 'antonio', 'souza'])
    expect(nameTokens('Maria da Silva e Costa')).toEqual(['maria', 'silva', 'costa'])
  })
})

describe('compareNames', () => {
  it('unverified quando falta um dos nomes ou não há tokens', () => {
    expect(compareNames(null, 'Fulano')).toBe('unverified')
    expect(compareNames('Fulano', undefined)).toBe('unverified')
    expect(compareNames('  ', 'Fulano')).toBe('unverified')
  })
  it('match: sobreposição suficiente (subconjunto do nome completo do laudo)', () => {
    expect(compareNames('Carina Leite', 'CARINA SOARES DE PAIVA LEITE')).toBe('match')
    expect(compareNames('José Antônio', 'JOSE ANTONIO SOUZA')).toBe('match')  // acentos normalizam
  })
  it('perfil com 1 token: basta o token aparecer', () => {
    expect(compareNames('Maria', 'Maria Santos')).toBe('match')
    expect(compareNames('Maria', 'João Santos')).toBe('mismatch')
  })
  it('mismatch: sobreposição insuficiente (provável outra pessoa)', () => {
    expect(compareNames('Carina Leite', 'João da Silva')).toBe('mismatch')
    expect(compareNames('Maria Silva', 'Maria Souza')).toBe('mismatch')  // só 1 em comum, perfil tem 2
  })
})

// @sintera/utils — utilidades genéricas.
import { describe, it, expect } from 'vitest'
import { initials } from '../../packages/utils/src'

describe('utils · initials', () => {
  it('primeira + última palavra, em maiúsculas', () => {
    expect(initials('Carina Leite')).toBe('CL')
    expect(initials('Ana Maria de Souza')).toBe('AS')
  })
  it('nome único → uma inicial', () => {
    expect(initials('Ana')).toBe('A')
  })
  it('vazio/nulo → ""', () => {
    expect(initials('')).toBe('')
    expect(initials(null)).toBe('')
    expect(initials('   ')).toBe('')
  })
})

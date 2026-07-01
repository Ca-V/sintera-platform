import { describe, it, expect } from 'vitest'
import { COPY, FORBIDDEN_VARIANTS, copy, type CopyKey } from './copy'

describe('Sistema de textos — frases canônicas', () => {
  it('toda frase canônica é não vazia', () => {
    for (const v of Object.values(COPY)) expect(v.trim().length).toBeGreaterThan(0)
  })

  it('copy() devolve a frase canônica', () => {
    expect(copy('documentSent')).toBe('Documento enviado')
    expect(copy('imageUnreadable')).toBe('Não consegui ler a imagem')
  })

  it('toda chave tem lista de variantes proibidas', () => {
    for (const key of Object.keys(COPY) as CopyKey[]) {
      expect(FORBIDDEN_VARIANTS[key]).toBeDefined()
    }
  })

  it('nenhuma variante proibida coincide com a frase canônica', () => {
    for (const key of Object.keys(COPY) as CopyKey[]) {
      for (const banned of FORBIDDEN_VARIANTS[key]) {
        expect(banned).not.toBe(COPY[key])
      }
    }
  })

  it('a mesma situação tem UMA frase (sem duplicar canônicas)', () => {
    const values = Object.values(COPY)
    expect(new Set(values).size).toBe(values.length)
  })
})

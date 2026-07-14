// ARCH · E5 — Taxonomia ABERTA de categorias de exame (Modelo Aberto).
//
// Certifica que a classificação de categorias é ABERTA/escalável e que ÔMICAS é uma categoria
// como qualquer outra (sem privilégio estrutural, sem "fluxo próprio" no modelo). Teste
// arquitetural: vale para todo o Capture Hub, não só Exames.

import { describe, it, expect } from 'vitest'
import { categoryOf, knownCategories, FALLBACK_CATEGORY } from '@/lib/capture/exam-categories'

describe('E5 · ômicas é UMA categoria (não privilegiada, mesma forma das demais)', () => {
  it('ômicas resolve para a categoria "Ômica" com a mesma forma { key, label }', () => {
    const omics = categoryOf('omics')
    expect(omics).toEqual({ key: 'omics', label: 'Ômica' })
    // mesma forma estrutural que uma categoria "comum"
    expect(Object.keys(omics).sort()).toEqual(Object.keys(categoryOf('laboratory')).sort())
  })

  it('ômicas aparece na lista de categorias conhecidas, sem destaque estrutural', () => {
    const keys = knownCategories().map(c => c.key)
    expect(keys).toContain('omics')
    expect(keys).toContain('laboratory')
    expect(keys).toContain('imaging')
  })
})

describe('E5 · taxonomia ABERTA — nunca quebra, extensível sem mudança estrutural', () => {
  it('tipo desconhecido/futuro cai na categoria genérica (não lança, não retorna null)', () => {
    expect(categoryOf('modalidade-que-ainda-nao-existe-2050')).toEqual(FALLBACK_CATEGORY)
    expect(categoryOf(null)).toEqual(FALLBACK_CATEGORY)
    expect(categoryOf(undefined)).toEqual(FALLBACK_CATEGORY)
    expect(categoryOf('')).toEqual(FALLBACK_CATEGORY)
  })

  it('é insensível a caixa/espaços (normaliza a chave)', () => {
    expect(categoryOf('  LABORATORY ')).toEqual(categoryOf('laboratory'))
    expect(categoryOf('Omics')).toEqual({ key: 'omics', label: 'Ômica' })
  })

  it('é determinística', () => {
    expect(categoryOf('imaging')).toEqual(categoryOf('imaging'))
  })
})

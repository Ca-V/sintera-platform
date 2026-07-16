// FUNC · Normalização do emissor/laboratório (EXA-F003) — robustez da identificação do card.
// TRANSCREVE o nome; descarta "sem dado" e rótulo "Emissor:" ecoado, MAS preserva nomes que
// legitimamente começam com "Laboratório/Clínica/Hospital".

import { describe, it, expect } from 'vitest'
import { normalizeIssuer } from '@/lib/ai/issuer'

describe('normalizeIssuer (EXA-F003)', () => {
  it('mantém o nome transcrito, aparando aspas/pontuação', () => {
    expect(normalizeIssuer('Fleury')).toBe('Fleury')
    expect(normalizeIssuer('"Hermes Pardini."')).toBe('Hermes Pardini')
  })

  it('PRESERVA nomes que começam com Laboratório/Clínica/Hospital (não são rótulo)', () => {
    expect(normalizeIssuer('Laboratório Sabin')).toBe('Laboratório Sabin')
    expect(normalizeIssuer('Clínica Axial')).toBe('Clínica Axial')
    expect(normalizeIssuer('Hospital Albert Einstein')).toBe('Hospital Albert Einstein')
  })

  it('remove só rótulos seguros ecoados ("Emissor:"/"Emitido por:")', () => {
    expect(normalizeIssuer('Emissor: Fleury')).toBe('Fleury')
    expect(normalizeIssuer('Emitido por - DASA')).toBe('DASA')
  })

  it('respostas de "sem dado" viram null', () => {
    for (const v of ['null', 'N/A', 'não informado', 'não consta', 'nenhum', '—']) {
      expect(normalizeIssuer(v)).toBeNull()
    }
  })

  it('vazio/verboso → null', () => {
    expect(normalizeIssuer('')).toBeNull()
    expect(normalizeIssuer(null)).toBeNull()
    expect(normalizeIssuer('x'.repeat(81))).toBeNull()
  })
})

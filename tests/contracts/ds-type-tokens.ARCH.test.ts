// ARCH — Contrato dos TOKENS TIPOGRÁFICOS (Passo 3B · Etapa 1 · Subitem 2).
// Papéis por INTENÇÃO (não heading1/2/3), família numérica própria, leitura prolongada e Dynamic Type.
import { describe, it, expect } from 'vitest'
import { fontFamily, typeRole, measure, scaleTextStyle, dynamicType } from '../../packages/design-system/src'

describe('ARCH · tipografia — base e papéis por intenção', () => {
  it('família oficial: Fraunces (títulos) + Hanken Grotesk (texto)', () => {
    expect(fontFamily.display).toContain('Fraunces')
    expect(fontFamily.text).toContain('Hanken Grotesk')
  })

  it('papéis são por INTENÇÃO (sem nomes de implementação heading1/2/3)', () => {
    for (const r of ['display', 'pageTitle', 'sectionTitle', 'cardTitle', 'body', 'bodyStrong', 'bodySmall', 'label', 'caption', 'reading'] as const) {
      expect(typeRole[r]).toBeDefined()
      expect(typeRole[r].fontSize).toBeGreaterThan(0)
    }
    expect((typeRole as unknown as Record<string, unknown>).heading1).toBeUndefined()
  })

  it('títulos usam a serifa (Fraunces); corpo/dados usam a de interface (Hanken)', () => {
    for (const r of ['display', 'pageTitle', 'sectionTitle', 'cardTitle'] as const) {
      expect(typeRole[r].fontFamily).toBe(fontFamily.display)
    }
    for (const r of ['body', 'bodyStrong', 'bodySmall', 'label', 'caption', 'reading'] as const) {
      expect(typeRole[r].fontFamily).toBe(fontFamily.text)
    }
  })

  it('hierarquia por tamanho: display ≥ pageTitle ≥ sectionTitle ≥ cardTitle > body', () => {
    expect(typeRole.display.fontSize).toBeGreaterThanOrEqual(typeRole.pageTitle.fontSize)
    expect(typeRole.pageTitle.fontSize).toBeGreaterThanOrEqual(typeRole.sectionTitle.fontSize)
    expect(typeRole.sectionTitle.fontSize).toBeGreaterThanOrEqual(typeRole.cardTitle.fontSize)
    expect(typeRole.cardTitle.fontSize).toBeGreaterThan(typeRole.body.fontSize)
  })

  it('família numérica própria — todos os níveis com algarismos tabulares', () => {
    for (const n of ['primary', 'secondary', 'reference', 'large'] as const) {
      expect(typeRole.numeric[n].fontFamily).toBe(fontFamily.text)
      expect(typeRole.numeric[n].fontFeatureSettings).toContain('tnum')
    }
    expect(typeRole.numeric.large.fontSize).toBeGreaterThan(typeRole.numeric.primary.fontSize)
  })

  it('leitura prolongada define largura máxima de coluna (measure) e line-height generoso', () => {
    expect(typeRole.reading.maxMeasureCh).toBe(measure.reading)
    expect(typeRole.reading.lineHeight).toBeGreaterThanOrEqual(1.7)
  })
})

describe('ARCH · tipografia — Dynamic Type (acessibilidade)', () => {
  it('amplia respeitando o fator e preserva os demais campos (inclui measure em reading)', () => {
    const scaled = scaleTextStyle(typeRole.reading, 1.4)
    expect(scaled.fontSize).toBeGreaterThan(typeRole.reading.fontSize)
    expect(scaled.maxMeasureCh).toBe(typeRole.reading.maxMeasureCh)
  })

  it('faz clamp nos limites min/max para não quebrar o layout', () => {
    expect(scaleTextStyle(typeRole.body, 5).fontSize).toBe(Math.round(typeRole.body.fontSize * dynamicType.max * 100) / 100)
    expect(scaleTextStyle(typeRole.body, 0.1).fontSize).toBe(Math.round(typeRole.body.fontSize * dynamicType.min * 100) / 100)
  })
})

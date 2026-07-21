// ARCH — Contrato dos TOKENS TIPOGRÁFICOS do Design System (Passo 3B · Etapa 1 · Subitem 2).
// Garante a separação BASE × PAPÉIS, a tipografia oficial (Fraunces + Hanken), números tabulares e Dynamic Type.
import { describe, it, expect } from 'vitest'
import {
  fontFamily, fontSize, typeRole, scaleTextStyle, dynamicType, type TypeRoleName,
} from '../../packages/design-system/src'

const ROLES: TypeRoleName[] = [
  'display', 'heading1', 'heading2', 'heading3', 'body', 'bodyStrong', 'label', 'caption', 'overline', 'numeric',
]

describe('ARCH · tipografia — base e papéis', () => {
  it('família oficial: Fraunces (display) + Hanken Grotesk (texto)', () => {
    expect(fontFamily.display).toContain('Fraunces')
    expect(fontFamily.text).toContain('Hanken Grotesk')
  })

  it('todos os papéis existem com estilo completo e tamanho positivo', () => {
    for (const r of ROLES) {
      const s = typeRole[r]
      expect(s).toBeDefined()
      expect(s.fontSize).toBeGreaterThan(0)
      expect(s.fontWeight).toBeGreaterThanOrEqual(400)
      expect(s.lineHeight).toBeGreaterThan(0)
      expect(typeof s.letterSpacing).toBe('string')
    }
  })

  it('títulos usam a serifa (Fraunces); corpo/dados usam a de interface (Hanken)', () => {
    for (const r of ['display', 'heading1', 'heading2', 'heading3'] as const) {
      expect(typeRole[r].fontFamily).toBe(fontFamily.display)
    }
    for (const r of ['body', 'bodyStrong', 'label', 'caption', 'numeric'] as const) {
      expect(typeRole[r].fontFamily).toBe(fontFamily.text)
    }
  })

  it('o papel numeric usa algarismos tabulares (fontFeatureSettings)', () => {
    expect(typeRole.numeric.fontFeatureSettings).toContain('tnum')
  })

  it('escala hierárquica: display ≥ heading1 ≥ heading2 ≥ heading3 ≥ body', () => {
    expect(fontSize.display).toBeGreaterThanOrEqual(typeRole.heading1.fontSize)
    expect(typeRole.heading1.fontSize).toBeGreaterThanOrEqual(typeRole.heading2.fontSize)
    expect(typeRole.heading2.fontSize).toBeGreaterThanOrEqual(typeRole.heading3.fontSize)
    expect(typeRole.heading3.fontSize).toBeGreaterThan(typeRole.body.fontSize)
  })
})

describe('ARCH · tipografia — Dynamic Type (acessibilidade)', () => {
  it('amplia o tamanho respeitando o fator', () => {
    const scaled = scaleTextStyle(typeRole.body, 1.4)
    expect(scaled.fontSize).toBeGreaterThan(typeRole.body.fontSize)
    expect(scaled.fontFamily).toBe(typeRole.body.fontFamily)
  })

  it('faz clamp nos limites (min/max) para não quebrar o layout', () => {
    expect(scaleTextStyle(typeRole.body, 5).fontSize).toBe(Math.round(typeRole.body.fontSize * dynamicType.max * 100) / 100)
    expect(scaleTextStyle(typeRole.body, 0.1).fontSize).toBe(Math.round(typeRole.body.fontSize * dynamicType.min * 100) / 100)
  })
})

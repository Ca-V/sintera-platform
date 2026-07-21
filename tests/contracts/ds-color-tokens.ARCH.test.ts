// ARCH — Contrato dos TOKENS DE COR do Design System (Passo 3B · Etapa 1 · Subitem 1).
// Garante forma da rampa, a âncora A·E, a separação IDENTIDADE × USO (papéis) e os contrastes WCAG
// (acessibilidade ESTRUTURAL, não posterior).
import { describe, it, expect } from 'vitest'
import {
  primary, neutral, roles, contrastRatio, relativeLuminance, WCAG, type Theme, type Scale,
} from '../../packages/design-system/src'

const HEX = /^#[0-9A-F]{6}$/
const STEPS: (keyof Scale)[] = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]
const THEMES: Theme[] = ['light', 'dark']

describe('ARCH · cor — forma e direção A·E', () => {
  it('rampa primária tem 10 degraus hex válidos por tema', () => {
    for (const t of THEMES) for (const s of STEPS) expect(primary[t][s]).toMatch(HEX)
  })

  it('a âncora oficial é #579DA8 (primary.light.500)', () => {
    expect(primary.light[500]).toBe('#579DA8')
  })

  it('gradiente monotônico: 50 é o mais claro e 900 o mais escuro (light)', () => {
    const lum = STEPS.map((s) => relativeLuminance(primary.light[s]))
    for (let i = 1; i < lum.length; i++) expect(lum[i]).toBeLessThan(lum[i - 1])
  })

  it('neutros quentes presentes e sem branco puro', () => {
    for (const t of THEMES) {
      for (const k of ['bg', 'surface', 'surfaceAlt', 'ink', 'muted', 'faint', 'line'] as const) {
        expect(neutral[t][k]).toMatch(HEX)
      }
    }
    expect(neutral.light.surface).not.toBe('#FFFFFF')
    expect(neutral.light.bg).not.toBe('#FFFFFF')
  })
})

describe('ARCH · cor — separação IDENTIDADE × USO (papéis)', () => {
  it('identidade e ação são tokens DISTINTOS (identity ≠ ação)', () => {
    for (const t of THEMES) {
      expect(roles[t].identity.primary).toMatch(HEX)
      expect(roles[t].button.primary.background).toMatch(HEX)
      expect(roles[t].identity.primary).not.toBe(roles[t].button.primary.background)
    }
  })
})

describe('ARCH · acessibilidade WCAG — AA estrutural', () => {
  for (const t of THEMES) {
    const r = roles[t]
    const bg = r.surface.base
    it(`[${t}] texto principal/secundário sobre a superfície ≥ AA normal`, () => {
      expect(contrastRatio(r.text.default, bg)).toBeGreaterThanOrEqual(WCAG.AA_NORMAL)
      expect(contrastRatio(r.text.muted, bg)).toBeGreaterThanOrEqual(WCAG.AA_NORMAL)
    })
    it(`[${t}] link e texto das semânticas ≥ AA normal sobre a superfície`, () => {
      expect(contrastRatio(r.link.default, bg)).toBeGreaterThanOrEqual(WCAG.AA_NORMAL)
      for (const s of ['info', 'success', 'attention', 'error'] as const) {
        expect(contrastRatio(r.badge[s].text, bg)).toBeGreaterThanOrEqual(WCAG.AA_NORMAL)
      }
    })
    it(`[${t}] AÇÃO (button.primary: texto × fundo) SEMPRE ≥ AA normal`, () => {
      expect(contrastRatio(r.button.primary.text, r.button.primary.background)).toBeGreaterThanOrEqual(WCAG.AA_NORMAL)
    })
  }
})

// ARCH — Contrato dos TOKENS DE COR do Design System (Passo 3B · Etapa 1 · Subitem 1).
// Garante forma da rampa, a âncora A·E e os contrastes WCAG (acessibilidade ESTRUTURAL, não posterior).
import { describe, it, expect } from 'vitest'
import {
  primary, neutral, colorTheme, contrastRatio, relativeLuminance, WCAG, type Theme, type Scale,
} from '../../packages/design-system/src'

const HEX = /^#[0-9A-F]{6}$/
const STEPS: (keyof Scale)[] = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]
const THEMES: Theme[] = ['light', 'dark']

describe('ARCH · tokens de cor — forma e direção A·E', () => {
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

describe('ARCH · acessibilidade WCAG — AA estrutural', () => {
  for (const t of THEMES) {
    const c = colorTheme[t]
    it(`[${t}] texto principal/secundário sobre a superfície ≥ AA normal`, () => {
      expect(contrastRatio(c.ink, c.surface)).toBeGreaterThanOrEqual(WCAG.AA_NORMAL)
      expect(contrastRatio(c.muted, c.surface)).toBeGreaterThanOrEqual(WCAG.AA_NORMAL)
    })
    it(`[${t}] primária-texto e semânticas-texto ≥ AA normal sobre a superfície`, () => {
      expect(contrastRatio(c.primaryText, c.surface)).toBeGreaterThanOrEqual(WCAG.AA_NORMAL)
      for (const s of ['info', 'success', 'attention', 'error'] as const) {
        expect(contrastRatio(c[s].text, c.surface)).toBeGreaterThanOrEqual(WCAG.AA_NORMAL)
      }
    })
    it(`[${t}] texto sobre a ação acessível (onPrimary × primaryStrong) ≥ AA normal`, () => {
      expect(contrastRatio(c.onPrimary, c.primaryStrong)).toBeGreaterThanOrEqual(WCAG.AA_NORMAL)
    })
    it(`[${t}] texto sobre a âncora (onPrimary × primary) ≥ AA large`, () => {
      expect(contrastRatio(c.onPrimary, c.primary)).toBeGreaterThanOrEqual(WCAG.AA_LARGE)
    })
  }
})

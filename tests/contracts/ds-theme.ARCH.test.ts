// ARCH — Contrato de LAYOUT + MONTAGEM DE TEMA (Passo 3B · Etapa 1 · Subitem 6/7 · validação consolidada).
import { describe, it, expect } from 'vitest'
import { breakpoint, grid, zIndex, getTheme, themes, type Theme } from '../../packages/design-system/src'

const THEMES: Theme[] = ['light', 'dark']

describe('ARCH · layout', () => {
  it('breakpoints mobile-first crescentes; grid e z-index coerentes', () => {
    expect(breakpoint.sm).toBeLessThan(breakpoint.md)
    expect(breakpoint.md).toBeLessThan(breakpoint.lg)
    expect(grid.columns).toBeGreaterThan(0)
    expect(zIndex.base).toBeLessThan(zIndex.modal)
    expect(zIndex.modal).toBeLessThan(zIndex.toast)
  })
})

describe('ARCH · montagem de tema (semântica de alto nível)', () => {
  it('getTheme expõe TODAS as camadas por modo', () => {
    for (const t of THEMES) {
      const th = getTheme(t)
      expect(th.mode).toBe(t)
      for (const k of ['color', 'elevation', 'typography', 'measure', 'spacing', 'padding', 'density', 'radius', 'border', 'opacity', 'motion', 'layout'] as const) {
        expect(th[k]).toBeDefined()
      }
      // a cor do tema é o conjunto de PAPÉIS (não a rampa crua)
      expect(th.color.button.primary.background).toMatch(/^#[0-9A-F]{6}$/)
      expect(th.color.identity.primary).toMatch(/^#[0-9A-F]{6}$/)
    }
  })

  it('light e dark são temas distintos e completos', () => {
    expect(themes.light.color.surface.base).not.toBe(themes.dark.color.surface.base)
  })
})

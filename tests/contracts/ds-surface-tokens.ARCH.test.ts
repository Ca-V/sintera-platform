// ARCH — Contrato de SUPERFÍCIE E ELEVAÇÃO (Passo 3B · Etapa 1 · Subitem 4).
import { describe, it, expect } from 'vitest'
import { radius, border, opacity, elevation, type Theme } from '../../packages/design-system/src'

const THEMES: Theme[] = ['light', 'dark']
const LEVELS = ['none', 'raised', 'overlay', 'sheet'] as const

describe('ARCH · superfície e elevação', () => {
  it('papéis de raio/borda/opacidade presentes e coerentes', () => {
    expect(radius.control).toBeLessThan(radius.card)
    expect(radius.card).toBeLessThanOrEqual(radius.sheet)
    expect(radius.pill).toBeGreaterThan(radius.sheet)
    expect(border.hairline).toBeLessThan(border.strong)
    for (const o of Object.values(opacity)) expect(o).toBeGreaterThanOrEqual(0), expect(o).toBeLessThanOrEqual(1)
  })

  it('elevação SUTIL e crescente por nível, em ambos os temas', () => {
    for (const t of THEMES) {
      const e = elevation[t]
      expect(e.none.opacity).toBe(0)
      expect(e.raised.blur).toBeLessThan(e.overlay.blur)
      expect(e.overlay.blur).toBeLessThan(e.sheet.blur)
      expect(e.raised.androidElevation).toBeLessThan(e.sheet.androidElevation)
      // discreta: opacidade da sombra de cartão baixa (orientado a dados, não decorativo)
      expect(e.raised.opacity).toBeLessThanOrEqual(0.45)
    }
  })
})

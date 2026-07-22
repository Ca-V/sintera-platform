// ARCH — Contrato do ADAPTADOR DE ELEVAÇÃO DS→React Native (mobile · Passo 3 · fundação).
// Verifica a tradução da sombra neutra do DS para as props de sombra do RN (iOS shadow* + Android elevation).
import { describe, it, expect } from 'vitest'
import { elevation, getTheme, type ShadowRole } from '../../packages/design-system/src'
import { toRNShadow, rnElevation, toRNShadowStack, rnShadow } from '../../apps/mobile/src/design-system/elevation'
import { toCSSBoxShadow } from '../../src/lib/ui/ds/css'

describe('ARCH · DS→RN — elevação/sombra', () => {
  it('traduz Shadow neutra para props do RN (iOS + Android)', () => {
    const raised = elevation.light.raised
    const rn = toRNShadow(raised)
    expect(rn.shadowColor).toBe(raised.color)
    expect(rn.shadowOffset).toEqual({ width: 0, height: raised.y })
    expect(rn.shadowOpacity).toBe(raised.opacity)
    expect(rn.shadowRadius).toBe(Math.round((raised.blur / 2) * 100) / 100) // blur CSS ≈ 2× shadowRadius iOS
    expect(rn.elevation).toBe(raised.androidElevation) // Android
  })

  it('nível "none" é sombra nula (não decora)', () => {
    const rn = toRNShadow(elevation.light.none)
    expect(rn.shadowOpacity).toBe(0)
    expect(rn.elevation).toBe(0)
  })

  it('elevação cresce com o nível (raised < overlay < sheet)', () => {
    const l = rnElevation('light')
    expect(l.raised.elevation).toBeLessThan(l.overlay.elevation)
    expect(l.overlay.elevation).toBeLessThan(l.sheet.elevation)
    expect(l.raised.shadowRadius).toBeLessThan(l.sheet.shadowRadius)
  })

  it('modo escuro tem sombra mais forte que o claro no mesmo nível', () => {
    expect(rnElevation('dark').sheet.shadowOpacity).toBeGreaterThan(rnElevation('light').sheet.shadowOpacity)
  })

  // --- Sombra por PAPEL (multi-camada) → RN, e paridade com a Web -----------
  it('papel multi-camada → RN pela camada dominante (maior blur+spread)', () => {
    const cardStack = getTheme('light').shadow.card // 2 camadas: contato (blur2) + difusa (blur22)
    const rn = toRNShadowStack(cardStack)
    const dominant = cardStack.reduce((a, b) => (b.blur + b.spread >= a.blur + a.spread ? b : a))
    expect(rn.shadowColor).toBe(dominant.color)
    expect(rn.shadowOffset).toEqual({ width: dominant.x ?? 0, height: dominant.y })
    expect(rn.shadowRadius).toBe(Math.round((dominant.blur / 2) * 100) / 100)
  })

  it('elevation Android segue a escala do token (raised≈1 < overlay < sheet)', () => {
    const s = rnShadow('light')
    expect(s.card.elevation).toBeGreaterThan(0)
    expect(s.overlay.elevation).toBeLessThan(s.sheet.elevation)
  })

  it('anel de foco não vira profundidade (elevation 0)', () => {
    // focus = anéis (spread) sem opacidade de sombra difusa; a camada dominante tem opacity 0 → sem elevação.
    const dominant = getTheme('light').shadow.focus.reduce((a, b) => (b.blur + b.spread >= a.blur + a.spread ? b : a))
    if (dominant.opacity === 0) expect(rnShadow('light').focus.elevation).toBe(0)
  })

  it('PARIDADE: mesma cor da camada dominante aparece no box-shadow da Web para o mesmo papel', () => {
    // A Web emite hex quando opacidade = 1 e rgba(r,g,b,a) quando < 1; o RN mantém o hex + shadowOpacity.
    // A paridade é de COR, não de representação: comparamos os canais RGB.
    const rgbTriple = (hex: string): string => {
      const n = parseInt(hex.replace('#', ''), 16)
      return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`
    }
    const roles = Object.keys(getTheme('light').shadow) as ShadowRole[]
    for (const role of roles) {
      const stack = getTheme('light').shadow[role]
      const css = toCSSBoxShadow(stack)
      const rn = toRNShadowStack(stack)
      expect(css.includes(rn.shadowColor) || css.includes(rgbTriple(rn.shadowColor))).toBe(true) // sem divergência de identidade
    }
  })

  it('modo escuro: papel de cartão mais forte que o claro', () => {
    expect(rnShadow('dark').card.shadowOpacity).toBeGreaterThan(rnShadow('light').card.shadowOpacity)
  })
})

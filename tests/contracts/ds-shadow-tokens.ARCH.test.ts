// ARCH — Contrato dos PAPÉIS DE SOMBRA (DS) + tradução Web (consolidação final DS-002).
// A sombra institucional deixa o globals.css e vive no DS; a Web apenas traduz para `box-shadow`.
import { describe, it, expect } from 'vitest'
import { shadow, getTheme } from '../../packages/design-system/src'
import { toCSSBoxShadow } from '../../src/lib/ui/ds/css'

describe('ARCH · sombras — DS é a fonte; Web traduz para box-shadow', () => {
  it('cartão = duas camadas sutis (contato + difusa), cor = tinta quente', () => {
    expect(toCSSBoxShadow(shadow.light.card)).toBe(
      '0px 1px 2px rgba(36,31,26,0.035), 0px 6px 22px rgba(36,31,26,0.045)'
    )
    expect(toCSSBoxShadow(shadow.light.cardHover)).toBe(
      '0px 2px 6px rgba(36,31,26,0.05), 0px 10px 30px rgba(36,31,26,0.07)'
    )
  })

  it('foco = anel: halo sólido da superfície + anel na âncora A·E (#579DA8 = rgb 87,157,168)', () => {
    expect(toCSSBoxShadow(shadow.light.focus)).toBe(
      '0px 0px 0px 3px #FBF8F2, 0px 0px 0px 4px rgba(87,157,168,0.3)'
    )
  })

  it('overlay/sheet sobem em profundidade; botão usa a cor da ação', () => {
    expect(toCSSBoxShadow(shadow.light.overlay)).toBe('0px 4px 12px rgba(36,31,26,0.12)')
    expect(toCSSBoxShadow(shadow.light.sheet)).toBe('0px 8px 28px rgba(36,31,26,0.16)')
    expect(toCSSBoxShadow(shadow.light.button)).toBe('0px 2px 8px rgba(61,108,123,0.2)') // #3D6C7B = ação
  })

  it('modo escuro é mais forte no mesmo papel', () => {
    // compara a opacidade da 2ª camada do cartão (difusa)
    expect(shadow.dark.card[1].opacity).toBeGreaterThan(shadow.light.card[1].opacity)
  })

  it('as sombras estão no THEME (theme.shadow.*), consumíveis por Web e Mobile', () => {
    expect(getTheme('light').shadow.card).toBe(shadow.light.card)
    expect(getTheme('dark').shadow.overlay).toBe(shadow.dark.overlay)
  })
})

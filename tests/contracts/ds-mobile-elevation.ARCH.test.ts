// ARCH — Contrato do ADAPTADOR DE ELEVAÇÃO DS→React Native (mobile · Passo 3 · fundação).
// Verifica a tradução da sombra neutra do DS para as props de sombra do RN (iOS shadow* + Android elevation).
import { describe, it, expect } from 'vitest'
import { elevation } from '../../packages/design-system/src'
import { toRNShadow, rnElevation } from '../../apps/mobile/src/design-system/elevation'

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
})

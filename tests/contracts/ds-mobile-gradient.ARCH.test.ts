// ARCH — Contrato do ADAPTADOR DE GRADIENTE DS→React Native (mobile) e sua PARIDADE com a Web.
// A identidade cromática vive só no token (DS-002); web e mobile apenas TRADUZEM o mesmo token. Este contrato
// garante que a tradução RN (expo-linear-gradient: colors/locations/start/end) preserva as cores e a ordem que
// a Web produz em `linear-gradient`, e que a direção (ângulo) vira start/end coerentes.
import { describe, it, expect } from 'vitest'
import { gradient, type GradientToken } from '../../packages/design-system/src'
import { toRNGradient, rnGradient, angleToStartEnd } from '../../apps/mobile/src/design-system/gradient'
import { toCSSGradient } from '../../src/lib/ui/ds/css'

describe('ARCH · DS→RN — gradiente e paridade com a Web', () => {
  it('token linear (action) → cores/paradas na ordem do DS; locations em 0..1', () => {
    const rn = rnGradient('action')
    const stops = (gradient.action.layers[0] as { stops: { color: string; at?: number }[] }).stops
    expect(rn.colors).toEqual(stops.map((s) => s.color)) // mesma ordem que o DS/CSS
    expect(rn.locations).toEqual(stops.map((s) => (s.at as number) / 100)) // % → fração
    expect(rn.locations!.every((l) => l >= 0 && l <= 1)).toBe(true)
  })

  it('ângulo CSS vira start/end unitários (0..1) e coerentes com o significado do CSS', () => {
    // 0deg: base→topo (start embaixo, end em cima). 90deg: esquerda→direita. 135deg: topo-esq → base-dir.
    expect(angleToStartEnd(0)).toEqual({ start: { x: 0.5, y: 1 }, end: { x: 0.5, y: 0 } })
    expect(angleToStartEnd(90)).toEqual({ start: { x: 0, y: 0.5 }, end: { x: 1, y: 0.5 } })
    const d = angleToStartEnd(135)
    expect(d.end.x).toBeGreaterThan(0.5) // aponta para a direita
    expect(d.end.y).toBeGreaterThan(0.5) // e para baixo
  })

  it('start e end são simétricos em torno do centro (reta passa por 0.5,0.5)', () => {
    for (const a of [0, 45, 90, 135, 160, 180]) {
      const { start, end } = angleToStartEnd(a)
      expect(start.x + end.x).toBeCloseTo(1, 6)
      expect(start.y + end.y).toBeCloseTo(1, 6)
    }
  })

  it('PARIDADE: toda cor que o RN usa aparece no CSS da Web para o mesmo token (mesma identidade)', () => {
    const tokens = Object.keys(gradient) as GradientToken[]
    for (const token of tokens) {
      const css = toCSSGradient(gradient[token])
      for (const color of toRNGradient(gradient[token]).colors) {
        if (color === 'transparent') continue
        expect(css).toContain(color) // a cor traduzida no RN existe na tradução Web → sem divergência de identidade
      }
    }
  })

  it('multi-camada/radial (hero) não quebra: aproxima pela 1ª camada linear', () => {
    const rn = rnGradient('hero')
    expect(rn.colors.length).toBeGreaterThan(0) // nunca vazio (fallback documentado)
    expect(rn.start).toBeDefined()
    expect(rn.end).toBeDefined()
  })

  it('sem locations quando alguma parada não tem posição (distribuição uniforme padrão do RN)', () => {
    // hero: a 1ª camada linear tem paradas 0 e 100 → tem locations; garantimos apenas o invariante do contrato:
    const rn = toRNGradient({ layers: [{ type: 'linear', angle: 90, stops: [{ color: '#000' }, { color: '#fff' }] }] })
    expect(rn.locations).toBeUndefined()
    expect(rn.colors).toEqual(['#000', '#fff'])
  })
})

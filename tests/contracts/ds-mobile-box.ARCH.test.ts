// ARCH — Contrato do ADAPTADOR DE VisualSpec DS→React Native (caixa + texto) e sua PARIDADE com a Web.
// Garante que QUALQUER recipe (button/card/badge/…) traduz para o RN preservando os valores que a recipe decidiu
// (cor, raio, padding, borda, opacidade, gradiente, sombra) — a mesma fonte da verdade que a Web consome.
import { describe, it, expect } from 'vitest'
import { getTheme, button, card, badge, chip } from '../../packages/design-system/src'
import { toRNBox, toRNText } from '../../apps/mobile/src/design-system/box'
import { rnGradient } from '../../apps/mobile/src/design-system/gradient'
import { rnShadow, rnElevation } from '../../apps/mobile/src/design-system/elevation'

const t = getTheme('light')

describe('ARCH · DS→RN — VisualSpec (caixa + texto) e paridade com a recipe', () => {
  it('caixa preserva os valores decididos pela recipe (raio/padding/borda/cor)', () => {
    const spec = card(t).container
    const box = toRNBox('light', spec)
    expect(box.style.backgroundColor).toBe(spec.backgroundColor)
    expect(box.style.borderRadius).toBe(spec.radius)
    expect(box.style.paddingHorizontal).toBe(spec.paddingX)
    expect(box.style.paddingVertical).toBe(spec.paddingY)
    expect(box.style.borderWidth).toBe(spec.borderWidth)
    expect(box.style.borderColor).toBe(spec.borderColor)
  })

  it('botão primário: gradiente vem do MESMO token da recipe (action)', () => {
    const box = toRNBox('light', button(t, { variant: 'primary' }).container)
    expect(box.gradient).toEqual(rnGradient('action'))
    // secundário/ghost não têm gradiente → sem descritor (só cor sólida)
    expect(toRNBox('light', button(t, { variant: 'secondary' }).container).gradient).toBeUndefined()
    expect(toRNBox('light', button(t, { variant: 'ghost' }).container).gradient).toBeUndefined()
  })

  it('sombra: papel (card) usa rnShadow; sem papel usa a elevação base', () => {
    expect(toRNBox('light', card(t).container).shadow).toEqual(rnShadow('light').card) // card tem shadowRole
    // badge não tem shadowRole → cai na elevação (none)
    expect(toRNBox('light', badge(t).container).shadow).toEqual(rnElevation('light').none)
  })

  it('borda ausente não emite borderWidth/borderColor (chip selecionado)', () => {
    const box = toRNBox('light', chip(t, { selected: true }).container)
    expect(box.style.borderWidth).toBeUndefined()
    expect(box.style.borderColor).toBeUndefined()
  })

  it('opacidade 1 é omitida; disabled propaga a opacidade do tema', () => {
    expect(toRNBox('light', button(t).container).style.opacity).toBeUndefined() // opacity 1 → omitido
    expect(toRNBox('light', button(t, { state: 'disabled' }).container).style.opacity).toBe(t.opacity.disabled)
  })

  it('texto: descritor RN carrega a cor do papel decidida pela recipe', () => {
    const spec = badge(t).label
    const txt = toRNText(spec)
    expect(txt.color).toBe(spec.color)
    expect(txt.fontSize).toBe(spec.style.fontSize)
  })
})

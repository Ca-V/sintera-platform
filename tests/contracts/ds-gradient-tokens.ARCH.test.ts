// ARCH — Contrato dos TOKENS DE GRADIENTE (DS) + tradução Web (consolidação final DS-002).
// Prova que a identidade de gradiente vive no DS e que a Web apenas TRADUZ para CSS reproduzindo EXATAMENTE
// o que hoje está no globals.css (parity) — condição para remover os gradientes do globals.css sem mudar a identidade.
import { describe, it, expect } from 'vitest'
import { gradient, getTheme } from '../../packages/design-system/src'
import { toCSSGradient } from '../../src/lib/ui/ds/css'

describe('ARCH · gradientes — DS é a fonte; Web traduz (parity com o globals.css atual)', () => {
  it('núcleo institucional reproduz o CSS atual', () => {
    expect(toCSSGradient(gradient.action)).toBe('linear-gradient(135deg, #3D6C7B 0%, #74B8B9 100%)')
    expect(toCSSGradient(gradient.brand)).toBe('linear-gradient(135deg, #488593 0%, #74B8B9 100%)')
    expect(toCSSGradient(gradient.surfaceSoft)).toBe('linear-gradient(135deg, #D9EDE8 0%, #EEF7F4 100%)')
    expect(toCSSGradient(gradient.surface)).toBe('linear-gradient(160deg, #FBF8F2 0%, #EEF7F4 45%, #D9EDE8 100%)')
    expect(toCSSGradient(gradient.dark)).toBe('linear-gradient(135deg, #26404A 0%, #325562 60%, #3D6C7B 100%)')
    expect(toCSSGradient(gradient.cardDark)).toBe('linear-gradient(145deg, #325562 0%, #3D6C7B 100%)')
  })

  it('ASSINATURA aqua = mesmo painel do Login/Sidebar/landing (idêntico em toda a plataforma)', () => {
    expect(toCSSGradient(gradient.signature)).toBe('linear-gradient(150deg, #9BD8E0 0%, #6FC1CF 58%, #57B0BF 100%)')
  })

  it('barra-glow do item ativo e acentos de domínio reproduzem o CSS atual', () => {
    expect(toCSSGradient(gradient.activeGlow)).toBe('linear-gradient(180deg, #579DA8 0%, #3D6C7B 100%)')
    expect(toCSSGradient(gradient.sleep)).toBe('linear-gradient(135deg, #579DA8 0%, #97C9C3 100%)')
    expect(toCSSGradient(gradient.energy)).toBe('linear-gradient(135deg, #B98A46 0%, #D4B37A 100%)')
    expect(toCSSGradient(gradient.cycle)).toBe('linear-gradient(135deg, #B15C4C 0%, #CE8570 100%)')
    expect(toCSSGradient(gradient.hydration)).toBe('linear-gradient(135deg, #7E9B6E 0%, #A6BE99 100%)')
  })

  it('HERO combina duas camadas radiais + uma linear (na ordem)', () => {
    const css = toCSSGradient(gradient.hero)
    expect(css).toBe(
      'radial-gradient(ellipse 80% 60% at 70% 50%, rgba(151,201,195,0.18) 0%, transparent 70%), ' +
      'radial-gradient(ellipse 60% 80% at 30% 80%, rgba(87,157,168,0.08) 0%, transparent 60%), ' +
      'linear-gradient(160deg, #FBF8F2 0%, #EEF7F4 100%)'
    )
  })

  it('gradiente de texto (marca/shimmer) reproduz o CSS atual', () => {
    expect(toCSSGradient(gradient.textBrand)).toBe('linear-gradient(135deg, #3D6C7B 0%, #579DA8 100%)')
    expect(toCSSGradient(gradient.textShimmer)).toBe('linear-gradient(90deg, #3D6C7B 0%, #97C9C3 30%, #579DA8 60%, #97C9C3 80%, #3D6C7B 100%)')
  })

  it('os gradientes estão no THEME (theme.gradient.*), consumíveis por Web e Mobile', () => {
    expect(getTheme('light').gradient.action).toBe(gradient.action)
    expect(getTheme('dark').gradient.signature).toBe(gradient.signature) // identidade única entre modos
  })
})

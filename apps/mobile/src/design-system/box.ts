// design-system (mobile) — ADAPTADOR DE VisualSpec DS→React Native (caixa + texto).
// Espelha o adaptador Web (src/lib/ui/ds/style.ts `boxStyle`/`textStyle`): recebe o MESMO VisualSpec headless
// que as recipes (@sintera/design-system) produzem e o traduz para o formato de estilo do RN. A DECISÃO visual
// vive na recipe/token; aqui só há tradução técnica (ADR-011). Com isto, QUALQUER recipe (button/card/badge/…)
// já rende no RN — a implementação nativa vira ADAPTAÇÃO, não redesenho.
//
// Módulo PURO (não importa 'react-native' nem 'expo-linear-gradient') → verificável por tsc/testes no sandbox.
//
// Diferença estrutural RN × Web: o RN NÃO coloca gradiente num `style` — ele exige um componente
// (<LinearGradient>). Por isso `toRNBox` devolve o gradiente SEPARADO (descritor), além do `style` e da `shadow`.
// O `backgroundColor` permanece como fallback sólido quando não há gradiente (ou enquanto ele carrega).
import type { BoxSpec, TextSpec, Theme } from '@sintera/design-system'
import { rnGradient, type RNGradient } from './gradient'
import { rnShadow, rnElevation, type RNShadowStyle } from './elevation'
import { toRNTextStyle, type RNTextStyle } from './typography'

/** Formato de estilo de VIEW do RN (subconjunto usado pelo DS). Declarado à mão para NÃO depender de 'react-native'. */
export interface RNViewStyle {
  backgroundColor?: string
  borderWidth?: number
  borderColor?: string
  borderRadius: number
  paddingHorizontal: number
  paddingVertical: number
  minHeight?: number
  opacity?: number
}

/** Resultado da tradução de uma caixa: estilo da View + (opcional) gradiente + sombra, para o RN montar. */
export interface RNBox {
  style: RNViewStyle
  gradient?: RNGradient
  shadow: RNShadowStyle
}

/** Traduz um BoxSpec (saída de qualquer recipe) para o RN: View style + gradiente (se houver) + sombra. */
export function toRNBox(mode: Theme, spec: BoxSpec): RNBox {
  const style: RNViewStyle = {
    backgroundColor: spec.backgroundColor,
    borderRadius: spec.radius,
    paddingHorizontal: spec.paddingX,
    paddingVertical: spec.paddingY,
  }
  if (spec.borderWidth) {
    style.borderWidth = spec.borderWidth
    style.borderColor = spec.borderColor
  }
  if (spec.minHeight !== undefined) style.minHeight = spec.minHeight
  if (spec.opacity !== 1) style.opacity = spec.opacity
  // Sombra: papel multi-camada (rico) quando pedido; senão, a elevação base cross-platform.
  const shadow = spec.shadowRole ? rnShadow(mode)[spec.shadowRole] : rnElevation(mode)[spec.elevation]
  return {
    style,
    // Gradiente por papel (ex.: botão primário = 'action'); o backgroundColor acima fica como fallback.
    ...(spec.backgroundGradient ? { gradient: rnGradient(spec.backgroundGradient) } : {}),
    shadow,
  }
}

/** Descritor de texto do RN + cor (papel). Espelha o `textStyle` da Web. */
export type RNText = RNTextStyle & { color: string }

/** Traduz um TextSpec (saída de recipe) para o descritor de texto do RN, com a cor do papel. */
export function toRNText(spec: TextSpec): RNText {
  return { ...toRNTextStyle(spec.style), color: spec.color }
}

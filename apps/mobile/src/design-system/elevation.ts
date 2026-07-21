// design-system (mobile) — ADAPTADOR DE ELEVAÇÃO DS→React Native.
// A sombra é descrita de forma NEUTRA no token (@sintera/design-system: y/blur/spread/color/opacity/
// androidElevation) exatamente para cada plataforma traduzir. Aqui traduzimos para as props de sombra do RN
// (iOS: shadow*; Android: elevation). Módulo PURO (não importa 'react-native') → verificável por tsc/testes.
//
// Diferenças RN × Web tratadas aqui:
//   • iOS usa shadowOffset/shadowOpacity/shadowRadius/shadowColor; Android usa `elevation` (inteiro).
//   • `blur` do CSS ≈ 2× o shadowRadius do iOS → shadowRadius = blur / 2.
//   • RN NÃO suporta `spread` de sombra → é descartado (documentado).
import { elevation, type Shadow, type ElevationLevel } from '@sintera/design-system'
import type { Theme } from '@sintera/design-system'

/** Props de sombra do React Native (subconjunto). Declarado à mão para não depender de 'react-native'. */
export interface RNShadowStyle {
  shadowColor: string
  shadowOffset: { width: number; height: number }
  shadowOpacity: number
  shadowRadius: number
  elevation: number // Android
}

/** Traduz uma Shadow neutra do DS para as props de sombra do RN. `spread` não existe no RN e é ignorado. */
export function toRNShadow(shadow: Shadow): RNShadowStyle {
  return {
    shadowColor: shadow.color,
    shadowOffset: { width: 0, height: shadow.y },
    shadowOpacity: shadow.opacity,
    // CSS blur ≈ 2× shadowRadius do iOS.
    shadowRadius: Math.round((shadow.blur / 2) * 100) / 100,
    elevation: shadow.androidElevation,
  }
}

/** Todos os níveis de elevação de um modo (light/dark) já traduzidos para RN. */
export function rnElevation(mode: Theme): Record<ElevationLevel, RNShadowStyle> {
  const src = elevation[mode]
  return {
    none:    toRNShadow(src.none),
    raised:  toRNShadow(src.raised),
    overlay: toRNShadow(src.overlay),
    sheet:   toRNShadow(src.sheet),
  }
}

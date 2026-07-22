// design-system (mobile) — ADAPTADOR DE ELEVAÇÃO DS→React Native.
// A sombra é descrita de forma NEUTRA no token (@sintera/design-system: y/blur/spread/color/opacity/
// androidElevation) exatamente para cada plataforma traduzir. Aqui traduzimos para as props de sombra do RN
// (iOS: shadow*; Android: elevation). Módulo PURO (não importa 'react-native') → verificável por tsc/testes.
//
// Diferenças RN × Web tratadas aqui:
//   • iOS usa shadowOffset/shadowOpacity/shadowRadius/shadowColor; Android usa `elevation` (inteiro).
//   • `blur` do CSS ≈ 2× o shadowRadius do iOS → shadowRadius = blur / 2.
//   • RN NÃO suporta `spread` de sombra → é descartado (documentado).
import { elevation, getTheme, type Shadow, type ElevationLevel, type ShadowStack, type ShadowRole } from '@sintera/design-system'
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

// ---------------------------------------------------------------------------
// SOMBRA por PAPEL (multi-camada) → RN. Espelha o adaptador Web (toCSSBoxShadow), que empilha N camadas em
// `box-shadow`. O RN aplica UMA sombra por elemento, então aproximamos pela CAMADA DOMINANTE — a de maior
// difusão visual (blur + spread). `androidElevation` é derivado da geometria (o token multi-camada não o traz),
// mantendo a mesma escala do token `elevation`: ≈ (y + blur) / 3. Módulo PURO → verificável por tsc/testes.
// ---------------------------------------------------------------------------

const EMPTY_RN_SHADOW: RNShadowStyle = {
  shadowColor: '#000000', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0,
}

/** Traduz um PAPEL de sombra do DS (pilha multi-camada) para as props do RN, pela camada dominante (blur+spread). */
export function toRNShadowStack(stack: ShadowStack): RNShadowStyle {
  if (!stack.length) return EMPTY_RN_SHADOW
  const d = stack.reduce((a, b) => (b.blur + b.spread >= a.blur + a.spread ? b : a))
  return {
    shadowColor: d.color,
    shadowOffset: { width: d.x ?? 0, height: d.y },
    shadowOpacity: d.opacity,
    // CSS blur ≈ 2× shadowRadius do iOS.
    shadowRadius: Math.round((d.blur / 2) * 100) / 100,
    // Escala coerente com o token `elevation` (raised≈1, overlay≈6, sheet≈12); anel de foco (opacidade 0/ blur 0) = 0.
    elevation: d.opacity === 0 ? 0 : Math.round((d.y + d.blur) / 3),
  }
}

/** Todos os PAPÉIS de sombra de um modo (card/overlay/…) já traduzidos para RN. */
export function rnShadow(mode: Theme): Record<ShadowRole, RNShadowStyle> {
  const src = getTheme(mode).shadow
  const roles = Object.keys(src) as ShadowRole[]
  return roles.reduce((acc, role) => {
    acc[role] = toRNShadowStack(src[role])
    return acc
  }, {} as Record<ShadowRole, RNShadowStyle>)
}

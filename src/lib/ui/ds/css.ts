// Adaptador WEB — TRADUÇÃO de tokens do Design System para CSS. A identidade vive no DS (@sintera/design-system);
// aqui a Web apenas TRADUZ (nunca define). Espelha o papel do adaptador RN (apps/mobile/src/design-system):
// o mesmo token de gradiente/sombra vira `linear-gradient`/`box-shadow` na Web e `expo-linear-gradient`/`shadow*`
// no mobile. Consolidação final DS-002 (fundadora 2026-07-21): globals.css fica sem identidade; a Web consome daqui.
import type { Gradient, GradientLayer, GradientStop, ShadowStack, ShadowLayer } from '@sintera/design-system'

function stop(s: GradientStop): string {
  return s.at === undefined ? s.color : `${s.color} ${s.at}%`
}

function layer(l: GradientLayer): string {
  const stops = l.stops.map(stop).join(', ')
  return l.type === 'linear'
    ? `linear-gradient(${l.angle}deg, ${stops})`
    : `radial-gradient(${l.shape}, ${stops})`
}

/** Traduz um token de gradiente do DS para o valor CSS `background` (uma ou mais camadas). */
export function toCSSGradient(g: Gradient): string {
  return g.layers.map(layer).join(', ')
}

function shadowLayer(l: ShadowLayer): string {
  const x = l.x ?? 0
  const parts = [`${x}px`, `${l.y}px`, `${l.blur}px`]
  if (l.spread) parts.push(`${l.spread}px`)
  parts.push(colorWithOpacity(l.color, l.opacity))
  const s = parts.join(' ')
  return l.inset ? `inset ${s}` : s
}

/** Traduz um papel de sombra do DS (pilha multi-camada) para o valor CSS `box-shadow`. */
export function toCSSBoxShadow(stack: ShadowStack): string {
  if (!stack.length) return 'none'
  return stack.map(shadowLayer).join(', ')
}

/** Cor + opacidade → hex sólido (opacidade 1) ou rgba(); já-rgba/nome passa direto. */
function colorWithOpacity(color: string, opacity: number): string {
  if (opacity >= 1) return color
  const m = color.replace('#', '').match(/^([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/)
  if (!m) return color
  const [r, g, b] = [m[1], m[2], m[3]].map((h) => parseInt(h, 16))
  return `rgba(${r},${g},${b},${opacity})`
}

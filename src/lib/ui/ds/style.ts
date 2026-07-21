// Adaptador Web do DS-002 — tradução TÉCNICA de VisualSpec (headless) para estilo React.
// ADR-011: aqui NÃO há decisão de design, token ou regra de negócio — só o mapeamento para CSS.
import type { CSSProperties } from 'react'
import type { SinteraTheme, BoxSpec, TextSpec, Shadow } from '@sintera/design-system'
import { resolveFontFamily } from './fonts'
import { toCSSBoxShadow } from './css'

function rgba(hex: string, alpha: number): string {
  const n = parseInt(hex.replace('#', ''), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

export function shadowCss(s: Shadow): string {
  return s.opacity === 0 ? 'none' : `0 ${s.y}px ${s.blur}px ${s.spread}px ${rgba(s.color, s.opacity)}`
}

export function boxStyle(t: SinteraTheme, spec: BoxSpec): CSSProperties {
  return {
    backgroundColor: spec.backgroundColor,
    border: spec.borderWidth ? `${spec.borderWidth}px solid ${spec.borderColor}` : undefined,
    borderRadius: spec.radius,
    padding: `${spec.paddingY}px ${spec.paddingX}px`,
    minHeight: spec.minHeight,
    opacity: spec.opacity,
    // Web prefere a sombra multi-camada por papel (ex.: card = 2 camadas); sem papel, usa a elevação base.
    boxShadow: spec.shadowRole ? toCSSBoxShadow(t.shadow[spec.shadowRole]) : shadowCss(t.elevation[spec.elevation]),
  }
}

export function textStyle(spec: TextSpec): CSSProperties {
  const s = spec.style
  return {
    fontFamily: resolveFontFamily(s.fontFamily),
    fontSize: s.fontSize,
    fontWeight: s.fontWeight,
    lineHeight: s.lineHeight,
    letterSpacing: s.letterSpacing,
    textTransform: s.textTransform,
    fontFeatureSettings: s.fontFeatureSettings,
    color: spec.color,
    margin: 0,
  }
}

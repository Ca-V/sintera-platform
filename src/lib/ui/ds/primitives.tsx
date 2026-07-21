'use client'
// Adaptador Web — componentes fundamentais (Etapa 3). Cada um consome a recipe do DS e aplica o VisualSpec.
// Nenhuma decisão de design aqui (ADR-011): variantes/tamanhos/estados/cores vêm da recipe.
import type { CSSProperties, ReactNode } from 'react'
import * as ds from '@sintera/design-system'
import { useDs } from './theme'
import { boxStyle, textStyle, shadowCss } from './style'

type WithStyle = { style?: CSSProperties; children?: ReactNode }

export function Text({ role = 'body', tone = 'default', block, children, style }:
  { role?: ds.TextRole; tone?: ds.TextTone; block?: boolean } & WithStyle) {
  const spec = ds.text(useDs(), { role, tone })
  const Tag = block ? 'p' : 'span'
  return <Tag style={{ ...textStyle(spec), ...style }}>{children}</Tag>
}

export function Numeric({ level = 'primary', color, children, style }:
  { level?: 'primary' | 'secondary' | 'reference' | 'large'; color?: string } & WithStyle) {
  const t = useDs()
  return <span style={{ ...textStyle({ style: t.typography.numeric[level], color: color ?? t.color.text.default }), ...style }}>{children}</span>
}

export function Heading({ level = 'section', children, style }:
  { level?: ds.HeadingLevel } & WithStyle) {
  const spec = ds.heading(useDs(), { level })
  const Tag = level === 'display' || level === 'page' ? 'h1' : level === 'section' ? 'h2' : 'h3'
  return <Tag style={{ ...textStyle(spec), textWrap: 'balance', ...style } as CSSProperties}>{children}</Tag>
}

export function Button({ variant = 'primary', size = 'md', disabled, onClick, type = 'button', children, style }:
  { variant?: ds.ButtonVariant; size?: ds.Size; disabled?: boolean; onClick?: () => void; type?: 'button' | 'submit' } & WithStyle) {
  const t = useDs()
  const spec = ds.button(t, { variant, size, state: disabled ? 'disabled' : 'default' })
  return (
    <button type={type} disabled={disabled} onClick={onClick}
      style={{ ...boxStyle(t, spec.container), ...textStyle(spec.label), display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: disabled ? 'not-allowed' : 'pointer', ...style }}>
      {children}
    </button>
  )
}

export function Card({ elevation, padding, children, style }:
  { elevation?: ds.ElevationLevel; padding?: 'cozy' | 'default' | 'relaxed' } & WithStyle) {
  const t = useDs()
  return <div style={{ ...boxStyle(t, ds.card(t, { elevation, padding }).container), ...style }}>{children}</div>
}

export function Surface({ tone = 'base', children, style }:
  { tone?: 'base' | 'app' | 'accent' } & WithStyle) {
  const t = useDs()
  const s = ds.surface(t, { tone })
  return <div style={{ backgroundColor: s.backgroundColor, borderRadius: s.radius, boxShadow: shadowCss(t.elevation[s.elevation]), ...style }}>{children}</div>
}

export function Badge({ tone = 'info', children, style }:
  { tone?: ds.SemanticTone } & WithStyle) {
  const t = useDs()
  const spec = ds.badge(t, { tone })
  return <span style={{ ...boxStyle(t, spec.container), ...textStyle(spec.label), display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap', ...style }}>{children}</span>
}

export function Chip({ selected, onClick, children, style }:
  { selected?: boolean; onClick?: () => void } & WithStyle) {
  const t = useDs()
  const spec = ds.chip(t, { selected })
  return <button type="button" onClick={onClick} style={{ ...boxStyle(t, spec.container), ...textStyle(spec.label), cursor: onClick ? 'pointer' : 'default', ...style }}>{children}</button>
}

export function Divider({ style }: { style?: CSSProperties }) {
  const d = ds.divider(useDs())
  return <hr style={{ border: 'none', borderTop: `${d.thickness}px solid ${d.color}`, margin: 0, ...style }} />
}

export function Icon({ size = 'md', tone = 'default', children, style }:
  { size?: ds.Size; tone?: 'default' | 'muted' | 'identity' | 'onAction' } & WithStyle) {
  const s = ds.icon(useDs(), { size, tone })
  return <span aria-hidden style={{ display: 'inline-flex', width: s.size, height: s.size, color: s.color, alignItems: 'center', justifyContent: 'center', ...style }}>{children}</span>
}

export function Avatar({ size = 'md', children, style }: { size?: ds.Size } & WithStyle) {
  const a = ds.avatar(useDs(), { size })
  return (
    <span style={{ width: a.size, height: a.size, borderRadius: a.radius, backgroundColor: a.backgroundColor, ...textStyle({ style: a.label, color: a.color }), display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...style }}>
      {children}
    </span>
  )
}

'use client'
// Adaptador Web — componentes fundamentais (Etapa 3). Cada um consome a recipe do DS e aplica o VisualSpec.
// Nenhuma decisão de design aqui (ADR-011): variantes/tamanhos/estados/cores vêm da recipe.
import { forwardRef, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react'
import * as ds from '@sintera/design-system'
import { cn } from '@/lib/utils'
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

// Button — ver ./button.tsx (componente de CLASSE; estados de cascata na camada Web).

// Card — CONTAINER estático. Identidade (superfície/borda/raio/sombra/padding) vem da recipe do DS; a TELA pode
// acrescentar layout via `className`/props HTML (grid, alinhamento, overflow, onClick, aria) e usar `padding="none"`
// quando controla o próprio espaçamento. `ref` encaminhado (scroll-to). Substitui o Card DS-001 (`.card-premium`).
//
// Renderizado por CLASSE (`.ds-card`, gerada dos tokens em @layer components) — não inline —, para que
// utilitárias de override (bg-*/border-*) da tela vençam e o hover/tint/contorno sejam idênticos ao antigo
// `.card-premium` (zero-drift). O `padding` é a escala de INTENÇÃO do DS (o shim de compat do DS-001 foi removido
// ao fim da migração; call sites com espaçamento fora da escala usam `padding="none"` + classe própria).
const PAD_CLASS: Record<string, string> = {
  none: '', cozy: 'p-3', default: 'p-4', relaxed: 'p-5',
}
export type CardPadding = keyof typeof PAD_CLASS
export type CardProps = { padding?: CardPadding }
  & WithStyle & Omit<HTMLAttributes<HTMLDivElement>, 'style' | 'children'>

/** Classe do cartão DS-002 (`.ds-card` + padding) — para componentes que precisam da CLASSE, não do <div>
 *  (MotionCard animado, ActionCard clicável). Substitui o cardClassName do DS-001 (`.card-premium`). */
export function cardClassName(padding: CardPadding = 'default', className?: string): string {
  return cn('ds-card', PAD_CLASS[padding], className)
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { padding = 'default', className, children, style, ...rest }, ref,
) {
  return (
    <div ref={ref} className={cn('ds-card', PAD_CLASS[padding], className)} style={style} {...rest}>
      {children}
    </div>
  )
})

export function Surface({ tone = 'base', children, style }:
  { tone?: 'base' | 'app' | 'accent' } & WithStyle) {
  const t = useDs()
  const s = ds.surface(t, { tone })
  return <div style={{ backgroundColor: s.backgroundColor, borderRadius: s.radius, boxShadow: shadowCss(t.elevation[s.elevation]), ...style }}>{children}</div>
}

export function Badge({ tone = 'info', children, style }:
  { tone?: ds.BadgeTone } & WithStyle) {
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

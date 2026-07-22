// @sintera/design-system — RECIPES dos componentes fundamentais (Passo 3B · Etapa 3).
// Funções puras headless (ADR-011): recipe(theme, props) → VisualSpec, 100% derivado dos papéis do tema.
// Sem react-dom / react-native / hex cru. Adaptadores de plataforma mapeiam o VisualSpec para estilo.
import type { SinteraTheme } from '../theme'
import type { ElevationLevel } from '../tokens/elevation'
import type { GradientToken } from '../tokens/gradient'
import type {
  ButtonSpec, ChipSpec, BadgeSpec, CardSpec, SurfaceSpec, DividerSpec, IconSpec, AvatarSpec, TextSpec,
} from './spec'

export type Size = 'sm' | 'md' | 'lg'
export type ButtonVariant = 'primary' | 'secondary' | 'ghost'
export type InteractiveState = 'default' | 'hover' | 'pressed' | 'disabled'
export type SemanticTone = 'info' | 'success' | 'attention' | 'error'
export type BadgeTone = SemanticTone | 'neutral' // 'neutral' = estado sem carga semântica (ex.: "Desconectado")

const TRANSPARENT = 'transparent'
const MIN_TOUCH = 44 // alvo mínimo de toque (acessibilidade) para controles md+

// --- Ação -------------------------------------------------------------------
export function button(t: SinteraTheme, opts: { variant?: ButtonVariant; size?: Size; state?: InteractiveState } = {}): ButtonSpec {
  const variant = opts.variant ?? 'primary'
  const state = opts.state ?? 'default'
  const dims = {
    sm: { px: t.padding.cozy, py: t.padding.tight, minH: 36, text: t.typography.label },
    md: { px: t.padding.relaxed, py: t.padding.cozy, minH: MIN_TOUCH, text: t.typography.bodyStrong },
    lg: { px: t.padding.relaxed, py: t.padding.default, minH: 52, text: t.typography.bodyStrong },
  }[opts.size ?? 'md']
  const active = state === 'hover' || state === 'pressed'
  let backgroundColor: string, color: string, borderColor: string = TRANSPARENT, borderWidth = 0
  // Primário = gradiente de AÇÃO (identidade validada na Web); a cor sólida abaixo é fallback (RN sem gradiente/estados).
  let backgroundGradient: GradientToken | undefined
  if (variant === 'primary') {
    backgroundColor = active ? t.color.button.primary.hover : t.color.button.primary.background
    color = t.color.button.primary.text
    backgroundGradient = 'action'
  } else if (variant === 'secondary') {
    backgroundColor = t.color.surface.accent
    color = t.color.text.onAccent
    borderColor = t.color.border.default
    borderWidth = t.border.hairline
  } else {
    backgroundColor = TRANSPARENT
    color = t.color.text.link
  }
  return {
    container: { backgroundColor, backgroundGradient, borderColor, borderWidth, radius: t.radius.control, paddingX: dims.px, paddingY: dims.py, minHeight: dims.minH, opacity: state === 'disabled' ? t.opacity.disabled : 1, elevation: 'none' },
    label: { style: dims.text, color },
  }
}

// --- Texto / títulos --------------------------------------------------------
export type TextRole = 'body' | 'bodyStrong' | 'bodySmall' | 'label' | 'caption'
export type TextTone = 'default' | 'muted' | 'faint' | 'link'
export function text(t: SinteraTheme, opts: { role?: TextRole; tone?: TextTone } = {}): TextSpec {
  const color = { default: t.color.text.default, muted: t.color.text.muted, faint: t.color.text.faint, link: t.color.text.link }[opts.tone ?? 'default']
  return { style: t.typography[opts.role ?? 'body'], color }
}

export type HeadingLevel = 'display' | 'page' | 'section' | 'card'
export function heading(t: SinteraTheme, opts: { level?: HeadingLevel } = {}): TextSpec {
  const style = { display: t.typography.display, page: t.typography.pageTitle, section: t.typography.sectionTitle, card: t.typography.cardTitle }[opts.level ?? 'section']
  return { style, color: t.color.text.default }
}

// --- Superfícies ------------------------------------------------------------
export function card(t: SinteraTheme, opts: { elevation?: ElevationLevel; padding?: 'none' | 'cozy' | 'default' | 'relaxed' } = {}): CardSpec {
  // 'none' = a TELA controla o padding (via layout próprio) — necessário na migração de cards densos/estruturais.
  const pad = { none: 0, cozy: t.padding.cozy, default: t.padding.default, relaxed: t.padding.relaxed }[opts.padding ?? 'default']
  return { container: { backgroundColor: t.color.surface.base, borderColor: t.color.border.default, borderWidth: t.border.hairline, radius: t.radius.card, paddingX: pad, paddingY: pad, opacity: 1, elevation: opts.elevation ?? 'raised', shadowRole: 'card' } }
}

export function surface(t: SinteraTheme, opts: { tone?: 'base' | 'app' | 'accent' } = {}): SurfaceSpec {
  const backgroundColor = { base: t.color.surface.base, app: t.color.surface.app, accent: t.color.surface.accent }[opts.tone ?? 'base']
  return { backgroundColor, radius: t.radius.card, elevation: 'none' }
}

// --- Dados / status ---------------------------------------------------------
export function badge(t: SinteraTheme, opts: { tone?: BadgeTone } = {}): BadgeSpec {
  const fam = t.color.badge[opts.tone ?? 'info']
  return {
    container: { backgroundColor: fam.soft, borderColor: TRANSPARENT, borderWidth: 0, radius: t.radius.pill, paddingX: t.padding.tight, paddingY: t.padding.micro, opacity: 1, elevation: 'none' },
    label: { style: t.typography.label, color: fam.text },
  }
}

export function chip(t: SinteraTheme, opts: { selected?: boolean } = {}): ChipSpec {
  const selected = opts.selected ?? false
  return {
    container: { backgroundColor: selected ? t.color.surface.accent : t.color.surface.base, borderColor: selected ? TRANSPARENT : t.color.border.default, borderWidth: selected ? 0 : t.border.hairline, radius: t.radius.pill, paddingX: t.padding.cozy, paddingY: t.padding.micro, opacity: 1, elevation: 'none' },
    label: { style: t.typography.label, color: selected ? t.color.text.onAccent : t.color.text.muted },
  }
}

export function divider(t: SinteraTheme): DividerSpec {
  return { color: t.color.border.default, thickness: t.border.hairline }
}

// --- Mídia / símbolos -------------------------------------------------------
export function icon(t: SinteraTheme, opts: { size?: Size; tone?: 'default' | 'muted' | 'identity' | 'onAction' } = {}): IconSpec {
  const size = { sm: 16, md: 20, lg: 24 }[opts.size ?? 'md']
  const color = { default: t.color.text.default, muted: t.color.text.muted, identity: t.color.identity.primary, onAction: t.color.text.onAction }[opts.tone ?? 'default']
  return { size, color }
}

export function avatar(t: SinteraTheme, opts: { size?: Size } = {}): AvatarSpec {
  const size = { sm: 28, md: 40, lg: 56 }[opts.size ?? 'md']
  return { size, radius: t.radius.pill, backgroundColor: t.color.identity.soft, color: t.color.identity.primary, label: t.typography.label }
}

export * from './spec'

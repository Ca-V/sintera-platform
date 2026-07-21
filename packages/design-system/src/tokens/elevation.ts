// @sintera/design-system — TOKENS DE SUPERFÍCIE E ELEVAÇÃO (Passo 3B · Etapa 1 · Subitem 4)
// Raios, bordas, opacidade e sombras. Filosofia: BASE (primitivos) × PAPÉIS (roles).
// Orientado a dados: elevação SUTIL — a profundidade organiza, não decora. Sombras discretas.
// Consistência Web/Mobile: a sombra é descrita de forma NEUTRA (y/blur/spread/color/opacity + androidElevation);
// os adaptadores de plataforma traduzem para box-shadow (web) e shadow*/elevation (RN).
import type { Theme } from './color'

// ---------------------------------------------------------------------------
// Camada 1 — PRIMITIVOS (não consumir direto).
// ---------------------------------------------------------------------------
export const radiusScale = { none: 0, xs: 4, sm: 8, md: 12, lg: 16, xl: 20, pill: 999 } as const
export const borderWidthScale = { none: 0, hairline: 1, thick: 2 } as const
export const opacityScale = { transparent: 0, subtle: 0.06, soft: 0.12, muted: 0.4, disabled: 0.45, scrim: 0.55, opaque: 1 } as const

// ---------------------------------------------------------------------------
// Camada 2 — PAPÉIS (roles) por intenção.
// ---------------------------------------------------------------------------
export const radius = {
  control: radiusScale.sm,  // botões, campos, chips
  card: radiusScale.md,     // cartões/superfícies
  sheet: radiusScale.lg,    // folhas/modais
  pill: radiusScale.pill,   // badges/toggles arredondados
} as const

export const border = {
  hairline: borderWidthScale.hairline, // divisores e contornos padrão
  strong: borderWidthScale.thick,      // ênfase (foco/seleção)
} as const

export const opacity = {
  disabled: opacityScale.disabled,   // elementos desabilitados
  muted: opacityScale.muted,         // conteúdo secundário/esmaecido
  pressOverlay: opacityScale.subtle, // realce de pressed
  scrim: opacityScale.scrim,         // fundo de modal/sheet
} as const

// Sombra neutra de plataforma.
export interface Shadow {
  y: number; blur: number; spread: number; color: string; opacity: number; androidElevation: number
}
export type ElevationLevel = 'none' | 'raised' | 'overlay' | 'sheet'

export const elevation: Record<Theme, Record<ElevationLevel, Shadow>> = {
  light: {
    none:    { y: 0, blur: 0,  spread: 0, color: '#241F1A', opacity: 0,    androidElevation: 0 },
    raised:  { y: 1, blur: 2,  spread: 0, color: '#241F1A', opacity: 0.08, androidElevation: 1 },  // cartões
    overlay: { y: 4, blur: 12, spread: 0, color: '#241F1A', opacity: 0.12, androidElevation: 6 },  // dropdowns/popovers
    sheet:   { y: 8, blur: 28, spread: 0, color: '#241F1A', opacity: 0.16, androidElevation: 12 }, // modais/sheets
  },
  dark: {
    none:    { y: 0,  blur: 0,  spread: 0, color: '#000000', opacity: 0,   androidElevation: 0 },
    raised:  { y: 1,  blur: 2,  spread: 0, color: '#000000', opacity: 0.4, androidElevation: 1 },
    overlay: { y: 4,  blur: 14, spread: 0, color: '#000000', opacity: 0.5, androidElevation: 6 },
    sheet:   { y: 10, blur: 32, spread: 0, color: '#000000', opacity: 0.6, androidElevation: 12 },
  },
}

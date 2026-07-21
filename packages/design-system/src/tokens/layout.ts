// @sintera/design-system — TOKENS DE LAYOUT (Passo 3B · Etapa 1 · Subitem 6)
// Breakpoints, grid e camadas (z-index). Mobile-first (ADR-002). Papéis por intenção.
import { space } from './spacing'

// ---------------------------------------------------------------------------
// Breakpoints — min-widths (mobile-first). O mobile é o produto principal; a web adiciona faixas maiores.
// ---------------------------------------------------------------------------
export const breakpoint = { sm: 640, md: 960, lg: 1280 } as const
export type BreakpointName = keyof typeof breakpoint

// ---------------------------------------------------------------------------
// Grid / contêiner de conteúdo.
// ---------------------------------------------------------------------------
export const grid = {
  columns: 12,
  gutter: space.lg,          // 16 — calha entre colunas (papel de espaçamento)
  maxContentWidth: 1120,     // largura máxima do conteúdo em telas largas
} as const

// ---------------------------------------------------------------------------
// Camadas de empilhamento (z-index) por INTENÇÃO — evita números mágicos nos componentes.
// ---------------------------------------------------------------------------
export const zIndex = {
  base: 0, raised: 10, sticky: 100, overlay: 1000, modal: 1100, toast: 1200,
} as const

// @sintera/design-system — TOKENS TIPOGRÁFICOS (Passo 3B · Etapa 1 — Design Tokens · Subitem 2)
// SSOT tipográfica, compartilhada Web + Mobile. Mesma filosofia da cor: BASE (primitivos) × PAPÉIS (roles).
// Componentes consomem apenas os PAPÉIS (`typeRole`), nunca tamanhos/pesos soltos.
//
// Tipografia oficial (ver docs/BRAND-002 v2.0, Baseline): título Fraunces + corpo/interface/dados Hanken Grotesk.
// Filosofia (DS-002): orientado a dados — legibilidade e conforto de leitura prolongada antes de personalidade;
// a tipografia deve DESAPARECER durante a leitura. Números tabulares nas colunas de valores.
// Acessibilidade estrutural: suporte a Dynamic Type (escala relativa) desde o token.

// ---------------------------------------------------------------------------
// Camada 1 — PRIMITIVOS (não consumir direto em componentes).
// ---------------------------------------------------------------------------
export const fontFamily = {
  display: "'Fraunces', Georgia, 'Times New Roman', serif",       // títulos
  text: "'Hanken Grotesk', system-ui, -apple-system, sans-serif", // corpo · interface · dados
} as const

export const fontWeight = { regular: 400, medium: 500, semibold: 600, bold: 700 } as const

// Escala de tamanho em pt/px LÓGICOS (base). O Dynamic Type multiplica por um fator do usuário.
export const fontSize = {
  xs: 12, sm: 13, base: 15, md: 17, lg: 20, xl: 24, xxl: 30, xxxl: 38, display: 48,
} as const

export const lineHeight = { tight: 1.06, snug: 1.2, normal: 1.5, relaxed: 1.62 } as const

export const letterSpacing = {
  tighter: '-0.02em', tight: '-0.012em', normal: '0em', wide: '0.02em', wider: '0.16em',
} as const

// Recurso OpenType para algarismos tabulares (colunas de valores alinhadas).
export const fontFeature = { tabularNumbers: "'tnum' 1, 'lnum' 1" } as const

// ---------------------------------------------------------------------------
// Camada 2 — PAPÉIS (roles): a ÚNICA camada consumida pelos componentes.
//   display · heading{1,2,3} · body · bodyStrong · label · caption · overline · numeric
// ---------------------------------------------------------------------------
export interface TextStyle {
  fontFamily: string
  fontSize: number
  fontWeight: number
  lineHeight: number
  letterSpacing: string
  textTransform?: 'none' | 'uppercase'
  fontFeatureSettings?: string
}

export type TypeRoleName =
  | 'display' | 'heading1' | 'heading2' | 'heading3'
  | 'body' | 'bodyStrong' | 'label' | 'caption' | 'overline' | 'numeric'

export const typeRole: Record<TypeRoleName, TextStyle> = {
  display:    { fontFamily: fontFamily.display, fontSize: fontSize.display, fontWeight: fontWeight.semibold, lineHeight: lineHeight.tight, letterSpacing: letterSpacing.tighter },
  heading1:   { fontFamily: fontFamily.display, fontSize: fontSize.xxl,     fontWeight: fontWeight.semibold, lineHeight: lineHeight.snug,  letterSpacing: letterSpacing.tight },
  heading2:   { fontFamily: fontFamily.display, fontSize: fontSize.xl,      fontWeight: fontWeight.semibold, lineHeight: lineHeight.snug,  letterSpacing: letterSpacing.tight },
  heading3:   { fontFamily: fontFamily.display, fontSize: fontSize.lg,      fontWeight: fontWeight.semibold, lineHeight: lineHeight.snug,  letterSpacing: letterSpacing.normal },
  body:       { fontFamily: fontFamily.text,    fontSize: fontSize.base,    fontWeight: fontWeight.regular,  lineHeight: lineHeight.relaxed, letterSpacing: letterSpacing.normal },
  bodyStrong: { fontFamily: fontFamily.text,    fontSize: fontSize.base,    fontWeight: fontWeight.semibold, lineHeight: lineHeight.relaxed, letterSpacing: letterSpacing.normal },
  label:      { fontFamily: fontFamily.text,    fontSize: fontSize.sm,      fontWeight: fontWeight.semibold, lineHeight: lineHeight.snug,  letterSpacing: letterSpacing.wide },
  caption:    { fontFamily: fontFamily.text,    fontSize: fontSize.xs,      fontWeight: fontWeight.regular,  lineHeight: lineHeight.snug,  letterSpacing: letterSpacing.normal },
  overline:   { fontFamily: fontFamily.text,    fontSize: fontSize.xs,      fontWeight: fontWeight.bold,     lineHeight: lineHeight.snug,  letterSpacing: letterSpacing.wider, textTransform: 'uppercase' },
  // Dados numéricos (tabelas de exames, valores, indicadores) — SEMPRE com algarismos tabulares.
  numeric:    { fontFamily: fontFamily.text,    fontSize: fontSize.base,    fontWeight: fontWeight.regular,  lineHeight: lineHeight.normal, letterSpacing: letterSpacing.normal, fontFeatureSettings: fontFeature.tabularNumbers },
}

// ---------------------------------------------------------------------------
// Dynamic Type — acessibilidade estrutural. O usuário pode ampliar o texto;
// os componentes aplicam um fator (do SO/preferência) sobre o tamanho lógico.
// Limites evitam quebra de layout mantendo respeito à preferência do usuário.
// ---------------------------------------------------------------------------
export const dynamicType = { min: 0.85, max: 1.6 } as const

/** Aplica o fator de Dynamic Type a um TextStyle, com clamp de segurança. */
export function scaleTextStyle(style: TextStyle, factor: number): TextStyle {
  const f = Math.min(dynamicType.max, Math.max(dynamicType.min, factor))
  return { ...style, fontSize: Math.round(style.fontSize * f * 100) / 100 }
}

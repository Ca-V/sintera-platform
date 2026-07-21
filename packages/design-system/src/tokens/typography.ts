// @sintera/design-system — TOKENS TIPOGRÁFICOS (Passo 3B · Etapa 1 — Design Tokens · Subitem 2)
// SSOT tipográfica, compartilhada Web + Mobile. Filosofia: BASE (primitivos) × PAPÉIS (roles).
// Componentes consomem apenas os PAPÉIS por INTENÇÃO (`typeRole.sectionTitle`), nunca tamanhos/pesos soltos
// e nunca nomes ligados à implementação (heading1/2/3): se a escala mudar, o papel continua válido.
//
// Tipografia oficial (docs/BRAND-002 v2.1, Baseline) — TRÊS camadas por INTENÇÃO:
//   • Títulos ...................... Fraunces (serifa editorial — confiança, cuidado, elegância)
//   • Interface / leitura .......... Hanken Grotesk (corpo, formulários, navegação)
//   • Dados científicos ............ IBM Plex Mono (valores lab., índices, %, biomarcadores, IDs,
//                                    protocolos, hashes, códigos) — NUNCA em texto corrido.
// A "ciência" não vem da fonte, e sim do RIGOR visual: alinhamento, colunas tabulares, hierarquia,
// ausência de ruído. O mono entra só onde há DADO, dando precisão e alinhamento de colunas.
// Filosofia (DS-002): orientado a dados; a hierarquia nasce de TIPOGRAFIA + ESPAÇO, e só secundariamente de cor.
// Números tabulares + lining (tnum/lnum) nas colunas de valores. Acessibilidade: Dynamic Type desde o token.

// ---------------------------------------------------------------------------
// Camada 1 — PRIMITIVOS (não consumir direto em componentes).
// ---------------------------------------------------------------------------
export const fontFamily = {
  display: "'Fraunces', Georgia, 'Times New Roman', serif",             // títulos
  text: "'Hanken Grotesk', system-ui, -apple-system, sans-serif",       // corpo · interface · leitura
  mono: "'IBM Plex Mono', ui-monospace, 'SFMono-Regular', Menlo, monospace", // DADOS científicos (valores/índices/IDs/códigos)
} as const

export const fontWeight = { regular: 400, medium: 500, semibold: 600, bold: 700 } as const

// Escala de tamanho em pt/px LÓGICOS (base). O Dynamic Type multiplica por um fator do usuário.
export const fontSize = {
  xs: 12, sm: 13, base: 15, md: 17, lg: 20, xl: 24, xxl: 30, xxxl: 38, display: 48,
} as const

export const lineHeight = { tight: 1.06, snug: 1.2, normal: 1.5, relaxed: 1.62, loose: 1.72 } as const

export const letterSpacing = {
  tighter: '-0.02em', tight: '-0.012em', normal: '0em', wide: '0.02em', wider: '0.16em',
} as const

// Recurso OpenType para algarismos tabulares (colunas de valores alinhadas).
export const fontFeature = { tabularNumbers: "'tnum' 1, 'lnum' 1" } as const

// Largura ideal de coluna (em `ch`) — impacta o conforto de leitura tanto quanto a fonte.
// Papéis de MEDIDA (measure): componentes consomem a intenção, não um px. 0 = sem limite.
export const measure = { reading: 68, form: 48, table: 0 } as const

// ---------------------------------------------------------------------------
// Camada 2 — PAPÉIS (roles): a ÚNICA camada consumida pelos componentes. Nomes por INTENÇÃO.
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
/** Estilo de leitura contínua: além do texto, define a largura máxima de coluna (measure). */
export interface ReadingStyle extends TextStyle { maxMeasureCh: number }

export interface TypeRoles {
  // Títulos (Fraunces) — por intenção, não por nível numérico.
  display: TextStyle
  pageTitle: TextStyle
  sectionTitle: TextStyle
  cardTitle: TextStyle
  // Corpo / interface (Hanken).
  body: TextStyle
  bodyStrong: TextStyle
  bodySmall: TextStyle
  label: TextStyle
  caption: TextStyle
  // Leitura prolongada (documentos, laudos, conteúdo científico) — line-height e coluna próprios.
  reading: ReadingStyle
  // Dados científicos — família MONO própria (IBM Plex Mono). SEMPRE tabular + lining.
  // Valores laboratoriais, índices, percentuais, biomarcadores, IDs, protocolos, hashes, códigos.
  numeric: { primary: TextStyle; secondary: TextStyle; reference: TextStyle; large: TextStyle }
}

const tnum = fontFeature.tabularNumbers

export const typeRole: TypeRoles = {
  display:     { fontFamily: fontFamily.display, fontSize: fontSize.display, fontWeight: fontWeight.semibold, lineHeight: lineHeight.tight,   letterSpacing: letterSpacing.tighter },
  pageTitle:   { fontFamily: fontFamily.display, fontSize: fontSize.xxl,     fontWeight: fontWeight.semibold, lineHeight: lineHeight.snug,    letterSpacing: letterSpacing.tight },
  sectionTitle:{ fontFamily: fontFamily.display, fontSize: fontSize.xl,      fontWeight: fontWeight.semibold, lineHeight: lineHeight.snug,    letterSpacing: letterSpacing.tight },
  cardTitle:   { fontFamily: fontFamily.display, fontSize: fontSize.lg,      fontWeight: fontWeight.semibold, lineHeight: lineHeight.snug,    letterSpacing: letterSpacing.normal },

  body:        { fontFamily: fontFamily.text, fontSize: fontSize.base, fontWeight: fontWeight.regular,  lineHeight: lineHeight.relaxed, letterSpacing: letterSpacing.normal },
  bodyStrong:  { fontFamily: fontFamily.text, fontSize: fontSize.base, fontWeight: fontWeight.semibold, lineHeight: lineHeight.relaxed, letterSpacing: letterSpacing.normal },
  bodySmall:   { fontFamily: fontFamily.text, fontSize: fontSize.sm,   fontWeight: fontWeight.regular,  lineHeight: lineHeight.normal,  letterSpacing: letterSpacing.normal },
  label:       { fontFamily: fontFamily.text, fontSize: fontSize.sm,   fontWeight: fontWeight.semibold, lineHeight: lineHeight.snug,    letterSpacing: letterSpacing.wide },
  caption:     { fontFamily: fontFamily.text, fontSize: fontSize.xs,   fontWeight: fontWeight.regular,  lineHeight: lineHeight.snug,    letterSpacing: letterSpacing.normal },

  reading:     { fontFamily: fontFamily.text, fontSize: fontSize.md, fontWeight: fontWeight.regular, lineHeight: lineHeight.loose, letterSpacing: letterSpacing.normal, maxMeasureCh: measure.reading },

  numeric: {
    primary:   { fontFamily: fontFamily.mono, fontSize: fontSize.base, fontWeight: fontWeight.medium,   lineHeight: lineHeight.normal, letterSpacing: letterSpacing.normal, fontFeatureSettings: tnum },
    secondary: { fontFamily: fontFamily.mono, fontSize: fontSize.sm,   fontWeight: fontWeight.regular,  lineHeight: lineHeight.normal, letterSpacing: letterSpacing.normal, fontFeatureSettings: tnum },
    reference: { fontFamily: fontFamily.mono, fontSize: fontSize.xs,   fontWeight: fontWeight.regular,  lineHeight: lineHeight.snug,   letterSpacing: letterSpacing.normal, fontFeatureSettings: tnum },
    large:     { fontFamily: fontFamily.mono, fontSize: fontSize.xxl,  fontWeight: fontWeight.medium,   lineHeight: lineHeight.tight,  letterSpacing: letterSpacing.tight,  fontFeatureSettings: tnum },
  },
}

// ---------------------------------------------------------------------------
// Dynamic Type — acessibilidade estrutural. O usuário amplia o texto; os componentes aplicam o fator.
// REGRA (fundadora): o Dynamic Type NUNCA deve quebrar tabelas, Timeline ou exames laboratoriais.
// Quando a ampliação integral comprometer a estrutura, o COMPONENTE adota estratégia de layout
// (reorganizar, quebrar linha, expandir) — nunca reduzir/ignorar a acessibilidade. Ver DS-002.
// ---------------------------------------------------------------------------
export const dynamicType = { min: 0.85, max: 1.6 } as const

/** Aplica o fator de Dynamic Type a um TextStyle, com clamp de segurança. */
export function scaleTextStyle<T extends TextStyle>(style: T, factor: number): T {
  const f = Math.min(dynamicType.max, Math.max(dynamicType.min, factor))
  return { ...style, fontSize: Math.round(style.fontSize * f * 100) / 100 }
}

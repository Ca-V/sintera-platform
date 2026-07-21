// @sintera/design-system — TOKENS DE ESPAÇAMENTO (Passo 3B · Etapa 1 — Design Tokens · Subitem 3)
// SSOT do ritmo visual, compartilhada Web + Mobile. Filosofia: BASE (primitivos) × PAPÉIS (roles).
// A escala NÃO é "múltiplos de 4/8" para consumo direto: representa RITMO. Componentes consomem INTENÇÃO
// (`spacing.section`, `density.compact`), nunca medidas (`space.24`).
//
// Princípio (DS-002): a hierarquia da SINTERA nasce de TIPOGRAFIA + ESPAÇO, e só secundariamente de cor.

// ---------------------------------------------------------------------------
// Camada 1 — PRIMITIVOS (px lógicos). Passos pensados para criar ritmo, não só grade técnica.
// NÃO consumir direto em componentes.
// ---------------------------------------------------------------------------
export const space = {
  none: 0, hair: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, xxxl: 40, x4: 56, x5: 80,
} as const

// ---------------------------------------------------------------------------
// Camada 2 — PAPÉIS (roles): a ÚNICA camada consumida pelos componentes.
// ---------------------------------------------------------------------------

// Espaçamento por INTENÇÃO (do menor ritmo ao maior).
export const spacing = {
  inline: space.sm,       // 8  — entre itens na mesma linha (ícone+texto, chips)
  stack: space.md,        // 12 — entre elementos empilhados dentro de um bloco
  group: space.lg,        // 16 — agrupamento de informações relacionadas
  section: space.xxl,     // 28 — separação entre seções
  page: space.xl,         // 20 — margem/respiro da página (mobile)
} as const

// Espaçamento INTERNO (padding) por intenção — usado por superfícies/cartões/controles.
export const padding = {
  micro: space.xs,        // 4  — badges/pílulas (vertical)
  tight: space.sm,        // 8
  cozy: space.md,         // 12
  default: space.lg,      // 16
  relaxed: space.xl,      // 20
} as const

// DENSIDADE — para componentes ricos em dados (tabelas de exames, Timeline). O componente escolhe
// a densidade; cada nível define o ritmo vertical de linha e o gap. Ordem: compact < default < comfortable.
export interface DensityLevel { rowY: number; gap: number }
export const density: Record<'compact' | 'default' | 'comfortable', DensityLevel> = {
  compact:     { rowY: space.xs, gap: space.xs },   // Timeline cheia / tabelas densas
  default:     { rowY: space.sm, gap: space.sm },
  comfortable: { rowY: space.md, gap: space.md },
}

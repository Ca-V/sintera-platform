// @sintera/design-system — Tokens e componentes/logica de UI compartilhaveis (RN e web compartilham tokens+logica).
// Fronteira de responsabilidade: ver docs/HIP-012 §4 e docs/adr/ADR-007. NÃO exceder este escopo.

// Passo 3B · Etapa 1 — Design Tokens (SSOT): cor · tipografia · espaçamento · superfície/elevação · motion · layout.
export * from './tokens/color'
export * from './tokens/typography'
export * from './tokens/spacing'
export * from './tokens/elevation'
export * from './tokens/motion'
export * from './tokens/layout'
// Montagem semântica de alto nível (o que os componentes/tema consomem).
export * from './theme'
// Etapa 2 — composição (helpers) · Etapa 3 — recipes dos componentes fundamentais (ADR-011).
export * from './composition'
export * from './recipes'

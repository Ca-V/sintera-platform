// @sintera/design-system — RECIPES (barrel). ADR-011: recipes headless = fonte da verdade dos componentes.
//  base       — componentes fundamentais (Etapa 3)
//  domain     — componentes de produto/domínio (Etapa 4)
//  templates  — composição de páginas (Etapa 5)
export * from './base'      // já re-exporta ./spec
export * from './domain'
export * from './templates'

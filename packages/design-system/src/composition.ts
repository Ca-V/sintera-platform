// @sintera/design-system — COMPOSIÇÃO (Passo 3B · Etapa 2 — Princípios de composição, parte executável)
// Os PRINCÍPIOS estão em docs/DS-002 §Princípios de composição; aqui ficam os poucos helpers que os
// componentes usam para materializá-los. Hierarquia nasce de tipografia + espaço (cor secundária).
import { space } from './tokens/spacing'
import { grid } from './tokens/layout'

/** Unidade de ritmo vertical (baseline). Espaçamentos verticais devem ser múltiplos disto. */
export const rhythmBase = space.xs // 4px

/** Ritmo vertical em múltiplos da baseline (mantém a página "no compasso"). */
export function verticalRhythm(steps: number): number {
  return Math.max(0, Math.round(steps)) * rhythmBase
}

/** Largura máxima do conteúdo (contêiner) em telas largas. */
export const contentMaxWidth = grid.maxContentWidth

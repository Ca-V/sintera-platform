// ============================================================
// IndicatorView — contrato das 5 PERGUNTAS (sem domínio/Estado 2)
// ============================================================
// Todo indicador (HbA1c, LDL, vitamina D, ferritina, pressão, peso, VO2…)
// responde SEMPRE às mesmas 5 perguntas, na mesma ordem:
//   1. Situação atual   → IndicatorSummaryCard
//   2. O que mudou?     → IndicatorChangeCard
//   3. Evolução         → IndicatorEvolutionCard
//   4. O que influenciou? → RelatedItems
//   5. O que acontece depois? → texto (NextFollowUp — ainda sem componente próprio)
// Factual, sem juízo clínico (RDC 657): nunca "bom/ruim/excelente".
// ============================================================

import type { BadgeVariant } from './item'

export type ReferenceStatus = 'within' | 'outside' | 'unknown'

export const REFERENCE_STATUS: Record<ReferenceStatus, { label: string; badge: BadgeVariant }> = {
  within:  { label: 'dentro da faixa do laboratório', badge: 'sage' },
  outside: { label: 'fora da faixa do laboratório',  badge: 'gold' }, // atenção, NÃO alarme
  unknown: { label: 'faixa não informada',           badge: 'neutral' },
}

export const EVOLUTION_WINDOWS = [
  { id: '6m', label: '6 meses', points: 6 },
  { id: '1a', label: '1 ano', points: 12 },
  { id: 'all', label: 'todo histórico', points: Infinity },
] as const

export type EvolutionWindow = (typeof EVOLUTION_WINDOWS)[number]['id']

/** Recorta a série pela janela (mais recentes). Puro. */
export function windowPoints<T>(series: T[], window: EvolutionWindow): T[] {
  const def = EVOLUTION_WINDOWS.find((w) => w.id === window)
  if (!def || def.points === Infinity) return series
  return series.slice(Math.max(0, series.length - def.points))
}

// BOD-001 área ② — Evolução Longitudinal. Helpers PUROS: filtro de período + marcador por origem.
//
// Rastreabilidade (governança): cada ponto carrega origem e (quando houver) o exame de onde veio. O gráfico
// responde "como evoluiu?"; a tabela e o clique no ponto respondem "de onde veio cada ponto?". Sem interpretação
// clínica (RDC 657) — só organiza os valores medidos no tempo.

export interface EvoPoint {
  key: string            // id do ponto (para seleção/clique)
  date: string           // ISO yyyy-mm-dd
  value: number
  source: string | null
  examId: string | null  // quando o ponto veio de um exame/laudo (abrir original)
}

export interface EvoPeriod { key: string; label: string; days: number | null }

export const EVOLUTION_PERIODS: EvoPeriod[] = [
  { key: '30d', label: '30 dias', days: 30 },
  { key: '90d', label: '90 dias', days: 90 },
  { key: '6m', label: '6 meses', days: 182 },
  { key: '1a', label: '1 ano', days: 365 },
  { key: 'all', label: 'Tudo', days: null },
]

/** Marcador visual por ORIGEM (o usuário percebe mudança de fonte). Origem desconhecida → círculo genérico. */
export type MarkerShape = 'circle' | 'square' | 'triangle' | 'diamond'
export const SOURCE_MARKER: Record<string, MarkerShape> = {
  bioimpedancia: 'circle',
  dexa: 'triangle',
  manual: 'square',
  balanca: 'diamond',
  wearable: 'circle',
}
export function markerFor(source: string | null | undefined): MarkerShape {
  return (source && SOURCE_MARKER[source]) || 'circle'
}

/**
 * Filtra pontos pelo período (janela até `nowISO`). `days=null` → todo o histórico. Puro/determinístico.
 * Mantém a ordem recebida; a ordenação por data é responsabilidade do chamador.
 */
export function filterByPeriod<T extends { date: string }>(points: T[], days: number | null, nowISO: string): T[] {
  if (days == null) return points
  const now = new Date(`${nowISO}T00:00:00Z`).getTime()
  const cutoff = now - days * 24 * 60 * 60 * 1000
  return points.filter(p => {
    const t = new Date(`${p.date}T00:00:00Z`).getTime()
    return Number.isFinite(t) && t >= cutoff
  })
}

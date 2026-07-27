// @sintera/core — domínio Timeline: projeção cronológica PURA de itens datados (eventos, exames, observações…).
// Opera sobre a abstração `{ date }` — NÃO conhece o tipo concreto (cada domínio mapeia o seu fato para cá).
// Sem React/Supabase/RN. DATE-001-safe: usa a string ISO 'YYYY-MM-DD' por fatiamento (sem Date/timezone).

export type Period = 'day' | 'month' | 'year'

/** Chave de período de uma data ISO ('2026-07-01'): year='2026' · month='2026-07' · day='2026-07-01'. */
export function periodKey(isoDate: string, period: Period): string {
  const [y = '', m = ''] = isoDate.split('-')
  if (period === 'year') return y
  if (period === 'month') return m ? `${y}-${m}` : y
  return isoDate
}

/** Ordena itens datados por data (padrão: mais recentes primeiro). Itens sem data vão para o fim (sort estável). */
export function sortByDate<T extends { date: string | null }>(
  items: readonly T[],
  dir: 'asc' | 'desc' = 'desc',
): T[] {
  return [...items].sort((a, b) => {
    if (a.date === b.date) return 0
    if (a.date === null) return 1   // nulos por último
    if (b.date === null) return -1
    const cmp = a.date < b.date ? -1 : 1 // ascendente
    return dir === 'desc' ? -cmp : cmp
  })
}

export interface TimelineGroup<T> {
  readonly key: string
  readonly items: T[]
}

/** Agrupa itens por período, já em ordem cronológica (desc por padrão). Sem data → grupo 'sem-data' (ao fim). */
export function groupByPeriod<T extends { date: string | null }>(
  items: readonly T[],
  period: Period,
  dir: 'asc' | 'desc' = 'desc',
): TimelineGroup<T>[] {
  const sorted = sortByDate(items, dir)
  const groups: TimelineGroup<T>[] = []
  const index = new Map<string, TimelineGroup<T>>()
  for (const item of sorted) {
    const key = item.date === null ? 'sem-data' : periodKey(item.date, period)
    let g = index.get(key)
    if (!g) {
      g = { key, items: [] }
      index.set(key, g)
      groups.push(g)
    }
    g.items.push(item)
  }
  return groups
}

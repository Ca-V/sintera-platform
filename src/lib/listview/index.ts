// ============================================================
// Infraestrutura de Apresentação de Listas — SINTERA (capacidade transversal)
// ============================================================
// Mecanismo ÚNICO de ORDENAÇÃO, AGRUPAMENTO, FILTROS e (junto do SelectionToolbar)
// SELEÇÃO — reutilizável por Agenda, Histórico, Exames, Recursos, Medicamentos,
// Despesas e futuras páginas. Cada módulo apenas DECLARA sua configuração; a
// mecânica é comum. NÃO implementar ordenação/filtro por módulo — todos consomem
// esta camada (parte da Camada de Comunicação — ver REL-001 §0.0).
// ============================================================

/** Um critério de ordenação declarado por um módulo. */
export interface SortSpec<T> {
  key: string
  label: string
  compare: (a: T, b: T) => number
}

/** Um agrupamento declarado por um módulo (ex.: por data, por laboratório, por tipo). */
export interface GroupSpec<T> {
  key: string
  label: string
  /** Rótulo do grupo ao qual o item pertence. */
  groupOf: (item: T) => string
}

/** Um filtro declarado por um módulo. `value` vem da UI (texto/opção). */
export interface FilterSpec<T> {
  key: string
  label: string
  predicate: (item: T, value: string) => boolean
}

/** Configuração de apresentação que um módulo declara uma única vez. */
export interface ListViewConfig<T> {
  sorts: SortSpec<T>[]
  defaultSort?: string
  groups?: GroupSpec<T>[]
  defaultGroup?: string
  filters?: FilterSpec<T>[]
}

export interface ListGroup<T> { key: string; label: string; items: T[] }

/** Aplica a ordenação escolhida (ou a primeira declarada). Não muta o array original. */
export function applySort<T>(items: T[], sorts: SortSpec<T>[], key?: string): T[] {
  const spec = sorts.find(s => s.key === key) ?? sorts[0]
  return spec ? [...items].sort(spec.compare) : [...items]
}

/**
 * Aplica um agrupamento, preservando a ordem de aparição dos grupos.
 * Sem agrupamento → um único grupo sem rótulo.
 */
export function applyGroup<T>(items: T[], group?: GroupSpec<T> | null): ListGroup<T>[] {
  if (!group) return [{ key: '', label: '', items: [...items] }]
  const map = new Map<string, T[]>()
  for (const it of items) {
    const label = group.groupOf(it)
    const bucket = map.get(label)
    if (bucket) bucket.push(it)
    else map.set(label, [it])
  }
  return [...map.entries()].map(([label, groupItems]) => ({ key: label, label, items: groupItems }))
}

/** Aplica todos os filtros ativos (AND). `values` mapeia filterKey → valor da UI. */
export function applyFilters<T>(items: T[], filters: FilterSpec<T>[] | undefined, values: Record<string, string>): T[] {
  if (!filters?.length) return items
  return items.filter(it =>
    filters.every(f => {
      const v = values[f.key]
      return v == null || v === '' ? true : f.predicate(it, v)
    }),
  )
}

/** Pipeline completo: filtra → ordena → agrupa. */
export function presentList<T>(
  items: T[],
  config: ListViewConfig<T>,
  state: { sort?: string; group?: string; filters?: Record<string, string> },
): ListGroup<T>[] {
  const filtered = applyFilters(items, config.filters, state.filters ?? {})
  const sorted = applySort(filtered, config.sorts, state.sort ?? config.defaultSort)
  const group = (config.groups ?? []).find(g => g.key === (state.group ?? config.defaultGroup)) ?? null
  return applyGroup(sorted, group)
}

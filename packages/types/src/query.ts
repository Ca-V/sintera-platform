// @sintera/types — contratos de CONSULTA reutilizados por api-client e core: ordenação, paginação, intervalo,
// filtro. Só tipos, sem lógica. Datas em ISO 'YYYY-MM-DD' (DATE-001).

export type SortDir = 'asc' | 'desc'

export interface Sort<K extends string = string> {
  readonly field: K
  readonly dir: SortDir
}

/** Requisição de página (paginação por offset). */
export interface PageRequest {
  readonly limit?: number
  readonly offset?: number
}

/** Resposta paginada genérica. */
export interface PageResponse<T> {
  readonly items: readonly T[]
  readonly total?: number
  readonly limit?: number
  readonly offset?: number
}

/** Intervalo de datas (ISO 'YYYY-MM-DD'); ambos opcionais. */
export interface DateRange {
  readonly from?: string
  readonly to?: string
}

/** Filtro genérico por subconjunto dos campos de T. */
export type Filter<T> = Partial<T>

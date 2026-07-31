// @sintera/types — contratos de CONSULTA reutilizados (hoje pelo api-client Exames). Só tipos, sem lógica.
// Datas em ISO 'YYYY-MM-DD' (DATE-001).

/** Requisição de página (paginação por offset). */
export interface PageRequest {
  readonly limit?: number
  readonly offset?: number
}

/** Intervalo de datas (ISO 'YYYY-MM-DD'); ambos opcionais. */
export interface DateRange {
  readonly from?: string
  readonly to?: string
}

// ============================================================
// Estimativa de término e recompra — catálogo de Medicamentos
// ============================================================
// Funções PURAS (testáveis). O total de unidades disponíveis considera TODAS as
// embalagens adquiridas: packQty (unidades por embalagem) × acquiredQty (nº de
// embalagens compradas, default 1). Antes o cálculo usava só uma embalagem —
// p.ex. 2 caixas de 30 a 2/dia davam 15 dias em vez de 30 (BUG/REV-01).
// ============================================================

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Total de unidades adquiridas = unidades/embalagem × nº de embalagens (default 1). */
export function totalUnits(packQty: number | null, acquiredQty: number | null = null): number | null {
  if (!packQty || packQty <= 0) return null
  const packs = acquiredQty && acquiredQty > 0 ? acquiredQty : 1
  return packQty * packs
}

/** Data estimada de término: total de unidades ÷ consumo/dia, a partir da compra. */
export function runoutDate(
  purchasedOn: string | null,
  packQty: number | null,
  dailyCons: number | null,
  acquiredQty: number | null = null,
): string | null {
  const total = totalUnits(packQty, acquiredQty)
  if (!purchasedOn || !total || !dailyCons || dailyCons <= 0) return null
  const days = Math.floor(total / dailyCons)
  const d = new Date(`${purchasedOn}T00:00:00`)
  d.setDate(d.getDate() + days)
  return ymd(d)
}

/** Data sugerida de recompra: ~5 dias antes de acabar (nunca no passado). */
export function recompraDate(
  purchasedOn: string | null,
  packQty: number | null,
  dailyCons: number | null,
  acquiredQty: number | null = null,
): string | null {
  const ro = runoutDate(purchasedOn, packQty, dailyCons, acquiredQty)
  if (!ro) return null
  const d = new Date(`${ro}T00:00:00`)
  d.setDate(d.getDate() - 5)
  return notPast(ymd(d))
}

/** Nunca no passado: se a data já passou, devolve hoje. */
function notPast(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  return d < today ? ymd(today) : ymd(d)
}

// Recorrência declarada pelo usuário → intervalo (dias ou meses).
const FREQ_DAYS: Record<string, number> = { semanal: 7, quinzenal: 15 }
const FREQ_MONTHS: Record<string, number> = { mensal: 1, bimestral: 2, trimestral: 3, semestral: 6, anual: 12 }

/** Recompra pela recorrência declarada (compra + intervalo), nunca no passado. */
export function recompraFromFrequency(purchasedOn: string | null, frequency: string | null): string | null {
  if (!purchasedOn || !frequency) return null
  const d = new Date(`${purchasedOn}T00:00:00`)
  if (isNaN(d.getTime())) return null
  if (FREQ_DAYS[frequency]) d.setDate(d.getDate() + FREQ_DAYS[frequency])
  else if (FREQ_MONTHS[frequency]) d.setMonth(d.getMonth() + FREQ_MONTHS[frequency])
  else return null
  return notPast(ymd(d))
}

/**
 * Hierarquia OFICIAL da próxima recompra (regra de negócio aprovada):
 *   1. Se há cálculo por consumo (embalagem + consumo/dia) → usar o cálculo.
 *   2. Senão, se há recorrência declarada (mensal…anual) → usar a recorrência.
 *   3. Senão → não há recompra.
 */
export function nextRepurchaseDate(
  purchasedOn: string | null,
  packQty: number | null,
  dailyCons: number | null,
  acquiredQty: number | null,
  frequency: string | null,
): string | null {
  return recompraDate(purchasedOn, packQty, dailyCons, acquiredQty)
    ?? recompraFromFrequency(purchasedOn, frequency)
}

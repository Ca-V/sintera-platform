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
  const today = new Date(); today.setHours(0, 0, 0, 0)
  return d < today ? ymd(today) : ymd(d)
}

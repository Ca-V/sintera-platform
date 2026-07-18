// SSOT dos CÁLCULOS DE DATA da plataforma (fundadora 18/07). Toda soma/diferença de datas
// 'YYYY-MM-DD' passa por aqui — nenhuma tela ou domínio reimplementa. Ajuste de regra = um só lugar.
//
// Determinístico e em UTC (mesmo motor já validado por lib/recurrence): para datas-só, o fuso não
// desloca o dia, e UTC evita ambiguidade de DST. `todayISO`/`nowISO` isolam o relógio (injetável em
// serviços puros por um Clock; a UI usa direto). Consumido por: Ciclo/Contracepção (recompra,
// reaplicação, troca de dispositivo, lembretes), Recorrência (addToDate) e, à frente, Planejamento.

/** Parse de 'YYYY-MM-DD' → Date em UTC (meia-noite). */
function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

/** Data de hoje em 'YYYY-MM-DD' (UTC). */
export const todayISO = (): string => new Date().toISOString().slice(0, 10)

/** Timestamp atual completo (ISO-8601) — para carimbos (completed_at etc.). */
export const nowISO = (): string => new Date().toISOString()

/** Soma `n` dias (pode ser negativo) a 'YYYY-MM-DD'. */
export function addDays(iso: string, n: number): string {
  const dt = parseISO(iso); dt.setUTCDate(dt.getUTCDate() + n); return dt.toISOString().slice(0, 10)
}

/** Soma `n` meses (pode ser negativo) a 'YYYY-MM-DD'. Overflow normaliza (31/01 +1 mês → 03/03). */
export function addMonths(iso: string, n: number): string {
  const dt = parseISO(iso); dt.setUTCMonth(dt.getUTCMonth() + n); return dt.toISOString().slice(0, 10)
}

/** Diferença em DIAS entre `a` e `b` (b − a). Positivo se `b` for depois de `a`. */
export function daysBetween(a: string, b: string): number {
  return Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / 86_400_000)
}

/**
 * Próxima ocorrência de uma cadência FIXA em dias, ESTRITAMENTE após `from` (default: hoje).
 * A partir de `start`, retorna o menor `start + k·stepDays` (k ≥ 1) maior que `from`.
 * Base única para: próxima recompra da pílula, próxima aplicação da injeção, troca de adesivo/anel
 * e afins. `stepDays ≤ 0` degrada para `start` (nunca quebra).
 */
export function nextOccurrenceByDays(start: string, stepDays: number, from: string = todayISO()): string {
  if (stepDays <= 0) return start
  const cycles = Math.max(1, Math.floor(daysBetween(start, from) / stepDays) + 1)
  return addDays(start, cycles * stepDays)
}

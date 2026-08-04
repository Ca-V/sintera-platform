// @sintera/core — matemática de datas PURA (determinística, UTC) para o domínio Ciclo + estatística do ciclo
// menstrual. Espelha as regras do SSOT de data da Web (@/lib/date) sem dependência de plataforma. 'YYYY-MM-DD'.

/** Soma `n` dias a uma data ISO ('YYYY-MM-DD'). Determinístico (UTC). */
export function addDaysISO(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + n)
  return dt.toISOString().slice(0, 10)
}

/** Soma `n` meses a uma data ISO (clampa o dia ao fim do mês quando necessário). Determinístico (UTC). */
export function addMonthsISO(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const base = new Date(Date.UTC(y, m - 1, 1))
  base.setUTCMonth(base.getUTCMonth() + n)
  const lastDay = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0)).getUTCDate()
  base.setUTCDate(Math.min(d, lastDay))
  return base.toISOString().slice(0, 10)
}

/** Dias entre duas datas ISO (b - a). */
export function daysBetweenISO(a: string, b: string): number {
  const [ya, ma, da] = a.split('-').map(Number)
  const [yb, mb, db] = b.split('-').map(Number)
  return Math.round((Date.UTC(yb, mb - 1, db) - Date.UTC(ya, ma - 1, da)) / 86400000)
}

/** Menor múltiplo de `intervalDays` a partir de `startISO`, ESTRITAMENTE após `todayISO`. */
export function nextOccurrenceByDaysISO(startISO: string, intervalDays: number, todayISO: string): string {
  if (intervalDays <= 0) return startISO
  let cur = startISO
  while (cur <= todayISO) cur = addDaysISO(cur, intervalDays)
  return cur
}

export interface CycleStats {
  avg: number | null   // duração média do ciclo (dias), das últimas ~6 janelas
  next: string | null  // previsão da próxima menstruação
  last: string | null  // início mais recente registrado
}

/** Estatística factual do ciclo a partir das datas de início (não ordenadas). ≥2 registros → média + previsão. */
export function cycleStats(periodStarts: string[]): CycleStats {
  if (periodStarts.length < 2) return { avg: null, next: null, last: periodStarts[0] ?? null }
  const sorted = [...periodStarts].sort()
  const gaps: number[] = []
  for (let i = 1; i < sorted.length; i++) gaps.push(daysBetweenISO(sorted[i - 1], sorted[i]))
  const recent = gaps.slice(-6)
  const avg = Math.round(recent.reduce((a, b) => a + b, 0) / recent.length)
  const last = sorted[sorted.length - 1]
  return { avg, next: addDaysISO(last, avg), last }
}

// Mecanismo de RECORRÊNCIA reutilizável. A REGRA pura (frequência/intervalo/until/count + serialização/labels)
// vive UMA vez só em @sintera/core (paridade Web↔Mobile) e é reexportada aqui. A aritmética de calendário
// (addToDate/generateOccurrences) delega ao SSOT `@/lib/date` e permanece na Web. Import sites preservados.
import { addDays, addMonths } from '@/lib/date'
import type { RecurrenceFrequency, RecurrenceRule } from '@sintera/core'

export { type RecurrenceFrequency, type RecurrenceRule, NO_RECURRENCE, serializeRule, parseRule, FREQUENCY_LABELS } from '@sintera/core'

/** Soma um período à data 'YYYY-MM-DD'. Delega a aritmética ao SSOT `@/lib/date` (UTC, determinístico). */
export function addToDate(iso: string, frequency: RecurrenceFrequency, interval: number): string {
  const n = Math.max(1, interval)
  switch (frequency) {
    case 'daily':    return addDays(iso, n)
    case 'weekly':   return addDays(iso, 7 * n)
    case 'biweekly': return addDays(iso, 14 * n)
    case 'monthly':  return addMonths(iso, n)
    case 'yearly':   return addMonths(iso, 12 * n)
    case 'none':     return iso
  }
}

/**
 * Gera as datas das ocorrências a partir de `startDate` (inclusive). Respeita `until`/`count`.
 * Sem fim ("até cancelar") é limitado por `maxDefault` (a série pode ser estendida depois). Puro.
 */
export function generateOccurrences(rule: RecurrenceRule, startDate: string, maxDefault = 24): string[] {
  if (rule.frequency === 'none') return [startDate]
  const cap = rule.count ?? maxDefault
  const out: string[] = [startDate]
  let cur = startDate
  while (out.length < cap) {
    const next = addToDate(cur, rule.frequency, rule.interval)
    if (rule.until && next > rule.until) break
    out.push(next)
    cur = next
  }
  return out
}

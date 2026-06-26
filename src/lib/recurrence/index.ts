// Mecanismo de RECORRÊNCIA reutilizável (componente de domínio) — NÃO exclusivo da
// Agenda. Usado por Agenda · Plano de saúde · Medicamentos · Suplementos · Exercícios
// · Vacinas · Protocolos · Exames periódicos. Um único mecanismo, puro e testável.

export type RecurrenceFrequency = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly'

const FREQ = new Set<RecurrenceFrequency>(['none', 'daily', 'weekly', 'biweekly', 'monthly', 'yearly'])

export interface RecurrenceRule {
  frequency: RecurrenceFrequency
  interval: number          // "a cada N" (default 1)
  until: string | null      // 'YYYY-MM-DD' inclusive, ou null
  count: number | null      // total de ocorrências (incl. a primeira), ou null
}

export const NO_RECURRENCE: RecurrenceRule = { frequency: 'none', interval: 1, until: null, count: null }

/** Serializa para guardar em `recurrence_rule` (ex.: "freq=weekly;interval=1;until=2026-12-31"). */
export function serializeRule(r: RecurrenceRule): string | null {
  if (r.frequency === 'none') return null
  const parts = [`freq=${r.frequency}`, `interval=${Math.max(1, r.interval || 1)}`]
  if (r.until) parts.push(`until=${r.until}`)
  if (r.count) parts.push(`count=${r.count}`)
  return parts.join(';')
}

export function parseRule(s: string | null | undefined): RecurrenceRule {
  if (!s) return NO_RECURRENCE
  const map = new Map(s.split(';').map(p => p.split('=') as [string, string]))
  const freq = (map.get('freq') ?? 'none') as RecurrenceFrequency
  return {
    frequency: FREQ.has(freq) ? freq : 'none',
    interval: Math.max(1, Number(map.get('interval') ?? 1) || 1),
    until: map.get('until') ?? null,
    count: map.get('count') ? Number(map.get('count')) : null,
  }
}

/** Soma um período à data 'YYYY-MM-DD' (UTC, determinístico). */
export function addToDate(iso: string, frequency: RecurrenceFrequency, interval: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  const n = Math.max(1, interval)
  switch (frequency) {
    case 'daily':    dt.setUTCDate(dt.getUTCDate() + n); break
    case 'weekly':   dt.setUTCDate(dt.getUTCDate() + 7 * n); break
    case 'biweekly': dt.setUTCDate(dt.getUTCDate() + 14 * n); break
    case 'monthly':  dt.setUTCMonth(dt.getUTCMonth() + n); break
    case 'yearly':   dt.setUTCFullYear(dt.getUTCFullYear() + n); break
    case 'none':     break
  }
  return dt.toISOString().slice(0, 10)
}

/**
 * Gera as datas das ocorrências a partir de `startDate` (inclusive). Respeita
 * `until`/`count`. Sem fim ("até cancelar") é limitado por `maxDefault` (a série
 * pode ser estendida depois). Puro.
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

/** Rótulo curto para UI (apresentação fica nas telas; este é utilitário do domínio). */
export const FREQUENCY_LABELS: Record<RecurrenceFrequency, string> = {
  none: 'Não repetir', daily: 'Diariamente', weekly: 'Semanalmente',
  biweekly: 'Quinzenalmente', monthly: 'Mensalmente', yearly: 'Anualmente',
}

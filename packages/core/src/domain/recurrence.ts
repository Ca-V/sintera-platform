// @sintera/core — REGRA de recorrência (frequência/intervalo/until/count), PURA. Fonte ÚNICA (Web + Mobile).
// A aritmética de calendário (addToDate/generateOccurrences) delega ao SSOT de data e permanece na Web.
// Componente de domínio reutilizável: Agenda · Plano · Medicamentos · Suplementos · Exercícios · Vacinas · Exames.

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

/** Rótulo curto para UI. */
export const FREQUENCY_LABELS: Record<RecurrenceFrequency, string> = {
  none: 'Não repetir', daily: 'Diariamente', weekly: 'Semanalmente',
  biweekly: 'Quinzenalmente', monthly: 'Mensalmente', yearly: 'Anualmente',
}

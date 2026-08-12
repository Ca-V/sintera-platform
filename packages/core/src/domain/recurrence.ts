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

// CADÊNCIAS (D-10) — a UI escolhe uma cadência; bimestral/trimestral/semestral REUSAM o
// `interval` já existente (monthly × 2/3/6). Sem novo mecanismo de domínio nem nova
// aritmética: `addToDate` já respeita `interval`. Fonte ÚNICA Web+Mobile.
export interface CadencePreset { id: string; label: string; frequency: RecurrenceFrequency; interval: number }
export const CADENCE_PRESETS: CadencePreset[] = [
  { id: 'none',       label: 'Não repetir',     frequency: 'none',     interval: 1 },
  { id: 'daily',      label: 'Diariamente',     frequency: 'daily',    interval: 1 },
  { id: 'weekly',     label: 'Semanalmente',    frequency: 'weekly',   interval: 1 },
  { id: 'biweekly',   label: 'Quinzenalmente',  frequency: 'biweekly', interval: 1 },
  { id: 'monthly',    label: 'Mensalmente',     frequency: 'monthly',  interval: 1 },
  { id: 'bimonthly',  label: 'Bimestralmente',  frequency: 'monthly',  interval: 2 },
  { id: 'quarterly',  label: 'Trimestralmente', frequency: 'monthly',  interval: 3 },
  { id: 'semiannual', label: 'Semestralmente',  frequency: 'monthly',  interval: 6 },
  { id: 'yearly',     label: 'Anualmente',      frequency: 'yearly',   interval: 1 },
]

/** Mapeia uma regra (frequency+interval) para o id de cadência; intervalos fora dos presets caem na frequência base. */
export function cadenceIdFor(frequency: RecurrenceFrequency, interval: number): string {
  const i = Math.max(1, interval || 1)
  return CADENCE_PRESETS.find(p => p.frequency === frequency && p.interval === i)?.id
    ?? CADENCE_PRESETS.find(p => p.frequency === frequency)?.id
    ?? 'none'
}

/** Preset por id (fallback: "Não repetir"). */
export function cadenceById(id: string): CadencePreset {
  return CADENCE_PRESETS.find(p => p.id === id) ?? CADENCE_PRESETS[0]
}

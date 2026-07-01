// ============================================================
// Timeline — agrupamento temporal RELATIVO e hierárquico
// ============================================================
// Responde à forma como as pessoas lembram acontecimentos de saúde
// ("foi semana passada", "na consulta de maio") — não a meses fixos.
// Buckets: Hoje · Ontem · Últimos 7 dias · <Mês> de <ano> (ano corrente) · <ano>.
// Pura (sem domínio/banco) — testável com uma data de referência fixa.
// ============================================================

import { DAY_MS, MONTHS_FULL, parseLocal, startOfDay } from './date'

export interface TimeBucket {
  label: string
  /** timestamp representativo do bucket (para ordenar buckets do mais novo ao mais antigo) */
  sortKey: number
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Classifica uma data num bucket relativo à referência (default: agora). */
export function timeBucket(iso: string, ref: Date = new Date()): TimeBucket {
  const date = parseLocal(iso)
  const refDay = startOfDay(ref)
  const day = startOfDay(date)
  const diff = Math.round((refDay - day) / DAY_MS)

  if (diff <= 0) return { label: 'Hoje', sortKey: refDay }
  if (diff === 1) return { label: 'Ontem', sortKey: refDay - DAY_MS }
  if (diff <= 6) return { label: 'Últimos 7 dias', sortKey: refDay - 2 * DAY_MS }

  const y = date.getFullYear()
  if (y === ref.getFullYear()) {
    return { label: `${capitalize(MONTHS_FULL[date.getMonth()])} de ${y}`, sortKey: new Date(y, date.getMonth(), 1).getTime() }
  }
  return { label: String(y), sortKey: new Date(y, 0, 1).getTime() }
}

export interface TimeGroup<T> {
  label: string
  items: T[]
}

/**
 * Agrupa itens em buckets relativos. Os BUCKETS saem do mais novo ao mais antigo;
 * a ordem DOS ITENS dentro do bucket é PRESERVADA (a origem — o domínio via
 * `sortByWhen` — decide a ordem). A apresentação nunca reordena eventos
 * (princípio de ordenação canônica congelado em agenda/event.ts).
 */
export function groupByTime<T>(items: T[], getIso: (t: T) => string, ref: Date = new Date()): TimeGroup<T>[] {
  const map = new Map<string, { sortKey: number; items: T[] }>()
  for (const item of items) {
    const b = timeBucket(getIso(item), ref)
    const entry = map.get(b.label) ?? { sortKey: b.sortKey, items: [] }
    entry.items.push(item)
    map.set(b.label, entry)
  }
  return [...map.entries()]
    .sort((a, b) => b[1].sortKey - a[1].sortKey)
    .map(([label, e]) => ({ label, items: e.items }))
}

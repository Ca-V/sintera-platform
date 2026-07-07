// ============================================================
// Período — parâmetro oficial da Camada de Comunicação (capacidade transversal)
// ============================================================
// Seleção de recorte temporal reutilizável por: Relatório, PDF, compartilhamento,
// impressão, exportações, Linha do Tempo, Dashboards e futuras APIs. O período é
// um PARÂMETRO OFICIAL da comunicação da plataforma — não específico do Relatório.
// (Ver REL-001 §0.0 — Camada de Comunicação.)
// ============================================================

export type PeriodPreset = 'all' | '30d' | '90d' | '6m' | '1y' | 'custom'

export interface Period {
  preset: PeriodPreset
  from?: string | null   // ISO date (yyyy-mm-dd) — usado no 'custom'
  to?: string | null
}

export const PERIOD_PRESETS: { value: PeriodPreset; label: string }[] = [
  { value: 'all',    label: 'Todo o histórico' },
  { value: '30d',    label: 'Últimos 30 dias' },
  { value: '90d',    label: 'Últimos 90 dias' },
  { value: '6m',     label: 'Últimos 6 meses' },
  { value: '1y',     label: 'Último ano' },
  { value: 'custom', label: 'Intervalo personalizado' },
]

export interface ResolvedPeriod { from: Date | null; to: Date | null }

/** Converte o Period escolhido em limites concretos (from=null = sem limite inferior). */
export function resolvePeriod(p: Period, now: Date = new Date()): ResolvedPeriod {
  const end = new Date(now); end.setHours(23, 59, 59, 999)
  const backDays = (days: number) => { const d = new Date(now); d.setDate(d.getDate() - days); d.setHours(0, 0, 0, 0); return d }
  const backMonths = (m: number) => { const d = new Date(now); d.setMonth(d.getMonth() - m); d.setHours(0, 0, 0, 0); return d }
  switch (p.preset) {
    case 'all': return { from: null, to: null }
    case '30d': return { from: backDays(30), to: end }
    case '90d': return { from: backDays(90), to: end }
    case '6m':  return { from: backMonths(6), to: end }
    case '1y':  return { from: backMonths(12), to: end }
    case 'custom': return {
      from: p.from ? new Date(`${p.from}T00:00:00`) : null,
      to:   p.to ? new Date(`${p.to}T23:59:59`) : null,
    }
  }
}

/** Uma data pertence ao período? Data ausente/null = incluída (não esconde dado sem data). */
export function inPeriod(date: string | null | undefined, r: ResolvedPeriod): boolean {
  if (!date) return true
  const d = new Date(date.length <= 10 ? `${date}T00:00:00` : date)
  if (Number.isNaN(d.getTime())) return true
  if (r.from && d < r.from) return false
  if (r.to && d > r.to) return false
  return true
}

/**
 * Uma janela de atividade [start, end] cruza o período? Usada por entidades de
 * ESTADO que terminam (ex.: medicamento suspenso, condição encerrada). `end` null
 * = ainda ativa (sempre cruza, se começou até o fim do período).
 */
export function overlapsPeriod(start: string | null | undefined, end: string | null | undefined, r: ResolvedPeriod): boolean {
  const s = start ? new Date(start.length <= 10 ? `${start}T00:00:00` : start) : null
  const e = end ? new Date(end.length <= 10 ? `${end}T23:59:59` : end) : null
  if (r.to && s && s > r.to) return false
  if (r.from && e && e < r.from) return false
  return true
}

/** Rótulo do período para exibir ao destinatário (abaixo do título). */
export function periodLabel(p: Period): string {
  if (p.preset === 'custom') {
    const f = (s?: string | null) => (s ? new Date(`${s}T00:00:00`).toLocaleDateString('pt-BR') : '—')
    return `${f(p.from)} a ${f(p.to)}`
  }
  return PERIOD_PRESETS.find(x => x.value === p.preset)?.label ?? 'Todo o histórico'
}

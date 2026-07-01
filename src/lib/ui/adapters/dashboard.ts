// ============================================================
// dashboardAdapter — projeções reais → DashboardModel (apresentação)
// ============================================================
// O Dashboard conhece APENAS este contrato. Nunca vê current_biomarkers,
// health_events, exams, Supabase ou services.query. Toda REGRA (prioridade,
// contagens, "atrasado") vive aqui — o componente só renderiza. Read-only.
// Prioridade de "Requer atenção" é DETERMINÍSTICA (rank fixo no adapter).
// ============================================================

import { rowToHealthEvent, sortByWhen, isClosed, type HealthEvent, type HealthEventRow } from '../../agenda/event'
import { summarizeBiomarkers, type BiomarkerRow } from '../../biomarkers/grouping'
import { eventNatureOf } from './timeline'
import { dayDiff, fmtDayMonth } from '../date'
import type { Stat, SituationData, UpcomingData, IndicatorData, ProgramData } from '@/components/dashboard/DashboardPriority'

export interface DashboardModel {
  today: Stat[]
  attention: SituationData[]
  continuing: SituationData[]
  upcoming: UpcomingData[]
  indicators: IndicatorData[]
  programs: ProgramData[]
}

export interface DashboardInput {
  bioRows: BiomarkerRow[]
  eventRows: HealthEventRow[]
  pendingExams: number
  /** data de referência 'YYYY-MM-DD' (pura/testável) */
  refDate: string
}

/** 'YYYY-MM-DD' → "hoje" / "amanhã" / "em N dias" / "DD mmm". */
export function relativeWhen(iso: string, refIso: string): string {
  const d = dayDiff(iso, refIso)
  if (d <= 0) return 'hoje'
  if (d === 1) return 'amanhã'
  if (d <= 7) return `em ${d} dias`
  return fmtDayMonth(iso)
}

// ── Blocos (puros) ────────────────────────────────────────────────────────────
export function buildIndicators(bioRows: BiomarkerRow[]): IndicatorData[] {
  return summarizeBiomarkers(bioRows)
    .filter((s) => s.latest)
    .slice(0, 5)
    .map((s) => ({ label: s.displayName, value: `${s.latest!.value.toLocaleString('pt-BR')}${s.unit ? ' ' + s.unit : ''}` }))
}

export function buildUpcoming(events: HealthEvent[], refDate: string): UpcomingData[] {
  const future = events.filter((e) => !isClosed(e) && e.date >= refDate)
  return sortByWhen(future).slice(0, 5).map((e) => ({
    nature: eventNatureOf(e.type),
    title: e.title?.trim() || 'Acontecimento',
    when: relativeWhen(e.date, refDate),
  }))
}

/** Prioridade DETERMINÍSTICA: overdue (0) → exame aguardando (1). Rank fixo aqui. */
export function buildAttention(events: HealthEvent[], pendingExams: number, refDate: string): SituationData[] {
  const out: SituationData[] = []
  const overdue = sortByWhen(events.filter((e) => !isClosed(e) && e.date < refDate)) // asc por data→hora→id
  for (const e of overdue) {
    out.push({ tone: 'attention', title: `${e.title?.trim() || 'Acontecimento'} — atrasado`, description: 'toque para ver' })
  }
  if (pendingExams > 0) {
    out.push({ tone: 'processing', title: `${pendingExams} exame${pendingExams !== 1 ? 's' : ''} aguardando extração`, description: 'em Exames' })
  }
  return out
}

export function buildToday(model: Omit<DashboardModel, 'today'>, pendingExams: number): Stat[] {
  return [
    { label: 'programas ativos', value: String(model.programs.length) },
    { label: 'ações pendentes', value: String(model.attention.length) },
    { label: 'exames aguardando', value: String(pendingExams) },
    { label: 'próximo evento', value: model.upcoming[0]?.when ?? '—' },
    { label: 'indicadores', value: String(model.indicators.length) },
  ]
}

export function buildDashboard(input: DashboardInput): DashboardModel {
  const events = input.eventRows.map(rowToHealthEvent)
  const indicators = buildIndicators(input.bioRows)
  const upcoming = buildUpcoming(events, input.refDate)
  const attention = buildAttention(events, input.pendingExams, input.refDate)
  const continuing: SituationData[] = [] // fluxos interrompidos = Estado 2
  const programs: ProgramData[] = []     // Programas = Estado 2
  const partial = { attention, continuing, upcoming, indicators, programs }
  return { ...partial, today: buildToday(partial, input.pendingExams) }
}

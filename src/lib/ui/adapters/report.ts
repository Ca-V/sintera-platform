// ============================================================
// reportAdapter — projeções reais → ReportModel (apresentação)
// ============================================================
// O ReportView conhece APENAS este contrato — nunca current_biomarkers,
// health_events, exams, joins ou Supabase. Só COMPOSIÇÃO: reutiliza adapters
// já validados (eventsToTimeline, interpretationToStatus, summarizeBiomarkers).
// Determinístico (ordem das seções fixa; timeline/documentos com ordem estável).
// Read-only — o relatório nunca cria conhecimento (RDC 657).
// ============================================================

import { eventsToTimeline } from './timeline'
import { interpretationToStatus } from './indicator'
import { fmtDayMonthYear, fmtMonthYear } from '../date'
import { summarizeBiomarkers, type BiomarkerRow } from '../../biomarkers/grouping'
import type { HealthEventRow } from '../../agenda/event'
import type { ReportViewProps } from '@/components/report/ReportView'

export interface ExamRow {
  id: string
  type: string | null
  status: string
  created_at: string
  exam_date: string | null
}

export type ReportModel = Omit<ReportViewProps, 'className'>

function examDate(e: ExamRow): string { return e.exam_date ?? e.created_at ?? '' }

export interface ReportInput {
  name: string
  objective: string
  bioRows: BiomarkerRow[]
  eventRows: HealthEventRow[]
  examRows: ExamRow[]
  generatedAt: string // 'YYYY-MM-DD'
}

export function buildTimeline(eventRows: HealthEventRow[]): ReportModel['timeline'] {
  return eventsToTimeline(eventRows).slice(0, 6).map(({ nature, title, when, context }) => ({ nature, title, when, context }))
}

export function buildEvolution(bioRows: BiomarkerRow[]): ReportModel['evolution'] {
  const top = summarizeBiomarkers(bioRows).filter((s) => s.latest).sort((a, b) => b.measurements.length - a.measurements.length)[0]
  if (!top || !top.latest) return undefined
  const refMaxs = top.measurements.map((m) => m.referenceMax).filter((v): v is number => v !== null)
  const reference = refMaxs.length === top.measurements.length && top.measurements.length > 0 && new Set(refMaxs).size === 1 ? refMaxs[0] : undefined
  return {
    name: top.displayName,
    value: top.latest.value.toLocaleString('pt-BR'),
    unit: top.unit || undefined,
    status: interpretationToStatus(top.latest.interpretation),
    collectedAt: fmtDayMonthYear(top.latest.date),
    series: top.measurements.map((m) => ({ x: fmtMonthYear(m.date), y: m.value })),
    reference,
  }
}

/** Documentos ordenados de forma DETERMINÍSTICA (data desc, id asc). */
export function buildDocuments(examRows: ExamRow[]): ReportModel['documents'] {
  return [...examRows]
    .sort((a, b) => examDate(b).localeCompare(examDate(a)) || a.id.localeCompare(b.id))
    .map((e) => ({ type: 'Exame', title: e.type ?? 'Exame', description: fmtDayMonthYear(examDate(e)) }))
}

export function buildSummary(examRows: ExamRow[], eventRows: HealthEventRow[]): ReportModel['summary'] {
  return [
    { label: 'condições', value: '—' },          // Catálogo = Estado 2
    { label: 'medicamentos', value: '—' },       // Catálogo = Estado 2
    { label: 'dispositivos', value: '—' },        // Catálogo = Estado 2
    { label: 'exames no período', value: String(examRows.length) },
    { label: 'eventos', value: String(eventRows.length) },
  ]
}

function coverPeriod(input: ReportInput): string {
  const dates = [
    ...input.eventRows.map((e) => e.event_date),
    ...input.examRows.map(examDate),
  ].filter(Boolean).sort()
  if (dates.length === 0) return '—'
  return `${fmtMonthYear(dates[0])} – ${fmtMonthYear(dates[dates.length - 1])}`
}

export function buildReport(input: ReportInput): ReportModel {
  return {
    cover: { name: input.name, period: coverPeriod(input), generatedAt: fmtDayMonthYear(input.generatedAt), objective: input.objective },
    summary: buildSummary(input.examRows, input.eventRows),
    timeline: buildTimeline(input.eventRows),
    situation: [], // Catálogo (condições/medicamentos/dispositivos) = Estado 2
    evolution: buildEvolution(input.bioRows),
    documents: buildDocuments(input.examRows),
    attachments: [...input.examRows]
      .sort((a, b) => examDate(b).localeCompare(examDate(a)) || a.id.localeCompare(b.id))
      .map((e) => ({ title: e.type ?? 'Exame', description: fmtDayMonthYear(examDate(e)) })),
  }
}

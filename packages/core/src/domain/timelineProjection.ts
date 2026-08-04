// @sintera/core — Histórico de Saúde: PROJEÇÃO cronológica UNIFICADA de fatos de vários domínios (ADR-001:
// projeta/referencia, NUNCA duplica). Fonte ÚNICA (Web + Mobile). ADITIVA: novos domínios (ômicas, ciclo…)
// entram com um novo mapper, sem mudar o consumidor. Cada entrada aponta para o DOMÍNIO DONO (refId+domain).
import type { HealthEvent } from './agenda/event'
import { typeLabel } from './agenda/presentation'
import { isClosed } from './agenda/event'

export type TimelineDomain = 'event' | 'exam'

/** Entrada genérica da linha do tempo — o consumidor (UI) só conhece este contrato, não os domínios. */
export interface TimelineEntry {
  id: string            // único na timeline (prefixado por domínio)
  date: string          // 'YYYY-MM-DD' (ordenação/agrupamento)
  title: string
  subtitle: string | null
  domain: TimelineDomain
  refId: string         // id no domínio dono (para navegar)
  status: string | null
  closed: boolean       // fato encerrado (para filtrar "Histórico" x aberto, se preciso)
}

/** Evento assistencial → entrada de timeline. */
export function eventToTimelineEntry(ev: HealthEvent): TimelineEntry {
  return { id: `event:${ev.id}`, date: ev.date, title: ev.title, subtitle: typeLabel(ev.type), domain: 'event', refId: ev.id, status: ev.status, closed: isClosed(ev) }
}

/** Forma estrutural mínima de um exame para a timeline (compatível com ExamDTO). */
export interface ExamTimelineLike {
  id: string
  exam_date: string | null
  created_at?: string | null
  display_title: string | null
  type: string | null
  issuer: string | null
  status: string | null
}

/** Exame → entrada de timeline (data = exam_date, senão a de entrada). Fato sempre "realizado/fechado". */
export function examToTimelineEntry(ex: ExamTimelineLike): TimelineEntry {
  const date = ex.exam_date || String(ex.created_at ?? '').slice(0, 10)
  return {
    id: `exam:${ex.id}`, date, title: ex.display_title || ex.type || 'Exame',
    subtitle: ex.issuer ? `Exame · ${ex.issuer}` : 'Exame', domain: 'exam', refId: ex.id, status: ex.status, closed: true,
  }
}

/** Une eventos + exames (e, no futuro, ômicas/ciclo) numa lista cronológica desc. */
export function mergeTimeline(events: HealthEvent[], exams: ExamTimelineLike[]): TimelineEntry[] {
  const entries = [...events.map(eventToTimelineEntry), ...exams.map(examToTimelineEntry)].filter(e => e.date)
  return entries.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}

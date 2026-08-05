// @sintera/core — Histórico de Saúde: PROJEÇÃO cronológica UNIFICADA de fatos de vários domínios (ADR-001:
// projeta/referencia, NUNCA duplica). Fonte ÚNICA (Web + Mobile). ADITIVA: novos domínios entram com um novo
// mapper, sem mudar o consumidor. Cada entrada aponta para o DOMÍNIO DONO (refId+domain).
import type { HealthEvent } from './agenda/event'
import { isClosed, isReturnVisit } from './agenda/event'
import { typeLabel, professionalKindLabel, modalityLabel, outcomeSummary, hasOutcome, priorityBadge } from './agenda/presentation'
import { contraceptiveStartLabel } from './cycle'
import { DOMAIN_LABEL, type OmicsDomain } from './omics/domains'

export type TimelineDomain = 'event' | 'exam' | 'omics' | 'contraceptive'

/** Atributos de DENSIDADE do fato (só os presentes são renderizados). Mantém a UI agnóstica ao domínio. */
export interface TimelineMeta {
  professionalLabel?: string | null
  amountCents?: number | null
  attachmentUrl?: string | null
  preparation?: string | null
  outcomeText?: string | null
  hasOutcome?: boolean
  modalityText?: string | null
  isReturn?: boolean
  priorityLabel?: string | null
}

/** Entrada genérica da linha do tempo — o consumidor (UI) só conhece este contrato, não os domínios. */
export interface TimelineEntry {
  id: string            // único na timeline (prefixado por domínio)
  date: string          // 'YYYY-MM-DD' (ordenação/agrupamento)
  title: string
  subtitle: string | null
  domain: TimelineDomain
  refId: string         // id no domínio dono (para navegar)
  status: string | null
  closed: boolean       // fato encerrado (para filtrar "Histórico" x aberto)
  meta?: TimelineMeta
}

/** Evento assistencial → entrada de timeline (com densidade: prioridade, retorno, modalidade, valor, anexo…). */
export function eventToTimelineEntry(ev: HealthEvent): TimelineEntry {
  return {
    id: `event:${ev.id}`, date: ev.date, title: ev.title, subtitle: ev.notes ?? typeLabel(ev.type),
    domain: 'event', refId: ev.id, status: ev.status, closed: isClosed(ev),
    meta: {
      professionalLabel: professionalKindLabel(ev.professionalKind),
      amountCents: ev.amountCents ?? null,
      attachmentUrl: ev.attachmentUrl ?? null,
      preparation: ev.preparation ?? null,
      outcomeText: outcomeSummary(ev.outcome),
      hasOutcome: hasOutcome(ev.outcome),
      modalityText: modalityLabel(ev.modality),
      isReturn: isReturnVisit(ev),
      priorityLabel: priorityBadge(ev.priority)?.label ?? null,
    },
  }
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

/** Painel ômico → entrada de timeline (referência de leitura; o fato pertence ao domínio Ômica). */
export interface OmicsTimelineLike { id: string; domain: string; laboratory: string | null; total_features: number | null; collected_on: string | null; created_at?: string | null }
export function omicsToTimelineEntry(p: OmicsTimelineLike): TimelineEntry {
  const sub = [p.laboratory, p.total_features != null ? `${p.total_features.toLocaleString('pt-BR')} marcadores` : null].filter(Boolean).join(' · ')
  return {
    id: `omics:${p.id}`, date: p.collected_on || String(p.created_at ?? '').slice(0, 10),
    title: DOMAIN_LABEL[p.domain as OmicsDomain] ?? 'Ômica', subtitle: sub || null,
    domain: 'omics', refId: p.id, status: null, closed: true,
  }
}

/** Método contraceptivo → entrada de timeline (Início do anticoncepcional/Inserção do DIU…). CTC-001. */
export interface ContraceptiveTimelineLike { id: string; kind: string; brand: string | null; started_on: string | null }
export function contraceptiveToTimelineEntry(c: ContraceptiveTimelineLike): TimelineEntry {
  return {
    id: `contraceptive:${c.id}`, date: c.started_on ?? '', title: contraceptiveStartLabel(c.kind),
    subtitle: c.brand ?? null, domain: 'contraceptive', refId: c.id, status: null, closed: true,
  }
}

/**
 * Une eventos + exames + ômicas + contracepção numa lista cronológica desc. DEDUP (FB-008): eventos legados
 * vinculados a um exame COM valor>0 são ocultados — o exame já é o fato (o valor vive no exame; Despesas o projeta).
 */
export function mergeTimeline(
  events: HealthEvent[],
  exams: ExamTimelineLike[],
  omics: OmicsTimelineLike[] = [],
  contraceptives: ContraceptiveTimelineLike[] = [],
): TimelineEntry[] {
  const visibleEvents = events.filter(ev => !(ev.links?.some(l => l.type === 'exam') && (ev.amountCents ?? 0) > 0))
  const entries = [
    ...visibleEvents.map(eventToTimelineEntry),
    ...exams.map(examToTimelineEntry),
    ...omics.map(omicsToTimelineEntry),
    ...contraceptives.filter(c => !!c.started_on).map(contraceptiveToTimelineEntry),
  ].filter(e => e.date)
  return entries.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}

/** Histórico de Saúde = SÓ o que ACONTECEU (fato fechado). Eventos abertos vivem na Agenda (FB-016-1). */
export function selectHistory(entries: TimelineEntry[]): TimelineEntry[] {
  return entries.filter(e => e.closed)
}

// ============================================================
// Adapter — health_events (domínio) → TimelineEvent (apresentação)
// ============================================================
// Esconde INTEGRALMENTE o banco: a UI nunca vê `event_type`, só `nature`.
// Determinismo: usa a ordenação CANÔNICA do domínio (sortByWhen: data→hora→id) —
// é PROIBIDO reimplementar sort na apresentação. Read-only (Estado 2 congelado).
// Q "relacionados" resolvido = Estado 2 (links existem, mas resolvê-los a títulos
// depende do EventLink real) → related sai indefinido por ora.
// ============================================================

import { rowToHealthEvent, sortByWhen, type HealthEvent, type HealthEventRow } from '../../agenda/event'
import { fmtDayMonthYear } from '../date'
import type { EventNature } from '@/lib/ui/event'
import type { TimelineEvent } from '@/components/timeline/Timeline'

// event_type (banco/domínio) → natureza (apresentação). Traduz aqui, não no componente.
const TYPE_NATURE: Record<string, EventNature> = {
  consulta: 'consult', retorno: 'consult',
  exame: 'exam', omica: 'exam',
  vacina: 'vaccine',
  procedimento: 'operation', cirurgia: 'operation', estetico: 'operation',
  medicamento: 'purchase', medicacao: 'purchase', suplemento: 'purchase',
  plano: 'generic', protocolo: 'generic', atividade: 'generic', outro: 'generic',
}

const TYPE_LABEL: Record<string, string> = {
  consulta: 'Consulta', retorno: 'Consulta', exame: 'Exame', omica: 'Exame',
  vacina: 'Vacina', procedimento: 'Procedimento', cirurgia: 'Cirurgia', estetico: 'Procedimento',
  medicamento: 'Medicamento', medicacao: 'Medicamento', suplemento: 'Suplemento',
  plano: 'Plano de saúde', protocolo: 'Protocolo', atividade: 'Atividade física', outro: 'Acontecimento',
}

export function eventNatureOf(type: string): EventNature {
  return TYPE_NATURE[type] ?? 'generic'
}

export function healthEventToTimelineEvent(ev: HealthEvent): TimelineEvent {
  return {
    iso: ev.date,
    nature: eventNatureOf(ev.type),
    title: ev.title?.trim() || (TYPE_LABEL[ev.type] ?? 'Acontecimento'),
    when: fmtDayMonthYear(ev.date),
    context: ev.professionalName ?? ev.establishment ?? undefined,
    // related: resolução de EventLink = Estado 2
  }
}

/** Linhas reais de health_events → TimelineEvents, ordem canônica DESC (recente 1º). */
export function eventsToTimeline(rows: HealthEventRow[]): TimelineEvent[] {
  const domain = rows.map(rowToHealthEvent)
  return sortByWhen(domain).reverse().map(healthEventToTimelineEvent)
}

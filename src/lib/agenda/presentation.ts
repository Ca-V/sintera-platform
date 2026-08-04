// APRESENTAÇÃO dos eventos — rótulos/formatação vivem UMA vez só em @sintera/core (paridade Web↔Mobile).
// Este arquivo reexporta esses puros e mantém APENAS `eventToNotificationInput` (projeção p/ o módulo de
// notificação — acoplamento que fica na Web). Import sites existentes ('@/lib/agenda/presentation') preservados.
import type { HealthEvent } from './event'
import type { EventNotificationInput } from './notification'
import { typeLabel, formatDateBR, formatTimeBR } from '@sintera/core'

export {
  EVENT_TYPE_DEFS, EVENT_TYPE_LABELS, EVENT_STATUS_LABELS, EVENT_STATUS_UI,
  typeLabel, statusLabel, formatDateBR, parseDateOnly, formatDateLongBR, formatTimeBR,
  PROFESSIONAL_KIND_DEFS, professionalKindLabel, priorityBadge, priorityRank, byPriority,
  modalityLabel, outcomeSummary, hasOutcome,
} from '@sintera/core'

/**
 * PROJEÇÃO do evento de domínio para o input do formatter de notificação.
 * A notificação nunca é origem de informação — só projeta o domínio consolidado.
 */
export function eventToNotificationInput(ev: HealthEvent): EventNotificationInput {
  return {
    typeLabel: typeLabel(ev.type),
    title: ev.title,
    dateLabel: formatDateBR(ev.date),
    timeLabel: formatTimeBR(ev.time),
    professional: ev.professionalName,
    establishment: ev.establishment,
    location: ev.location,
    modality: ev.modality,
    preparation: ev.preparation,
  }
}

// Camada de APRESENTAÇÃO dos eventos — rótulos, formatação e projeção de conteúdo
// para UI e notificações. Mantém o domínio (event.ts) livre de texto/formato visual.
// A notificação é uma projeção de CONTEÚDO do domínio (REQ-NOTIF-001).

import type { HealthEvent, EventStatus } from './event'
import type { EventNotificationInput } from './notification'

export const EVENT_TYPE_LABELS: Record<string, string> = {
  consulta: 'Consulta', exame: 'Exame', procedimento: 'Procedimento', vacina: 'Vacina',
  retorno: 'Retorno', medicamento: 'Medicamento', medicacao: 'Medicação', suplemento: 'Suplemento',
  atividade: 'Atividade física', estetico: 'Procedimento estético', omica: 'Ômica',
  protocolo: 'Protocolo', outro: 'Evento',
}
export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  planejado: 'Planejado', confirmado: 'Confirmado', realizado: 'Realizado',
  cancelado: 'Cancelado', reagendado: 'Reagendado', perdido: 'Não compareceu',
}

export function typeLabel(type: string): string { return EVENT_TYPE_LABELS[type] ?? 'Evento' }
export function statusLabel(status: EventStatus): string { return EVENT_STATUS_LABELS[status] ?? status }

// Formatação pura (sem Date/locale → determinística e testável).
/** 'YYYY-MM-DD' → 'DD/MM/YYYY'. Entrada inesperada retorna a própria string. */
export function formatDateBR(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '')
  return m ? `${m[3]}/${m[2]}/${m[1]}` : (iso ?? '')
}
/** 'HH:MM[:SS]' → 'HH:MM'. Vazio → null. */
export function formatTimeBR(time: string | null): string | null {
  if (!time) return null
  const m = /^(\d{2}):(\d{2})/.exec(time)
  return m ? `${m[1]}:${m[2]}` : null
}

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

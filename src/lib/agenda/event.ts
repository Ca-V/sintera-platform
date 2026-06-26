// Planejamento da Saúde — modelo de DOMÍNIO do evento da jornada de saúde.
// Fonte única consumida por tela, notificações, calendário e integrações futuras.
// A notificação é PROJEÇÃO deste objeto (ver eventToNotificationInput), nunca a origem.

import type { EventNotificationInput, EventModality } from './notification'

// Status canônico — enum único de plataforma.
export const EVENT_STATUSES = ['planejado', 'confirmado', 'realizado', 'cancelado', 'reagendado', 'perdido'] as const
export type EventStatus = typeof EVENT_STATUSES[number]

// Modalidade: tipo canônico vive em ./notification (consumido pela projeção); reexportado aqui.
export type { EventModality }
export const EVENT_MODALITIES: readonly EventModality[] = ['presencial', 'telemedicina']

// Linkagem extensível a outros objetos da plataforma (opcional).
export type EventLinkKind = 'exam' | 'biomarker' | 'protocol' | 'medication' | 'supplement' | 'professional' | 'document'
export interface EventLink { kind: EventLinkKind; id?: string; label?: string }

export const EVENT_TYPE_LABELS: Record<string, string> = {
  consulta: 'Consulta', vacina: 'Vacina', procedimento: 'Procedimento',
  estetico: 'Procedimento estético', medicamento: 'Medicamento', atividade: 'Atividade física',
  exame: 'Exame', omica: 'Ômica', outro: 'Evento',
}

/** Objeto de domínio do evento (espelha health_events; uma única fonte de verdade). */
export interface HealthEvent {
  id: string
  type: string
  title: string
  status: EventStatus
  date: string                 // 'YYYY-MM-DD'
  time: string | null          // 'HH:MM' | 'HH:MM:SS'
  professionalKind: string | null
  professionalName: string | null
  establishment: string | null
  location: string | null
  modality: EventModality | null
  preparation: string | null
  notes: string | null
  amountCents: number | null
  attachmentUrl: string | null
  links: EventLink[]
  recurrenceRule: string | null
  seriesId: string | null
  completedAt: string | null
}

// ── Formatação pura (sem Date/locale → determinística e testável) ──────────────
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
    typeLabel: EVENT_TYPE_LABELS[ev.type] ?? 'Evento',
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

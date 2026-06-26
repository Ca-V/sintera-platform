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

// Linkagem da jornada clínica (não armazenamento genérico). Chaves PREVISTAS —
// formato único {kind,id,label} para evitar múltiplos formatos no futuro:
//   exam · biomarker · protocol · medication · supplement · document · professional
export type EventLinkKind = 'exam' | 'biomarker' | 'protocol' | 'medication' | 'supplement' | 'document' | 'professional'
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
  durationMin: number | null
  reminderEnabled: boolean
  reminderSentAt: string | null
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

// ── Mapeador DB → domínio (a UI consome o domínio, não a linha crua) ───────────
/** Forma da linha de `health_events` (snake_case) usada pelos mapeadores. */
export interface HealthEventRow {
  id: string
  event_type: string
  title: string
  status?: string | null
  event_date: string
  event_time?: string | null
  duration_min?: number | null
  reminder_enabled?: boolean | null
  reminder_sent_at?: string | null
  professional_kind?: string | null
  professional_name?: string | null
  establishment?: string | null
  location?: string | null
  modality?: string | null
  preparation?: string | null
  notes?: string | null
  amount_cents?: number | null
  attachment_url?: string | null
  links?: unknown
  recurrence_rule?: string | null
  series_id?: string | null
  completed_at?: string | null
}

/** Converte uma linha do banco no objeto de domínio. Puro e tolerante a valores inesperados. */
export function rowToHealthEvent(r: HealthEventRow): HealthEvent {
  const status = (EVENT_STATUSES as readonly string[]).includes(r.status ?? '') ? (r.status as EventStatus) : 'planejado'
  const modality = r.modality === 'presencial' || r.modality === 'telemedicina' ? r.modality : null
  return {
    id: r.id, type: r.event_type, title: r.title, status,
    date: r.event_date, time: r.event_time ?? null,
    durationMin: r.duration_min ?? null,
    reminderEnabled: r.reminder_enabled ?? true,
    reminderSentAt: r.reminder_sent_at ?? null,
    professionalKind: r.professional_kind ?? null, professionalName: r.professional_name ?? null,
    establishment: r.establishment ?? null, location: r.location ?? null,
    modality, preparation: r.preparation ?? null, notes: r.notes ?? null,
    amountCents: r.amount_cents ?? null, attachmentUrl: r.attachment_url ?? null,
    links: Array.isArray(r.links) ? (r.links as EventLink[]) : [],
    recurrenceRule: r.recurrence_rule ?? null, seriesId: r.series_id ?? null,
    completedAt: r.completed_at ?? null,
  }
}

// ── Adaptador legado: agenda_events → domínio (Fase 2 da consolidação) ─────────
// Coexistência controlada: a camada de serviço pode ler `agenda_events` enquanto
// os dados não migram, sempre expondo o mesmo `HealthEvent`. Mapeia o status antigo
// (pending/done/cancelled) para o enum canônico.
export interface AgendaEventRow {
  id: string
  event_type: string
  title: string
  event_date: string
  event_time?: string | null
  duration_min?: number | null
  notes?: string | null
  status?: string | null          // pending | done | cancelled
  reminder_enabled?: boolean | null
  reminder_sent_at?: string | null
}

const AGENDA_STATUS_MAP: Record<string, EventStatus> = {
  pending: 'planejado', done: 'realizado', cancelled: 'cancelado',
}

export function agendaRowToHealthEvent(r: AgendaEventRow): HealthEvent {
  return {
    id: r.id, type: r.event_type, title: r.title,
    status: AGENDA_STATUS_MAP[r.status ?? ''] ?? 'planejado',
    date: r.event_date, time: r.event_time ?? null,
    durationMin: r.duration_min ?? null,
    reminderEnabled: r.reminder_enabled ?? true,
    reminderSentAt: r.reminder_sent_at ?? null,
    professionalKind: null, professionalName: null, establishment: null, location: null,
    modality: null, preparation: null, notes: r.notes ?? null,
    amountCents: null, attachmentUrl: null, links: [],
    recurrenceRule: null, seriesId: null, completedAt: null,
  }
}

// Guardrails de arquitetura (fundadora 25/06/2026):
// - `completed_at` é só MARCADOR temporal. A regra de negócio do "realizado"
//   (alimentar Histórico, gerar gasto, atualizar indicadores) vive numa CAMADA DE
//   SERVIÇO — nunca em triggers de banco nem neste módulo de projeção.
// - Mudanças de status serão auditáveis no futuro (tabela de histórico aditiva);
//   este modelo não precluí essa evolução.

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

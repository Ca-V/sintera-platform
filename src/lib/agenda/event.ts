// DOMÍNIO do evento da jornada de saúde (tabela canônica health_events).
// HealthEvent = um ACONTECIMENTO de saúde (consulta, exame, procedimento, vacina,
// medicamento, suplemento, atividade física, evento financeiro, protocolo preventivo,
// evento derivado automaticamente) — NÃO um "item de agenda". As telas são PROJEÇÕES.
//
// Este módulo contém SÓ domínio: enums, tipos, mapeadores (persistência→domínio) e
// projeções técnicas (predicados). Sem texto/ícone/cor de UI (→ presentation.ts) e
// sem origem física de dados (→ repository.ts).

// Status canônico — enum único de plataforma.
export const EVENT_STATUSES = ['planejado', 'confirmado', 'realizado', 'cancelado', 'reagendado', 'perdido'] as const
export type EventStatus = typeof EVENT_STATUSES[number]

export const EVENT_MODALITIES = ['presencial', 'telemedicina'] as const
export type EventModality = typeof EVENT_MODALITIES[number]

// Relacionamento da jornada — padrão único {id, type, source, metadata} (facilita
// integrações futuras e a convergência ômica). Chaves previstas de `type`:
//   exam · biomarker · protocol · medication · supplement · document · professional
export type EventLinkKind = 'exam' | 'biomarker' | 'protocol' | 'medication' | 'supplement' | 'document' | 'professional'
// Semântica da relação — permite navegar a cadeia da jornada.
export type EventLinkRelationship = 'origin' | 'follow_up' | 'generated_from' | 'related'
export interface EventLink {
  type: EventLinkKind
  id?: string
  relationship?: EventLinkRelationship
  source?: string
  metadata?: Record<string, unknown>
}

/** Objeto de domínio do evento (espelha health_events; uma única fonte de verdade). */
export interface HealthEvent {
  id: string
  type: string
  title: string
  status: EventStatus
  source: string               // origem: manual · exam · protocol · wearable · import · connector · system…
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
  parentEventId: string | null    // evento que originou este (cadeia da jornada)
  rootEventId: string | null      // raiz da cadeia
  completedAt: string | null
}

// `source` evolui para múltiplas origens. Tipo aberto (string) — valores previstos:
export type EventSource =
  | 'manual' | 'agenda_legacy' | 'exam' | 'protocol' | 'ai' | 'wearable'
  | 'device' | 'hospital' | 'lab' | 'import' | 'connector' | 'system'

// ── Mapeadores persistência → domínio (a UI consome o domínio, não a linha crua) ──
/** Forma da linha de `health_events` (snake_case). */
export interface HealthEventRow {
  id: string
  event_type: string
  title: string
  status?: string | null
  source?: string | null
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
  parent_event_id?: string | null
  root_event_id?: string | null
  completed_at?: string | null
}

function normStatus(s: string | null | undefined): EventStatus {
  return (EVENT_STATUSES as readonly string[]).includes(s ?? '') ? (s as EventStatus) : 'planejado'
}
function normModality(m: string | null | undefined): EventModality | null {
  return m === 'presencial' || m === 'telemedicina' ? m : null
}

/** Converte uma linha de `health_events` no domínio. Puro e tolerante a valores inesperados. */
export function rowToHealthEvent(r: HealthEventRow): HealthEvent {
  return {
    id: r.id, type: r.event_type, title: r.title, status: normStatus(r.status),
    source: r.source ?? 'manual',
    date: r.event_date, time: r.event_time ?? null,
    durationMin: r.duration_min ?? null, reminderEnabled: r.reminder_enabled ?? true, reminderSentAt: r.reminder_sent_at ?? null,
    professionalKind: r.professional_kind ?? null, professionalName: r.professional_name ?? null,
    establishment: r.establishment ?? null, location: r.location ?? null,
    modality: normModality(r.modality), preparation: r.preparation ?? null, notes: r.notes ?? null,
    amountCents: r.amount_cents ?? null, attachmentUrl: r.attachment_url ?? null,
    links: Array.isArray(r.links) ? (r.links as EventLink[]) : [],
    recurrenceRule: r.recurrence_rule ?? null, seriesId: r.series_id ?? null,
    parentEventId: r.parent_event_id ?? null, rootEventId: r.root_event_id ?? null,
    completedAt: r.completed_at ?? null,
  }
}

// ── Adaptador legado: agenda_events → domínio (coexistência da consolidação) ──────
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
const AGENDA_STATUS_MAP: Record<string, EventStatus> = { pending: 'planejado', done: 'realizado', cancelled: 'cancelado' }

export function agendaRowToHealthEvent(r: AgendaEventRow): HealthEvent {
  return {
    id: r.id, type: r.event_type, title: r.title,
    status: AGENDA_STATUS_MAP[r.status ?? ''] ?? 'planejado',
    source: 'agenda_legacy',
    date: r.event_date, time: r.event_time ?? null,
    durationMin: r.duration_min ?? null, reminderEnabled: r.reminder_enabled ?? true, reminderSentAt: r.reminder_sent_at ?? null,
    professionalKind: null, professionalName: null, establishment: null, location: null,
    modality: null, preparation: null, notes: r.notes ?? null,
    amountCents: null, attachmentUrl: null, links: [],
    recurrenceRule: null, seriesId: null, parentEventId: null, rootEventId: null, completedAt: null,
  }
}

// ── Projeções técnicas (predicados) — as telas FILTRAM por estes, sem regra própria ──
// Datas recebem `refDate` ('YYYY-MM-DD') para serem puras/testáveis.
export function isConcluded(ev: HealthEvent): boolean { return ev.status === 'realizado' }
export function isClosed(ev: HealthEvent): boolean { return ev.status === 'realizado' || ev.status === 'cancelado' || ev.status === 'perdido' }
export function isUpcoming(ev: HealthEvent, refDate: string): boolean { return !isClosed(ev) && ev.date >= refDate }
export function isPast(ev: HealthEvent, refDate: string): boolean { return isConcluded(ev) || ev.date < refDate }
export function hasActiveReminder(ev: HealthEvent): boolean { return ev.reminderEnabled && !isClosed(ev) }
export function hasCost(ev: HealthEvent): boolean { return (ev.amountCents ?? 0) > 0 }
/** Evento não criado manualmente pelo usuário (protocolo, exame, wearable, importação…). */
export function isDerived(ev: HealthEvent): boolean { return ev.source !== 'manual' && ev.source !== 'agenda_legacy' }

// ── Seletores puros (capacidades de leitura projetam por estes) ───────────────
export function selectUpcoming(events: HealthEvent[], refDate: string): HealthEvent[] {
  return events.filter(e => isUpcoming(e, refDate))
}
export function selectHistorical(events: HealthEvent[], refDate: string): HealthEvent[] {
  return events.filter(e => isPast(e, refDate))
}
export function selectByLink(events: HealthEvent[], type: EventLinkKind, id: string): HealthEvent[] {
  return events.filter(e => e.links.some(l => l.type === type && l.id === id))
}

// ── Mapeador domínio → linha de persistência (health_events canônico) ─────────
export function healthEventToRow(userId: string, ev: Partial<HealthEvent> & { type: string; title: string; date: string }): Record<string, unknown> {
  return {
    ...(ev.id ? { id: ev.id } : {}),
    user_id: userId,
    event_type: ev.type, title: ev.title, status: ev.status ?? 'planejado', source: ev.source ?? 'manual',
    event_date: ev.date, event_time: ev.time ?? null, duration_min: ev.durationMin ?? null,
    reminder_enabled: ev.reminderEnabled ?? true, reminder_sent_at: ev.reminderSentAt ?? null,
    professional_kind: ev.professionalKind ?? null, professional_name: ev.professionalName ?? null,
    establishment: ev.establishment ?? null, location: ev.location ?? null,
    modality: ev.modality ?? null, preparation: ev.preparation ?? null, notes: ev.notes ?? null,
    amount_cents: ev.amountCents ?? null, attachment_url: ev.attachmentUrl ?? null,
    links: ev.links ?? [], recurrence_rule: ev.recurrenceRule ?? null, series_id: ev.seriesId ?? null,
    parent_event_id: ev.parentEventId ?? null, root_event_id: ev.rootEventId ?? null,
    completed_at: ev.completedAt ?? null,
  }
}

// ── Invariantes do domínio — máquina de estados (regras AQUI, não na UI/serviço) ──
// Ex.: planejado→confirmado→realizado é permitido; cancelado→realizado NÃO é.
const ALLOWED_TRANSITIONS: Record<EventStatus, EventStatus[]> = {
  planejado:  ['confirmado', 'reagendado', 'cancelado', 'realizado', 'perdido'],
  confirmado: ['realizado', 'reagendado', 'cancelado', 'perdido'],
  reagendado: ['confirmado', 'realizado', 'reagendado', 'cancelado', 'perdido'],
  realizado:  [],            // terminal
  cancelado:  [],            // terminal
  perdido:    ['reagendado', 'cancelado'],
}
/** `true` se a transição de status é permitida (no-op `from===to` é sempre válido). */
export function canTransition(from: EventStatus, to: EventStatus): boolean {
  if (from === to) return true
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false
}

// ── Regras de transição (PURAS) — usadas pela camada de SERVIÇO, não pelo domínio
// como efeito. Retornam um novo estado; persistência/efeitos colaterais ficam no serviço.
export function completeRule(ev: HealthEvent, nowIso: string): HealthEvent {
  return { ...ev, status: 'realizado', completedAt: ev.completedAt ?? nowIso }
}
export function cancelRule(ev: HealthEvent): HealthEvent {
  return { ...ev, status: 'cancelado' }
}
export function rescheduleRule(ev: HealthEvent, date: string, time: string | null): HealthEvent {
  return { ...ev, status: 'reagendado', date, time }
}

// Guardrails (fundadora): `completed_at` é só MARCADOR; a regra de negócio do
// "realizado" (alimentar Histórico, gerar gasto, atualizar indicadores) vive na
// CAMADA DE SERVIÇO (service.ts) — nunca em trigger nem em projeção. Mudanças de
// status serão auditáveis no futuro (tabela aditiva); este modelo não precluí isso.

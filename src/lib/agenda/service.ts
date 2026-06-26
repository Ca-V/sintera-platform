// Camada de SERVIÇOS (CQRS leve) — a UI conhece APENAS os serviços, nunca o
// repositório. Leitura e escrita separadas (Query/Command) para reduzir acoplamento
// quando entrarem cache, projeções, auditoria e automações.
//
// Agenda e Histórico nascem das capacidades: listUpcoming / listHistorical.
// Comandos aplicam regras puras (event.ts) e EMITEM transições no EventBus (bus.ts);
// efeitos (Histórico/Financeiro/Protocolos/IA/Notificações/Wearables) entram como
// assinantes do bus — sem mudar o serviço.

import type { SupabaseClient } from '@supabase/supabase-js'
import { createSupabaseEventRepository, type EventRepository } from './repository'
import { createEventBus, type EventBus, type DomainEvent, type DomainEventType, type EventActor } from './bus'
import { completeRule, cancelRule, rescheduleRule, canTransition, type HealthEvent, type EventStatus } from './event'

export type EventDraft = Partial<HealthEvent> & { type: string; title: string; date: string }

function todayISO(): string { return new Date().toISOString().slice(0, 10) }
function nowISO(): string { return new Date().toISOString() }
type Clock = { today: () => string; now: () => string }
const SYSTEM_CLOCK: Clock = { today: todayISO, now: nowISO }

// ── Leitura ───────────────────────────────────────────────────────────────────
export interface EventQueryService {
  listUpcoming(userId: string): Promise<HealthEvent[]>      // Agenda
  listHistorical(userId: string): Promise<HealthEvent[]>    // Histórico
  listByExam(userId: string, examId: string): Promise<HealthEvent[]>
  listByBiomarker(userId: string, biomarker: string): Promise<HealthEvent[]>
  listByProtocol(userId: string, protocolId: string): Promise<HealthEvent[]>
}

export function createEventQueryService(repo: EventRepository, clock: Clock = SYSTEM_CLOCK): EventQueryService {
  return {
    listUpcoming:   (u) => repo.listUpcomingEvents(u, clock.today()),
    listHistorical: (u) => repo.listHistoricalEvents(u, clock.today()),
    listByExam:      (u, id) => repo.listEventsByExam(u, id),
    listByBiomarker: (u, b)  => repo.listEventsByBiomarker(u, b),
    listByProtocol:  (u, id) => repo.listEventsByProtocol(u, id),
  }
}

// ── Escrita ───────────────────────────────────────────────────────────────────
export interface EventCommandService {
  create(userId: string, draft: EventDraft): Promise<void>
  complete(userId: string, event: HealthEvent): Promise<void>
  cancel(userId: string, event: HealthEvent): Promise<void>
  reschedule(userId: string, event: HealthEvent, date: string, time: string | null): Promise<void>
}

function newId(): string {
  return (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`)
}

export class InvalidTransitionError extends Error {
  constructor(public from: EventStatus, public to: EventStatus) {
    super(`Transição de status inválida: ${from} → ${to}`)
    this.name = 'InvalidTransitionError'
  }
}

export function createEventCommandService(repo: EventRepository, bus: EventBus, clock: Clock = SYSTEM_CLOCK): EventCommandService {
  // Envelope observável padronizado + enforço da máquina de estados.
  async function emit(type: DomainEventType, userId: string, next: HealthEvent, fromStatus?: EventStatus, correlationId?: string) {
    const actor: EventActor = { kind: 'user', id: userId }
    const e: DomainEvent = { type, eventId: newId(), aggregateId: next.id ?? '', correlationId, actor, at: clock.now(), event: next, fromStatus }
    await bus.publish(e)
  }
  async function guardedSave(userId: string, ev: HealthEvent, to: EventStatus, apply: () => HealthEvent, type: DomainEventType) {
    if (!canTransition(ev.status, to)) throw new InvalidTransitionError(ev.status, to)
    const next = apply()
    await repo.save(userId, next)
    await emit(type, userId, next, ev.status)
  }
  return {
    async create(userId, draft) {
      await repo.save(userId, draft)
      await emit('EventCreated', userId, draft as HealthEvent)
    },
    complete:   (userId, ev) => guardedSave(userId, ev, 'realizado', () => completeRule(ev, clock.now()), 'EventCompleted'),
    cancel:     (userId, ev) => guardedSave(userId, ev, 'cancelado', () => cancelRule(ev), 'EventCancelled'),
    reschedule: (userId, ev, date, time) => guardedSave(userId, ev, 'reagendado', () => rescheduleRule(ev, date, time), 'EventRescheduled'),
  }
}

/** Conveniência para a UI: serviços já ligados ao Supabase (query + command + bus). */
export function eventServicesFor(supabase: SupabaseClient): { query: EventQueryService; command: EventCommandService; bus: EventBus } {
  const repo = createSupabaseEventRepository(supabase)
  const bus = createEventBus()
  return { query: createEventQueryService(repo), command: createEventCommandService(repo, bus), bus }
}

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
import { createEventBus, type EventBus } from './bus'
import { completeRule, cancelRule, rescheduleRule, type HealthEvent } from './event'

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

export function createEventCommandService(repo: EventRepository, bus: EventBus, clock: Clock = SYSTEM_CLOCK): EventCommandService {
  return {
    async create(userId, draft) {
      await repo.save(userId, draft)
      await bus.publish({ type: 'EventCreated', event: draft as HealthEvent, at: clock.now() })
    },
    async complete(userId, ev) {
      const next = completeRule(ev, clock.now())
      await repo.save(userId, next)
      await bus.publish({ type: 'EventCompleted', event: next, fromStatus: ev.status, at: clock.now() })
    },
    async cancel(userId, ev) {
      const next = cancelRule(ev)
      await repo.save(userId, next)
      await bus.publish({ type: 'EventCancelled', event: next, fromStatus: ev.status, at: clock.now() })
    },
    async reschedule(userId, ev, date, time) {
      const next = rescheduleRule(ev, date, time)
      await repo.save(userId, next)
      await bus.publish({ type: 'EventRescheduled', event: next, fromStatus: ev.status, at: clock.now() })
    },
  }
}

/** Conveniência para a UI: serviços já ligados ao Supabase (query + command + bus). */
export function eventServicesFor(supabase: SupabaseClient): { query: EventQueryService; command: EventCommandService; bus: EventBus } {
  const repo = createSupabaseEventRepository(supabase)
  const bus = createEventBus()
  return { query: createEventQueryService(repo), command: createEventCommandService(repo, bus), bus }
}

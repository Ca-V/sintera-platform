// Camada de SERVIÇOS — regras de negócio da jornada de saúde. A UI conhece APENAS
// os serviços, nunca o repositório. Hoje encapsula o repositório; quando entrarem
// recorrências, protocolos preventivos, IA, automações e integração financeira,
// a lógica nasce aqui, sem refactor da UI.
//
// Agenda e Histórico nascem das capacidades: listUpcoming / listHistorical.

import type { SupabaseClient } from '@supabase/supabase-js'
import { createEventRepository, type EventRepository } from './repository'
import { completeRule, cancelRule, rescheduleRule, type HealthEvent } from './event'

export type EventDraft = Partial<HealthEvent> & { type: string; title: string; date: string }

function todayISO(): string { return new Date().toISOString().slice(0, 10) }
function nowISO(): string { return new Date().toISOString() }

export interface EventService {
  /** Agenda — eventos futuros. */
  listUpcoming(userId: string): Promise<HealthEvent[]>
  /** Histórico — eventos passados/concluídos. */
  listHistorical(userId: string): Promise<HealthEvent[]>
  listByExam(userId: string, examId: string): Promise<HealthEvent[]>
  create(userId: string, draft: EventDraft): Promise<void>
  /** Marca realizado (+ completed_at). Hooks de Histórico/gasto/indicadores entram aqui depois. */
  complete(userId: string, event: HealthEvent): Promise<void>
  cancel(userId: string, event: HealthEvent): Promise<void>
  reschedule(userId: string, event: HealthEvent, date: string, time: string | null): Promise<void>
}

export function createEventService(
  repo: EventRepository,
  clock: { today: () => string; now: () => string } = { today: todayISO, now: nowISO },
): EventService {
  return {
    listUpcoming:   (userId) => repo.listUpcomingEvents(userId, clock.today()),
    listHistorical: (userId) => repo.listHistoricalEvents(userId, clock.today()),
    listByExam:     (userId, examId) => repo.listEventsByExam(userId, examId),
    create:     (userId, draft) => repo.save(userId, draft),
    complete:   (userId, ev) => repo.save(userId, completeRule(ev, clock.now())),
    cancel:     (userId, ev) => repo.save(userId, cancelRule(ev)),
    reschedule: (userId, ev, date, time) => repo.save(userId, rescheduleRule(ev, date, time)),
  }
}

/** Helper de conveniência para a UI: serviço já ligado ao Supabase. */
export function eventServiceFor(supabase: SupabaseClient): EventService {
  return createEventService(createEventRepository(supabase))
}

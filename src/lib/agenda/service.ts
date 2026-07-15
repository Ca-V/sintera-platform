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
import { completeRule, cancelRule, rescheduleRule, canTransition, selectNextUpcoming, type HealthEvent, type EventStatus } from './event'
import { parseRule, addToDate } from '../recurrence'

export type EventDraft = Partial<HealthEvent> & { type: string; title: string; date: string }

function todayISO(): string { return new Date().toISOString().slice(0, 10) }
function nowISO(): string { return new Date().toISOString() }
type Clock = { today: () => string; now: () => string }
const SYSTEM_CLOCK: Clock = { today: todayISO, now: nowISO }

// ── Leitura ───────────────────────────────────────────────────────────────────
export interface EventQueryService {
  listUpcoming(userId: string): Promise<HealthEvent[]>      // Agenda
  /** "Próximo evento" — fonte ÚNICA (Dashboard, Agenda e afins consomem isto). */
  nextUpcoming(userId: string): Promise<HealthEvent | null>
  listHistorical(userId: string): Promise<HealthEvent[]>    // Histórico
  listByExam(userId: string, examId: string): Promise<HealthEvent[]>
  listByBiomarker(userId: string, biomarker: string): Promise<HealthEvent[]>
  listByProtocol(userId: string, protocolId: string): Promise<HealthEvent[]>
  /** Gastos = projeção: eventos realizados com valor. */
  listFinancial(userId: string): Promise<HealthEvent[]>
}

export function createEventQueryService(repo: EventRepository, clock: Clock = SYSTEM_CLOCK): EventQueryService {
  return {
    listUpcoming:   (u) => repo.listUpcomingEvents(u, clock.today()),
    // Mesma lista da Agenda → o "próximo" via função única (nunca duas definições).
    nextUpcoming:   (u) => repo.listUpcomingEvents(u, clock.today()).then(l => selectNextUpcoming(l, clock.today())),
    listHistorical: (u) => repo.listHistoricalEvents(u, clock.today()),
    listByExam:      (u, id) => repo.listEventsByExam(u, id),
    listByBiomarker: (u, b)  => repo.listEventsByBiomarker(u, b),
    listByProtocol:  (u, id) => repo.listEventsByProtocol(u, id),
    listFinancial:   (u) => repo.listFinancialEntries(u),
  }
}

// ── Escrita ───────────────────────────────────────────────────────────────────
export interface EventCommandService {
  create(userId: string, draft: EventDraft): Promise<void>
  complete(userId: string, event: HealthEvent): Promise<void>
  cancel(userId: string, event: HealthEvent): Promise<void>
  reschedule(userId: string, event: HealthEvent, date: string, time: string | null): Promise<void>
  /** Desfaz conclusão/cancelamento (correção): volta para "planejado" e limpa completed_at. */
  reopen(userId: string, event: HealthEvent): Promise<void>
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
  // ROLL-FORWARD da recorrência: ao concluir (ou criar já realizado) um evento
  // recorrente, gera a PRÓXIMA ocorrência (planejada) até o `until`. Assim um item de
  // uso contínuo (ex.: medicamento mensal) NUNCA some da Agenda: concluiu um, aparece o
  // próximo. Sempre existe no máximo UMA ocorrência futura por vez (sem duplicatas).
  async function rollForward(userId: string, ev: EventDraft) {
    const rule = parseRule(ev.recurrenceRule ?? null)
    if (rule.frequency === 'none') return
    const nextDate = addToDate(ev.date, rule.frequency, rule.interval)
    if (rule.until && nextDate > rule.until) return
    const occ: EventDraft = {
      ...ev, id: newId(), date: nextDate, status: 'planejado', completedAt: null,
      reminderSentAt: null, seriesId: ev.seriesId ?? newId(), source: 'recurrence',
      // Rastreabilidade da cadeia (NC-0018): a ocorrência registra de QUAL evento rolou
      // (`parentEventId`) e a RAIZ da série (`rootEventId`). Preenche a provenance no
      // write-side (o read-side segue latente); inerte ao comportamento visível atual.
      parentEventId: ev.id ?? null,
      rootEventId: ev.rootEventId ?? ev.id ?? null,
    }
    await repo.save(userId, occ)
    await emit('EventCreated', userId, occ as HealthEvent)
  }

  return {
    async create(userId, draft) {
      // A recorrência pertence à SÉRIE: todo evento recorrente nasce com `series_id`
      // (mesmo sendo a 1ª ocorrência). O roll-forward só MATERIALIZA as próximas
      // ocorrências da MESMA série — não é a definição da recorrência.
      const rule = parseRule(draft.recurrenceRule ?? null)
      const s: EventDraft = (rule.frequency !== 'none' && !draft.seriesId)
        ? { ...draft, seriesId: newId() }
        : draft
      // Regra de negócio: nascer "realizado" carimba completed_at (entra no Histórico/Gastos).
      const d: EventDraft = (s.status === 'realizado' && !s.completedAt)
        ? { ...s, completedAt: clock.now() }
        : s
      await repo.save(userId, d)
      await emit('EventCreated', userId, d as HealthEvent)
      // Se nasceu recorrente E já realizado, deixa a próxima ocorrência planejada.
      if (d.status === 'realizado') await rollForward(userId, d)
    },
    async complete(userId, ev) {
      await guardedSave(userId, ev, 'realizado', () => completeRule(ev, clock.now()), 'EventCompleted')
      await rollForward(userId, ev) // recorrente concluído → próxima ocorrência na Agenda
    },
    cancel:     (userId, ev) => guardedSave(userId, ev, 'cancelado', () => cancelRule(ev), 'EventCancelled'),
    reschedule: (userId, ev, date, time) => guardedSave(userId, ev, 'reagendado', () => rescheduleRule(ev, date, time), 'EventRescheduled'),
    async reopen(userId, ev) {
      // Correção: desfaz conclusão/cancelamento. Volta a "planejado" e limpa completed_at.
      const next = { ...ev, status: 'planejado' as EventStatus, completedAt: null }
      await repo.save(userId, next)
      await emit('EventRescheduled', userId, next, ev.status)
    },
  }
}

/** Conveniência para a UI: serviços já ligados ao Supabase (query + command + bus). */
export function eventServicesFor(supabase: SupabaseClient): { query: EventQueryService; command: EventCommandService; bus: EventBus } {
  const repo = createSupabaseEventRepository(supabase)
  const bus = createEventBus()
  return { query: createEventQueryService(repo), command: createEventCommandService(repo, bus), bus }
}

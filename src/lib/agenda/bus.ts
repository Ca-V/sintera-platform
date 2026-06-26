// EventBus interno — SEAM para reagir a transições de evento (Histórico, Financeiro,
// Protocolos, IA, Notificações, Wearables) sem o serviço virar "God Service".
// Hoje: dispatcher SÍNCRONO, sem assinantes obrigatórios. Assinantes entram depois,
// sem mudar a camada de serviço. Cada transição carrega o estado anterior (semente
// da auditoria event-sourced futura).

import type { HealthEvent, EventStatus } from './event'

export type DomainEventType = 'EventCreated' | 'EventCompleted' | 'EventCancelled' | 'EventRescheduled'

export interface DomainEvent {
  type: DomainEventType
  event: HealthEvent
  fromStatus?: EventStatus      // transição (auditoria/explicabilidade futuras)
  at: string                    // ISO
}

export type DomainEventHandler = (e: DomainEvent) => void | Promise<void>

export interface EventBus {
  publish(e: DomainEvent): Promise<void>
  subscribe(type: DomainEventType, handler: DomainEventHandler): () => void
}

export function createEventBus(): EventBus {
  const handlers = new Map<DomainEventType, Set<DomainEventHandler>>()
  return {
    async publish(e) {
      for (const h of handlers.get(e.type) ?? []) await h(e)
    },
    subscribe(type, handler) {
      if (!handlers.has(type)) handlers.set(type, new Set())
      handlers.get(type)!.add(handler)
      return () => { handlers.get(type)?.delete(handler) }
    },
  }
}

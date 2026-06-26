// Contrato PÚBLICO ESTÁVEL do módulo de Jornada de Saúde. A UI importa SÓ daqui.
// `HealthEvent` é o contrato: banco/repositório/serviços podem mudar por baixo —
// a UI continua funcionando. Não importar de event/repository/service diretamente.

export type {
  HealthEvent, EventStatus, EventModality, EventLink, EventLinkKind,
  EventLinkRelationship, EventSource, Outcome,
} from './event'
export {
  EVENT_STATUSES, EVENT_MODALITIES, canTransition,
  isUpcoming, isPast, isClosed, isConcluded, hasActiveReminder, hasCost, isDerived, isFinancial, isDirectExpense,
} from './event'

export {
  eventServicesFor, InvalidTransitionError,
  type EventQueryService, type EventCommandService, type EventDraft,
} from './service'

export { typeLabel, statusLabel, formatDateBR, formatTimeBR, eventToNotificationInput } from './presentation'
export { buildEventNotification, notificationToInline, type EventNotification } from './notification'
export type { DomainEvent, DomainEventType, EventActor, EventBus } from './bus'

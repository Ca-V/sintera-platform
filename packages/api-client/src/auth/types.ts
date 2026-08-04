// @sintera/api-client — Contratos do DOMÍNIO de autenticação (independentes de plataforma).
import type { Session, User } from '@supabase/supabase-js'
import type { StorageAdapter } from '../storage/adapter'
import type { ProfileApi } from '../profile/types'
import type { ExamsApi } from '../exams/types'
import type { ExamsWriteApi } from '../exams/write'
import type { HealthEvent, EventLink } from '@sintera/core'
import type { EventDraft } from '../agenda/events'
import type { LinkedReminderOptions } from '../agenda/reminder'
import type { LinkedExpenseOptions } from '../agenda/expense'
import type { ConditionDTO, ConditionInput } from '../conditions/conditions'
import type { HabitDTO, HabitInput } from '../habits/habits'
import type { ResourceDTO, ResourceInput } from '../resources/resources'
import type { MedicationDTO, MedicationInput } from '../medications/medications'
import type { ContraceptiveDTO, ContraceptiveInput } from '../cycle/contraception'
import type { PeriodDTO } from '../cycle/menstrual'

export type { Session, User }

/** Ponto de extensão futuro (logging, timeout, observabilidade, feature flags, ambiente de testes). Vazio por ora. */
export interface ApiClientOptions {
  // reservado — mantém a assinatura de createApiClient estável quando surgirem novas necessidades.
}

export interface ApiClientConfig {
  url: string
  key: string
  storage: StorageAdapter
  /** URL base da Web para rotas de API reusadas — PONTE TRANSITÓRIA (ADR-020), ex.: análise de exames. Opcional. */
  webBaseUrl?: string
  options?: ApiClientOptions
}

export interface AuthResult {
  session: Session | null
  error: Error | null
}

export type SessionListener = (session: Session | null) => void

/** API pública de autenticação — o que Web e Mobile consomem. NÃO expõe o cliente Supabase (encapsulamento). */
export interface AuthApi {
  signIn(email: string, password: string): Promise<AuthResult>
  signOut(): Promise<{ error: Error | null }>
  getSession(): Promise<Session | null>
  /** Registra um observador de mudança de sessão; retorna a função de cancelamento (unsubscribe). */
  onAuthStateChange(listener: SessionListener): () => void
}

/** Telemetria de produto + "reportar problema" (usage_events). */
export interface EventsApi {
  /** Registra um evento de uso do próprio usuário. Best-effort — `{ error }`, nunca lança. */
  logEvent(eventName: string, metadata?: Record<string, unknown> | null): Promise<{ error: Error | null }>
}

/** Domínio AGENDA / Evento Assistencial (health_events) — Web/Mobile consomem via ApiClient.agenda. */
export interface AgendaApi {
  /** TODOS os eventos do usuário (legado+canônico, dedup, ordem canônica). `[]` se não houver. LANÇA em falha. */
  listEvents(signal?: AbortSignal): Promise<HealthEvent[]>
  /** Cria/atualiza um evento (upsert no canônico). `{ error }`, NÃO lança. */
  saveEvent(draft: EventDraft): Promise<{ error: Error | null }>
  /** Exclui um evento canônico (por id, dono via RLS). `{ error }`, NÃO lança. */
  deleteEvent(id: string): Promise<{ error: Error | null }>
  /** Sincroniza um lembrete recorrente vinculado a um fato (hábito/recurso/medicamento…). `{ error }`, NÃO lança. */
  syncReminder(link: EventLink, opts: LinkedReminderOptions): Promise<{ error: Error | null }>
  /** Sincroniza uma DESPESA vinculada a um fato (recurso/medicamento…) → Gastos/Histórico. `{ error }`, NÃO lança. */
  syncExpense(link: EventLink, opts: LinkedExpenseOptions): Promise<{ error: Error | null }>
}

/** Domínio Hábitos (life_habits) — CRUD do estado permanente + meta. */
export interface HabitsApi {
  listHabits(signal?: AbortSignal): Promise<HabitDTO[]>
  saveHabit(input: HabitInput): Promise<{ data: { id: string } | null; error: Error | null }>
  deleteHabit(id: string): Promise<{ error: Error | null }>
}

/** Domínio Recursos de Saúde (health_resources) — CRUD + atributos por tipo. */
export interface ResourcesApi {
  listResources(signal?: AbortSignal): Promise<ResourceDTO[]>
  saveResource(input: ResourceInput): Promise<{ data: { id: string } | null; error: Error | null }>
  deleteResource(id: string): Promise<{ error: Error | null }>
}

/** Domínio Medicamentos/Suplementos (medications) — CRUD clínico + estoque + recompra. */
export interface MedicationsApi {
  listMedications(signal?: AbortSignal): Promise<MedicationDTO[]>
  saveMedication(input: MedicationInput): Promise<{ data: { id: string } | null; error: Error | null }>
  deleteMedication(id: string): Promise<{ error: Error | null }>
}

/** Domínio Ciclo e Contracepção — métodos contraceptivos (com lembrete de troca) + ciclo menstrual. */
export interface CycleApi {
  listContraceptives(signal?: AbortSignal): Promise<ContraceptiveDTO[]>
  saveContraceptive(input: ContraceptiveInput): Promise<{ error: Error | null }>
  toggleContraceptiveStatus(m: ContraceptiveDTO): Promise<{ error: Error | null }>
  deleteContraceptive(m: ContraceptiveDTO): Promise<{ error: Error | null }>
  listPeriods(signal?: AbortSignal): Promise<PeriodDTO[]>
  addPeriod(startedOn: string): Promise<{ error: Error | null }>
  deletePeriod(id: string): Promise<{ error: Error | null }>
}

/** Domínio Condições de Saúde (health_conditions) — CRUD do estado permanente da pessoa/familiares. */
export interface ConditionsApi {
  listConditions(signal?: AbortSignal): Promise<ConditionDTO[]>
  saveCondition(input: ConditionInput): Promise<{ error: Error | null }>
  deleteCondition(id: string): Promise<{ error: Error | null }>
}

export interface ApiClient {
  auth: AuthApi
  profile: ProfileApi
  exams: ExamsApi & ExamsWriteApi
  events: EventsApi
  agenda: AgendaApi
  conditions: ConditionsApi
  habits: HabitsApi
  resources: ResourcesApi
  medications: MedicationsApi
  cycle: CycleApi
}

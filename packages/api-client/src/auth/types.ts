// @sintera/api-client — Contratos do DOMÍNIO de autenticação (independentes de plataforma).
import type { Session, User } from '@supabase/supabase-js'
import type { StorageAdapter } from '../storage/adapter'
import type { ProfileApi } from '../profile/types'
import type { ExamsApi } from '../exams/types'
import type { ExamsWriteApi } from '../exams/write'
import type { HealthEvent } from '@sintera/core'
import type { EventDraft } from '../agenda/events'

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
}

export interface ApiClient {
  auth: AuthApi
  profile: ProfileApi
  exams: ExamsApi & ExamsWriteApi
  events: EventsApi
  agenda: AgendaApi
}

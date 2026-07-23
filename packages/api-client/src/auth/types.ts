// @sintera/api-client — Contratos do DOMÍNIO de autenticação (independentes de plataforma).
import type { Session, User } from '@supabase/supabase-js'
import type { StorageAdapter } from '../storage/adapter'

export type { Session, User }

/** Ponto de extensão futuro (logging, timeout, observabilidade, feature flags, ambiente de testes). Vazio por ora. */
export interface ApiClientOptions {
  // reservado — mantém a assinatura de createApiClient estável quando surgirem novas necessidades.
}

export interface ApiClientConfig {
  url: string
  key: string
  storage: StorageAdapter
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

export interface ApiClient {
  auth: AuthApi
}

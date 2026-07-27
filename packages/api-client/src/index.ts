// @sintera/api-client — Comunicação com a plataforma (contrato único web/mobile). Ver docs/HIP-012 §4 · ADR-007.
// Autenticação: fábrica ÚNICA do cliente Supabase + domínio (login/logout/sessão). O storage é injetado por
// plataforma via StorageAdapter genérico. Web/Mobile consomem SÓ esta API pública — nunca o SDK Supabase direto.
export { createApiClient } from './auth/client'
export type {
  ApiClient,
  ApiClientConfig,
  ApiClientOptions,
  AuthApi,
  AuthResult,
  SessionListener,
  Session,
  User,
} from './auth/types'
export type { StorageAdapter } from './storage/adapter'
// Domínio Perfil (Inc 4) — contrato congelado (MOBILE-019). Web/Mobile consomem via ApiClient.profile.
export type { ProfileApi, ProfileDTO, ProfileEditable } from './profile/types'
export { withTimeout, TimeoutError, DEFAULT_TIMEOUT_MS } from './net/timeout'

// WEA-001 / HIP-001 — V2 Épico 2.1: gestão de conexões/credenciais por usuário × fonte.
// A lógica (expiração → refresh → auth_error) é testável sobre um ConnectionRepo INJETÁVEL; a IO service-role
// (que toca as colunas de token de `wearable_connections`) é a única implementação real do repo. Tokens nunca
// saem deste módulo: o resto da app usa `resolveAccessToken` (recebe só a string de acesso) e o status sem tokens.

import type { OAuthProvider, TokenSet } from './oauth'
import { isTokenExpired } from './oauth'
import type { Clock } from './orchestrator'

/** Estados persistidos (casa com o CHECK de wearable_connections.status). */
export type ConnectionStatus = 'connected' | 'expired' | 'revoked' | 'error'

/** Linha crua (COM tokens) — só o repo/service-role a manipula. */
export interface ConnectionRow {
  userId: string
  provider: string
  accessToken: string | null
  refreshToken: string | null
  expiresAt: string | null
  scope: string | null
  status: ConnectionStatus
}

/** Estado SEM tokens — seguro para expor (base do "estado visível"). */
export interface ConnectionState {
  userId: string
  provider: string
  status: ConnectionStatus
  expiresAt: string | null
  scope: string | null
}

/** IO de baixo nível (service-role). Única fronteira que lê/escreve tokens. */
export interface ConnectionRepo {
  read(userId: string, provider: string): Promise<ConnectionRow | null>
  upsert(row: ConnectionRow): Promise<void>
  setStatus(userId: string, provider: string, status: ConnectionStatus): Promise<void>
}

/** Erro tipado: o usuário precisa reconectar (refresh falhou/inexistente/revogado). */
export class ReconnectRequiredError extends Error {
  constructor(public readonly provider: string, message = 'reconexão necessária') {
    super(message)
    this.name = 'ReconnectRequiredError'
  }
}

export interface ConnectionStore {
  /** Salva/atualiza tokens após autorização ou refresh; marca 'connected'. */
  saveTokens(userId: string, provider: string, tokens: TokenSet): Promise<void>
  /** Estado sem tokens (para UI/rotas). */
  getState(userId: string, provider: string): Promise<ConnectionState | null>
  /** Revoga o acesso (mantém a linha para auditoria; some dos tokens ativos). */
  revoke(userId: string, provider: string): Promise<void>
  /**
   * Resolve um token de acesso VÁLIDO: renova via `oauth` se expirado. Em falha de refresh (ou conexão
   * ausente/revogada) marca 'expired' e lança ReconnectRequiredError. Nunca devolve tokens à camada de cima
   * além da string de acesso.
   */
  resolveAccessToken(userId: string, provider: string, oauth: OAuthProvider): Promise<string>
}

export function createConnectionStore(repo: ConnectionRepo, clock: Clock): ConnectionStore {
  return {
    async saveTokens(userId, provider, tokens) {
      await repo.upsert({
        userId, provider,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
        scope: tokens.scope,
        status: 'connected',
      })
    },

    async getState(userId, provider) {
      const row = await repo.read(userId, provider)
      if (!row) return null
      return { userId: row.userId, provider: row.provider, status: row.status, expiresAt: row.expiresAt, scope: row.scope }
    },

    async revoke(userId, provider) {
      await repo.setStatus(userId, provider, 'revoked')
    },

    async resolveAccessToken(userId, provider, oauth) {
      const row = await repo.read(userId, provider)
      if (!row || row.status === 'revoked' || !row.refreshToken) {
        throw new ReconnectRequiredError(provider, 'conexão ausente ou revogada')
      }
      if (row.accessToken && !isTokenExpired(row.expiresAt, clock.now())) {
        return row.accessToken
      }
      // token expirado → tenta renovar
      let renewed: TokenSet
      try {
        renewed = await oauth.refresh(row.refreshToken)
      } catch {
        await repo.setStatus(userId, provider, 'expired')
        throw new ReconnectRequiredError(provider, 'falha ao renovar o acesso')
      }
      await repo.upsert({
        userId, provider,
        accessToken: renewed.accessToken,
        refreshToken: renewed.refreshToken,
        expiresAt: renewed.expiresAt,
        scope: renewed.scope,
        status: 'connected',
      })
      return renewed.accessToken
    },
  }
}

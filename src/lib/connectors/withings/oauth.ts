// HIP-002 — WithingsOAuthProvider (ISOLADO). Implementa o contrato genérico OAuthProvider do núcleo. Traduz o fluxo
// Authorization Code do Withings (envelope próprio via WithingsClient) para o TokenSet da plataforma. A rotação de
// refresh token (o Withings devolve um novo a cada refresh) é tratada pelo núcleo (ConnectionStore.resolveAccessToken).

import type { OAuthProvider, TokenSet } from '../oauth'
import type { Clock } from '../orchestrator'
import { createWithingsClient, type WithingsClient, type FetchLike, type Sleep } from './client'
import { WITHINGS_ACCOUNT_BASE, WITHINGS_SCOPE, WITHINGS_SOURCE, type WithingsConfig } from './config'

export interface WithingsOAuthDeps {
  clock: Clock
  client?: WithingsClient
  fetchImpl?: FetchLike
  sleep?: Sleep
}

/** Converte o corpo de `requesttoken` num TokenSet, carregando o `userid` do Withings como externalUserId (genérico). */
function toTokenSet(body: Record<string, unknown>, clock: Clock): TokenSet {
  const expiresIn = Number(body.expires_in) || 0
  const expiresAt = new Date(new Date(clock.now()).getTime() + expiresIn * 1000).toISOString()
  const userid = body.userid
  return {
    accessToken: String(body.access_token ?? ''),
    refreshToken: String(body.refresh_token ?? ''),
    expiresAt,
    scope: body.scope != null ? String(body.scope) : null,
    externalUserId: userid != null ? String(userid) : null,
  }
}

export function createWithingsOAuthProvider(config: WithingsConfig, deps: WithingsOAuthDeps): OAuthProvider {
  const client = deps.client ?? createWithingsClient({ fetchImpl: deps.fetchImpl, sleep: deps.sleep })
  const clock = deps.clock

  return {
    source: WITHINGS_SOURCE,

    getAuthorizeUrl(state, redirectUri) {
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: config.clientId,
        scope: WITHINGS_SCOPE,
        redirect_uri: config.redirectUri ?? redirectUri,
        state,
      })
      return `${WITHINGS_ACCOUNT_BASE}/oauth2_user/authorize2?${params.toString()}`
    },

    async exchangeCode(code, redirectUri) {
      const body = await client.call('/v2/oauth2', {
        action: 'requesttoken',
        grant_type: 'authorization_code',
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: config.redirectUri ?? redirectUri,
      })
      return toTokenSet(body, clock)
    },

    async refresh(refreshToken) {
      const body = await client.call('/v2/oauth2', {
        action: 'requesttoken',
        grant_type: 'refresh_token',
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: refreshToken,
      })
      return toTokenSet(body, clock)
    },
  }
}

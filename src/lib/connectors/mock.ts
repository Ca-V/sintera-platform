// WEA-001 / HIP-001 — V2 Épico 2.2: MOCK COMPORTAMENTAL (não estático).
// Simula uma integração real via um "mundo" mutável (MockWorld) + relógio, exercitando os 7 cenários:
// 1ª sync · incremental · sem novidades · falha temporária · expiração de token · reconexão · duplicidade.
// Implementa os MESMOS contratos do real (Connector + OAuthProvider) — a troca para o Withings é só o adapter.

import type { Connector, ConnectorContext } from './registry'
import type { OAuthProvider, TokenSet } from './oauth'
import type { CanonicalSample } from './connector'
import type { Clock } from './orchestrator'

export const MOCK_SOURCE = 'mock_demo'
export const MOCK_LABEL = 'Dispositivo de demonstração'
export const MOCK_VERSION = 'mock-v1'

export interface MockMeasurement {
  metric: string
  value: number
  unit: string | null
  recordedAt: string // ISO
  externalId: string
}

/** Estado mutável do "provedor de demonstração" — o harness/teste/app controla os cenários. */
export interface MockWorld {
  /** Dados disponíveis na "nuvem do dispositivo" (crescem ao longo do tempo). */
  measurements: MockMeasurement[]
  /** nº das próximas buscas que devem FALHAR (falha temporária); decrementa a cada busca. */
  failNextFetches: number
  /** Se true, o refresh de token FALHA (simula expiração sem reconexão → auth_error). */
  refreshFails: boolean
  /** TTL do access token em segundos (simula expiração). */
  accessTokenTtlSeconds: number
  /** Contador de autorizações concedidas (para validar reconexão). */
  authorizations: number
}

export function createMockWorld(over: Partial<MockWorld> = {}): MockWorld {
  return { measurements: [], failNextFetches: 0, refreshFails: false, accessTokenTtlSeconds: 3600, authorizations: 0, ...over }
}

function issueTokens(world: MockWorld, clock: Clock, tag: string): TokenSet {
  const expiresAt = new Date(new Date(clock.now()).getTime() + world.accessTokenTtlSeconds * 1000).toISOString()
  return { accessToken: `mock-access-${tag}`, refreshToken: `mock-refresh-${tag}`, expiresAt, scope: 'body' }
}

export function createMockOAuthProvider(world: MockWorld, clock: Clock): OAuthProvider {
  return {
    source: MOCK_SOURCE,
    // Demo: a "tela de autorização" do provedor devolve na hora ao nosso callback com um code — mesmo formato
    // do fluxo real (connect → authorizeUrl → callback), sem depender de um provedor externo.
    getAuthorizeUrl: (state, redirectUri) =>
      `${redirectUri}?code=mock-${encodeURIComponent(state)}&state=${encodeURIComponent(state)}`,
    async exchangeCode() {
      world.authorizations += 1
      return issueTokens(world, clock, `a${world.authorizations}`)
    },
    async refresh() {
      if (world.refreshFails) throw new Error('mock: refresh recusado (token expirado sem reconexão)')
      return issueTokens(world, clock, 'r')
    },
  }
}

export function createMockConnector(world: MockWorld): Connector {
  return {
    descriptor: {
      source: MOCK_SOURCE,
      label: MOCK_LABEL,
      domain: 'wearable',
      acquisition: 'oauth',
      version: MOCK_VERSION,
      capabilities: ['peso', 'gordura_corporal', 'massa_muscular', 'massa_magra', 'massa_ossea', 'agua_corporal'],
    },
    async fetchSamples(ctx: ConnectorContext): Promise<CanonicalSample[]> {
      if (world.failNextFetches > 0) {
        world.failNextFetches -= 1
        throw new Error('mock: falha temporária de rede')
      }
      const since = ctx.window.since
      const inWindow = world.measurements.filter((m) => (since == null || m.recordedAt > since) && m.recordedAt <= ctx.window.until)
      return inWindow.map((m) => ({
        metric: m.metric,
        value: m.value,
        unit: m.unit,
        recordedAt: m.recordedAt,
        provenance: { source: MOCK_SOURCE, connectorVersion: MOCK_VERSION, externalId: m.externalId },
      }))
    },
  }
}

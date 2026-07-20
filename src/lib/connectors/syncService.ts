// WEA-001 / HIP-001 — V2 Épico 2.3: serviço de sincronização (une conexão + janela + orquestrador).
// Determina a janela (1ª sync vs incremental) pela MARCA D'ÁGUA (maior recorded_at já gravado), resolve um token
// válido (refresh se preciso) e delega ao orquestrador do Épico 1. Vendor-neutral; testável com fakes.

import type { ConnectorRegistry, ConnectorContext } from './registry'
import type { ConnectionStore } from './connections'
import { ReconnectRequiredError } from './connections'
import type { OAuthProvider } from './oauth'
import type { PersistClient } from './persistence'
import { runConnectorSync, type SyncRunRecorder, type Clock, type SyncOutcome } from './orchestrator'

/** Lê a marca d'água (instante do dado mais recente já sincronizado) para a sync incremental. */
export interface WatermarkReader {
  lastRecordedAt(userId: string, source: string): Promise<string | null>
}

export interface SyncServiceDeps {
  registry: ConnectorRegistry
  connections: ConnectionStore
  /** Provedor OAuth por fonte (mock agora, Withings depois). */
  oauthFor: (source: string) => OAuthProvider | undefined
  watermark: WatermarkReader
  persist: PersistClient
  recorder: SyncRunRecorder
  clock: Clock
}

export interface SyncService {
  sync(userId: string, source: string): Promise<SyncOutcome>
}

export function createSyncService(deps: SyncServiceDeps): SyncService {
  return {
    async sync(userId, source) {
      const connector = deps.registry.get(source)
      if (!connector) throw new Error(`conector não registrado: ${source}`)
      const oauth = deps.oauthFor(source)
      if (!oauth) throw new Error(`provider OAuth não configurado: ${source}`)

      // 1) token válido (renova se expirado). Reconexão necessária vira um run 'error' visível, sem quebrar.
      let accessToken: string
      try {
        accessToken = await deps.connections.resolveAccessToken(userId, source, oauth)
      } catch (e) {
        const now = deps.clock.now()
        const error = e instanceof ReconnectRequiredError ? e.message : e instanceof Error ? e.message : String(e)
        await deps.recorder.record({ userId, source, startedAt: now, finishedAt: now, status: 'error', recordsCount: 0, error, lastSuccessAt: null })
        return { source, status: 'error', recordsCount: 0, error }
      }

      // 2) janela: 1ª sync (since=null) ou incremental (since=marca d'água). `until` = agora.
      const since = await deps.watermark.lastRecordedAt(userId, source)
      const ctx: ConnectorContext = { userId, accessToken, window: { since, until: deps.clock.now() } }

      // 3) delega ao orquestrador (buscar → propagar → registrar). Nunca lança.
      return runConnectorSync(connector, ctx, { persist: deps.persist, recorder: deps.recorder, clock: deps.clock })
    },
  }
}

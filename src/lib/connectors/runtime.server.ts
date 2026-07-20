// WEA-001 / HIP-001 — V2 Épico 2.3: composição de SERVIDOR (server-only) da plataforma de integrações.
// É AQUI que os conectores concretos são registrados e os provedores OAuth mapeados. Trocar mock→Withings =
// registrar WithingsConnector + WithingsOAuthProvider AQUI; nenhuma rota/UI/persistência muda (substituibilidade).
import 'server-only'
import { createClient as createAdmin, type SupabaseClient } from '@supabase/supabase-js'
import { createConnectorRegistry, type ConnectorRegistry } from './registry'
import { createConnectionStore, type ConnectionStore } from './connections'
import { createSupabaseConnectionRepo } from './supabase-connections'
import { createSupabasePersistClient, createSupabaseSyncRecorder, createSupabaseWatermarkReader } from './supabase-persist'
import { createSyncService, type SyncService } from './syncService'
import { systemClock, isSyncStale } from './orchestrator'
import type { OAuthProvider } from './oauth'
import { createMockWorld, createMockConnector, createMockOAuthProvider, MOCK_SOURCE, type MockWorld } from './mock'

// ── Conector(es) de demonstração ────────────────────────────────────────────────────────────────
// Mundo do mock: seed com um histórico curto de peso/composição para o 1º sync ter o que trazer.
const mockWorld: MockWorld = createMockWorld({
  measurements: [
    { metric: 'peso', value: 82.4, unit: 'kg', recordedAt: '2026-07-10T08:00:00Z', externalId: 'demo-peso-1' },
    { metric: 'gordura_corporal', value: 24.1, unit: '%', recordedAt: '2026-07-10T08:00:00Z', externalId: 'demo-gc-1' },
    { metric: 'peso', value: 81.6, unit: 'kg', recordedAt: '2026-07-15T08:00:00Z', externalId: 'demo-peso-2' },
    { metric: 'gordura_corporal', value: 23.4, unit: '%', recordedAt: '2026-07-15T08:00:00Z', externalId: 'demo-gc-2' },
    { metric: 'peso', value: 81.0, unit: 'kg', recordedAt: '2026-07-19T08:00:00Z', externalId: 'demo-peso-3' },
    { metric: 'massa_muscular', value: 32.2, unit: 'kg', recordedAt: '2026-07-19T08:00:00Z', externalId: 'demo-mm-3' },
  ],
})

const registry: ConnectorRegistry = createConnectorRegistry([createMockConnector(mockWorld)])
const oauthProviders = new Map<string, OAuthProvider>([[MOCK_SOURCE, createMockOAuthProvider(mockWorld, systemClock)]])

// ── Cliente service-role ─────────────────────────────────────────────────────────────────────────
export function adminClient(): SupabaseClient {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
  if (!serviceKey) throw new Error('service role key não configurada')
  return createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey)
}

export function getRegistry(): ConnectorRegistry {
  return registry
}

export function getOAuthProvider(source: string): OAuthProvider | undefined {
  return oauthProviders.get(source)
}

export function getConnectionStore(admin: SupabaseClient = adminClient()): ConnectionStore {
  return createConnectionStore(createSupabaseConnectionRepo(admin), systemClock)
}

export function getSyncService(admin: SupabaseClient = adminClient()): SyncService {
  return createSyncService({
    registry,
    connections: getConnectionStore(admin),
    oauthFor: (s) => oauthProviders.get(s),
    watermark: createSupabaseWatermarkReader(admin),
    persist: createSupabasePersistClient(admin),
    recorder: createSupabaseSyncRecorder(admin),
    clock: systemClock,
  })
}

/** Estado por fonte para a UI/GET: descriptor + status + última sync (sem tokens). */
export interface ConnectorStateDto {
  source: string
  label: string
  domain: string
  status: 'disconnected' | 'connected' | 'expired' | 'revoked' | 'error'
  lastSyncAt: string | null
  lastSyncStatus: string | null
  lastError: string | null
}

/**
 * V2 Épico 3.1 — sincronização ON-OPEN: ao abrir a plataforma, sincroniza as fontes CONECTADAS sozinho,
 * com THROTTLE (não re-sincroniza se já sincronizou há menos de `throttleMs`). Idempotente; reusa o SyncService.
 * Não lança por fonte (uma falha não impede as outras). `now` injetável para testes.
 */
export async function syncOpenConnections(
  admin: SupabaseClient,
  userId: string,
  throttleMs = 15 * 60 * 1000,
  now = Date.now(),
): Promise<{ synced: string[]; skipped: string[] }> {
  const states = await getConnectorStates(admin, userId)
  const svc = getSyncService(admin)
  const synced: string[] = []
  const skipped: string[] = []
  for (const s of states) {
    if (s.status !== 'connected') { skipped.push(s.source); continue }        // só fontes ativas (não expirada/revogada)
    if (!isSyncStale(s.lastSyncAt, throttleMs, now)) { skipped.push(s.source); continue } // sincronizou há pouco → não repete
    try { await svc.sync(userId, s.source); synced.push(s.source) } catch { skipped.push(s.source) }
  }
  return { synced, skipped }
}

export async function getConnectorStates(admin: SupabaseClient, userId: string): Promise<ConnectorStateDto[]> {
  const conns = await admin
    .from('wearable_connections')
    .select('provider, status')
    .eq('user_id', userId)
  const runs = await admin
    .from('connector_sync_runs')
    .select('source, status, finished_at, error')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })

  const statusByProvider = new Map<string, string>()
  for (const c of conns.data ?? []) statusByProvider.set(c.provider as string, c.status as string)
  const lastRunBySource = new Map<string, { status: string; finished_at: string | null; error: string | null }>()
  for (const r of runs.data ?? []) {
    const src = r.source as string
    if (!lastRunBySource.has(src)) lastRunBySource.set(src, { status: r.status as string, finished_at: r.finished_at as string | null, error: r.error as string | null })
  }

  return registry.descriptors().map((d) => {
    const connStatus = statusByProvider.get(d.source)
    const lastRun = lastRunBySource.get(d.source)
    return {
      source: d.source,
      label: d.label,
      domain: d.domain,
      status: (connStatus as ConnectorStateDto['status']) ?? 'disconnected',
      lastSyncAt: lastRun?.finished_at ?? null,
      lastSyncStatus: lastRun?.status ?? null,
      lastError: lastRun?.error ?? null,
    }
  })
}

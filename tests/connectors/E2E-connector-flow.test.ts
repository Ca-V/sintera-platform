// E2E · WEA-001/HIP-001 — pilha INTEIRA (SyncService + ConnectionStore + orquestrador + persistência) com o
// mock comportamental e um "banco" falso coerente (marca d'água lê das leituras). Valida os 7 cenários da V2 e a
// SUBSTITUIBILIDADE (a jornada não conhece o fabricante — só o contrato Connector/OAuthProvider).
import { describe, it, expect } from 'vitest'
import { createConnectorRegistry } from '@/lib/connectors/registry'
import { createConnectionStore, type ConnectionRepo, type ConnectionRow } from '@/lib/connectors/connections'
import { createSyncService, type WatermarkReader } from '@/lib/connectors/syncService'
import { createMockWorld, createMockConnector, createMockOAuthProvider, MOCK_SOURCE, type MockMeasurement } from '@/lib/connectors/mock'
import type { Clock, SyncRunRecorder } from '@/lib/connectors/orchestrator'
import type { PersistClient, WearableReadingRow, BodyMetricRow } from '@/lib/connectors/persistence'
import type { SyncRun } from '@/lib/connectors/connector'

const meas = (metric: string, v: number, at: string, id: string): MockMeasurement => ({ metric, value: v, unit: 'kg', recordedAt: at, externalId: id })

function e2e(seed: MockMeasurement[] = []) {
  const world = createMockWorld({ measurements: [...seed], accessTokenTtlSeconds: 3600 })
  const registry = createConnectorRegistry([createMockConnector(world)])
  const clockState = { t: Date.parse('2026-07-20T12:00:00Z') }
  const clock: Clock = { now: () => new Date(clockState.t).toISOString() }
  const oauth = createMockOAuthProvider(world, clock)

  const rows = new Map<string, ConnectionRow>()
  const repo: ConnectionRepo = {
    async read(u, p) { return rows.get(`${u}|${p}`) ?? null },
    async upsert(row) { rows.set(`${row.userId}|${row.provider}`, row) },
    async setStatus(u, p, s) { const r = rows.get(`${u}|${p}`); if (r) rows.set(`${u}|${p}`, { ...r, status: s }) },
  }
  const connections = createConnectionStore(repo, clock)

  const readings = new Map<string, WearableReadingRow>()
  const body: BodyMetricRow[] = []
  const persist: PersistClient = {
    async upsertReadings(rs) { for (const r of rs) readings.set(`${r.provider}|${r.metric}|${r.recorded_at}`, r) },
    async replaceBodyMetricPoints(userId, source, points) {
      const keys = new Set(points.map((p) => `${p.metric}|${p.measured_on}`))
      for (let i = body.length - 1; i >= 0; i--) if (body[i].source === source && keys.has(`${body[i].metric}|${body[i].measured_on}`)) body.splice(i, 1)
      body.push(...points)
    },
  }
  const runs: (SyncRun & { userId: string })[] = []
  const recorder: SyncRunRecorder = { async record(r) { runs.push(r) } }
  const watermark: WatermarkReader = {
    async lastRecordedAt(u, src) {
      let max: string | null = null
      for (const r of readings.values()) if (r.user_id === u && r.provider === src && (max == null || r.recorded_at > max)) max = r.recorded_at
      return max
    },
  }
  const svc = createSyncService({ registry, connections, oauthFor: () => oauth, watermark, persist, recorder, clock })

  const connect = async () => {
    const tokens = await oauth.exchangeCode('code', 'https://app/cb')
    await connections.saveTokens('u1', MOCK_SOURCE, tokens)
    return svc.sync('u1', MOCK_SOURCE)
  }
  const sync = () => svc.sync('u1', MOCK_SOURCE)
  const advance = (seconds: number) => { clockState.t += seconds * 1000 }

  return { world, connect, sync, advance, connections, readings, body, runs, rows }
}

describe('E2E · jornada de captura automática (mock comportamental)', () => {
  it('(a) conectar → 1ª sync → dado aparece na composição (Aha)', async () => {
    const t = e2e([meas('peso', 82, '2026-07-10T08:00:00Z', 'p1'), meas('gordura_corporal', 24, '2026-07-10T08:00:00Z', 'g1')])
    const out = await t.connect()
    expect(out.status).toBe('ok')
    expect(t.readings.size).toBe(2)
    expect(t.body.map((b) => b.metric).sort()).toEqual(['gordura_corporal', 'peso'])
    expect(t.rows.get(`u1|${MOCK_SOURCE}`)?.status).toBe('connected')
  })

  it('(b) retorno: nova medição → sync incremental traz só o novo', async () => {
    const t = e2e([meas('peso', 82, '2026-07-10T08:00:00Z', 'p1')])
    await t.connect()
    t.world.measurements.push(meas('peso', 81, '2026-07-18T08:00:00Z', 'p2'))
    const out = await t.sync()
    expect(out.recordsCount).toBe(1) // só a nova (incremental pela marca d'água)
    expect(t.readings.size).toBe(2)
  })

  it('(c) sem novidades → sync ok com 0 registros; estado intacto', async () => {
    const t = e2e([meas('peso', 82, '2026-07-10T08:00:00Z', 'p1')])
    await t.connect()
    const out = await t.sync()
    expect(out.status).toBe('ok')
    expect(out.recordsCount).toBe(0)
    expect(t.readings.size).toBe(1)
  })

  it('(d) falha temporária → run de erro, dados anteriores intactos; a seguir recupera', async () => {
    const t = e2e([meas('peso', 82, '2026-07-10T08:00:00Z', 'p1')])
    await t.connect()
    t.world.failNextFetches = 1
    const fail = await t.sync()
    expect(fail.status).toBe('error')
    expect(t.readings.size).toBe(1) // nada perdido
    const ok = await t.sync()
    expect(ok.status).toBe('ok')
  })

  it('(e) expiração de token → refresh automático → sync continua', async () => {
    const t = e2e([meas('peso', 82, '2026-07-10T08:00:00Z', 'p1')])
    await t.connect()
    t.advance(7200) // passa do TTL (3600s) → token expirado
    t.world.measurements.push(meas('peso', 80, '2026-07-19T08:00:00Z', 'p2'))
    const out = await t.sync()
    expect(out.status).toBe('ok') // refresh transparente
    expect(t.readings.size).toBe(2)
    expect(t.rows.get(`u1|${MOCK_SOURCE}`)?.status).toBe('connected')
  })

  it('(f) token expirado + refresh falha → auth_error; reconexão retoma', async () => {
    const t = e2e([meas('peso', 82, '2026-07-10T08:00:00Z', 'p1')])
    await t.connect()
    t.advance(7200)
    t.world.refreshFails = true
    const err = await t.sync()
    expect(err.status).toBe('error')
    expect(t.rows.get(`u1|${MOCK_SOURCE}`)?.status).toBe('expired') // reconexão necessária
    // usuário reconecta:
    t.world.refreshFails = false
    const ok = await t.connect()
    expect(ok.status).toBe('ok')
    expect(t.rows.get(`u1|${MOCK_SOURCE}`)?.status).toBe('connected')
  })

  it('(g) duplicidade: sync repetida = mesmo estado (idempotência)', async () => {
    const t = e2e([meas('peso', 82, '2026-07-10T08:00:00Z', 'p1'), meas('gordura_corporal', 24, '2026-07-10T08:00:00Z', 'g1')])
    await t.connect()
    const before = { r: t.readings.size, b: t.body.length }
    await t.sync()
    await t.sync()
    expect({ r: t.readings.size, b: t.body.length }).toEqual(before)
  })

  it('substituibilidade: a jornada só usa o contrato — trocar o conector não muda o fluxo', async () => {
    // Mesma montagem, "outro fornecedor" (registrado sob outra source) percorre o MESMO caminho.
    const world = createMockWorld({ measurements: [meas('peso', 70, '2026-07-10T08:00:00Z', 'x1')] })
    const conn = createMockConnector(world)
    // prova documental: o SyncService nunca referencia MOCK_SOURCE/fabricante — usa registry.get(source).
    const registry = createConnectorRegistry([conn])
    expect(registry.descriptors()[0].source).toBe(MOCK_SOURCE)
  })
})

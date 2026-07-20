// FUNC · WEA-001/HIP-001 — SyncService: janela 1ª vs incremental, reconexão, idempotência (com o mock).
import { describe, it, expect } from 'vitest'
import { createSyncService, type WatermarkReader } from '@/lib/connectors/syncService'
import { createConnectorRegistry } from '@/lib/connectors/registry'
import { createConnectionStore, type ConnectionRepo, type ConnectionRow } from '@/lib/connectors/connections'
import { createMockWorld, createMockConnector, createMockOAuthProvider, MOCK_SOURCE, type MockMeasurement } from '@/lib/connectors/mock'
import type { Clock, SyncRunRecorder } from '@/lib/connectors/orchestrator'
import type { PersistClient, WearableReadingRow, BodyMetricRow } from '@/lib/connectors/persistence'
import type { SyncRun } from '@/lib/connectors/connector'

const clock: Clock = { now: () => '2026-07-20T12:00:00Z' }
const meas = (v: number, at: string, id: string): MockMeasurement => ({ metric: 'peso', value: v, unit: 'kg', recordedAt: at, externalId: id })

function harness(opts: { world: ReturnType<typeof createMockWorld>; connRow?: ConnectionRow; watermark?: string | null }) {
  const registry = createConnectorRegistry([createMockConnector(opts.world)])
  const oauth = createMockOAuthProvider(opts.world, clock)

  const rows = new Map<string, ConnectionRow>()
  const base: ConnectionRow = opts.connRow ?? { userId: 'u1', provider: MOCK_SOURCE, accessToken: 'tok', refreshToken: 'r', expiresAt: '2026-07-20T13:00:00Z', scope: 'body', status: 'connected' }
  rows.set(`u1|${MOCK_SOURCE}`, base)
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
  const recorder: SyncRunRecorder = { async record(run) { runs.push(run) } }
  const watermark: WatermarkReader = { async lastRecordedAt() { return opts.watermark ?? null } }

  const svc = createSyncService({ registry, connections, oauthFor: () => oauth, watermark, persist, recorder, clock })
  return { svc, readings, body, runs, rows }
}

describe('SyncService', () => {
  it('1ª sync (marca d\'água nula) traz o histórico e projeta a composição', async () => {
    const world = createMockWorld({ measurements: [meas(81, '2026-07-18T08:00:00Z', 'w1'), meas(80, '2026-07-19T08:00:00Z', 'w2')] })
    const { svc, readings, body, runs } = harness({ world, watermark: null })
    const out = await svc.sync('u1', MOCK_SOURCE)
    expect(out).toMatchObject({ source: MOCK_SOURCE, status: 'ok', recordsCount: 2 })
    expect(readings.size).toBe(2)
    expect(body).toHaveLength(2) // peso projeta 1 ponto/dia → 2 dias = 2 pontos
    expect(runs[0].status).toBe('ok')
  })

  it('incremental: usa a marca d\'água como `since`', async () => {
    const world = createMockWorld({ measurements: [meas(81, '2026-07-18T08:00:00Z', 'w1'), meas(80, '2026-07-19T08:00:00Z', 'w2')] })
    const { svc, readings } = harness({ world, watermark: '2026-07-18T12:00:00Z' })
    const out = await svc.sync('u1', MOCK_SOURCE)
    expect(out.recordsCount).toBe(1) // só w2
    expect(readings.size).toBe(1)
  })

  it('reconexão necessária: run de erro, sem buscar dados', async () => {
    const world = createMockWorld({ refreshFails: true, measurements: [meas(81, '2026-07-18T08:00:00Z', 'w1')] })
    const { svc, readings, runs } = harness({ world, connRow: { userId: 'u1', provider: MOCK_SOURCE, accessToken: 'old', refreshToken: 'r', expiresAt: '2026-07-20T11:00:00Z', scope: 'body', status: 'connected' } })
    const out = await svc.sync('u1', MOCK_SOURCE)
    expect(out.status).toBe('error')
    expect(readings.size).toBe(0)
    expect(runs[0].status).toBe('error')
  })

  it('idempotente: rodar 2× (mesma janela) = mesmo estado', async () => {
    const world = createMockWorld({ measurements: [meas(81, '2026-07-18T08:00:00Z', 'w1'), meas(80, '2026-07-19T08:00:00Z', 'w2')] })
    const { svc, readings, body } = harness({ world, watermark: null })
    await svc.sync('u1', MOCK_SOURCE)
    await svc.sync('u1', MOCK_SOURCE)
    expect(readings.size).toBe(2)
    expect(body).toHaveLength(2)
  })
})

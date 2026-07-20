// FUNC · WEA-001/HIP-001 — orquestrador de sync vendor-neutral: sucesso, falha isolada, histórico.
import { describe, it, expect } from 'vitest'
import { runConnectorSync, type SyncDeps, type Clock, type SyncRunRecorder } from '@/lib/connectors/orchestrator'
import type { Connector, ConnectorContext } from '@/lib/connectors/registry'
import type { CanonicalSample, SyncRun } from '@/lib/connectors/connector'
import type { PersistClient, WearableReadingRow, BodyMetricRow } from '@/lib/connectors/persistence'

const sample = (metric: string, value: number): CanonicalSample => ({
  metric, value, unit: 'kg', recordedAt: '2026-07-20T08:00:00Z',
  provenance: { source: 'withings', connectorVersion: 'v1', externalId: `${metric}-1` },
})

const ctx: ConnectorContext = { userId: 'u1', accessToken: 'secret', window: { since: null, until: '2026-07-20T12:00:00Z' } }

function connectorOf(source: string, produce: () => CanonicalSample[]): Connector {
  return {
    descriptor: { source, label: source, domain: 'wearable', acquisition: 'oauth', version: 'v1', capabilities: ['peso'] },
    fetchSamples: async () => produce(),
  }
}

function fakeDeps() {
  const readings = new Map<string, WearableReadingRow>()
  const body: BodyMetricRow[] = []
  const runs: (SyncRun & { userId: string })[] = []
  const persist: PersistClient = {
    async upsertReadings(rows) { for (const r of rows) readings.set(`${r.provider}|${r.metric}|${r.recorded_at}`, r) },
    async replaceBodyMetricPoints(userId, source, points) {
      const keys = new Set(points.map((p) => `${p.metric}|${p.measured_on}`))
      for (let i = body.length - 1; i >= 0; i--) if (body[i].source === source && keys.has(`${body[i].metric}|${body[i].measured_on}`)) body.splice(i, 1)
      body.push(...points)
    },
  }
  const recorder: SyncRunRecorder = { async record(run) { runs.push(run) } }
  let t = 0
  const clock: Clock = { now: () => `2026-07-20T08:00:0${t++}Z` }
  const deps: SyncDeps = { persist, recorder, clock }
  return { deps, readings, body, runs }
}

describe('orchestrator · runConnectorSync', () => {
  it('sucesso: propaga e registra run ok com contagem e last_success_at', async () => {
    const { deps, readings, body, runs } = fakeDeps()
    const out = await runConnectorSync(connectorOf('withings', () => [sample('peso', 81), sample('gordura_corporal', 22)]), ctx, deps)
    expect(out).toMatchObject({ source: 'withings', status: 'ok', recordsCount: 2, error: null })
    expect(readings.size).toBe(2)
    expect(body.map((b) => b.metric).sort()).toEqual(['gordura_corporal', 'peso'])
    expect(runs).toHaveLength(1)
    expect(runs[0]).toMatchObject({ source: 'withings', status: 'ok', recordsCount: 2, error: null })
    expect(runs[0].lastSuccessAt).toBe(runs[0].finishedAt)
  })

  it('falha do provedor NÃO lança: registra run error e devolve outcome de erro', async () => {
    const { deps, readings, runs } = fakeDeps()
    const out = await runConnectorSync(connectorOf('withings', () => { throw new Error('token expirado') }), ctx, deps)
    expect(out).toMatchObject({ source: 'withings', status: 'error', recordsCount: 0 })
    expect(out.error).toMatch(/token expirado/)
    expect(readings.size).toBe(0)
    expect(runs).toHaveLength(1)
    expect(runs[0]).toMatchObject({ status: 'error', recordsCount: 0 })
    expect(runs[0].lastSuccessAt).toBeNull()
  })

  it('vendor-neutral: funciona igual para qualquer source', async () => {
    const { deps, runs } = fakeDeps()
    const out = await runConnectorSync(connectorOf('garmin', () => [sample('peso', 70)]), ctx, deps)
    expect(out.source).toBe('garmin')
    expect(runs[0].source).toBe('garmin')
  })

  it('idempotente: rodar 2× = mesmo estado persistido', async () => {
    const { deps, readings, body } = fakeDeps()
    const produce = () => [sample('peso', 81), sample('gordura_corporal', 22)]
    await runConnectorSync(connectorOf('withings', produce), ctx, deps)
    await runConnectorSync(connectorOf('withings', produce), ctx, deps)
    expect(readings.size).toBe(2)
    expect(body).toHaveLength(2)
  })
})

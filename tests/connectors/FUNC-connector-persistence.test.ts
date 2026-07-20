// FUNC · WEA-001/HIP-001 — propagação CanonicalSample → persistência (bruto + projeção) e IDEMPOTÊNCIA.
import { describe, it, expect } from 'vitest'
import type { CanonicalSample } from '@/lib/connectors/connector'
import {
  toWearableReadingRow, toBodyMetricRow, projectBodyMetricPoints, utcDateOf, propagateSamples,
  type PersistClient, type WearableReadingRow, type BodyMetricRow,
} from '@/lib/connectors/persistence'

const s = (metric: string, recordedAt: string, value: number | null, unit: string | null = null, externalId = 'x'): CanonicalSample => ({
  metric, value, unit, recordedAt, provenance: { source: 'withings', connectorVersion: 'v1', externalId },
})

describe('persistence · mapeadores puros', () => {
  it('bruto preserva proveniência (provider, external_id, versão)', () => {
    const row = toWearableReadingRow(s('peso', '2026-07-20T08:00:00Z', 81.2, 'kg', 'w-9'), 'u1')
    expect(row).toMatchObject({ user_id: 'u1', provider: 'withings', metric: 'peso', value: 81.2, unit: 'kg', external_id: 'w-9', connector_version: 'v1' })
  })
  it('projeta métrica corporal com data UTC e source=wearable', () => {
    const row = toBodyMetricRow(s('gordura_corporal', '2026-07-20T23:30:00Z', 22.4, '%'), 'u1')
    expect(row).toMatchObject({ metric: 'gordura_corporal', value_text: '22.4', unit: '%', measured_on: '2026-07-20', source: 'wearable' })
  })
  it('não projeta métrica não-corporal (só bruto) — degrada, não quebra', () => {
    expect(toBodyMetricRow(s('passos', '2026-07-20T08:00:00Z', 8000), 'u1')).toBeNull()
  })
  it('não projeta valor nulo (value_text é NOT NULL)', () => {
    expect(toBodyMetricRow(s('peso', '2026-07-20T08:00:00Z', null), 'u1')).toBeNull()
  })
  it('utcDateOf é determinística e rejeita instante inválido', () => {
    expect(utcDateOf('2026-07-20T02:00:00Z')).toBe('2026-07-20')
    expect(() => utcDateOf('nao-e-data')).toThrow()
  })
  it('projeção: último do dia por métrica vence', () => {
    const points = projectBodyMetricPoints([
      s('peso', '2026-07-20T07:00:00Z', 81.5, 'kg'),
      s('peso', '2026-07-20T21:00:00Z', 81.0, 'kg'),
    ], 'u1')
    expect(points).toHaveLength(1)
    expect(points[0].value_text).toBe('81')
  })
})

// Cliente falso que imita a semântica do banco (upsert por chave única; replace por dia+métrica na projeção).
function fakeClient() {
  const readings = new Map<string, WearableReadingRow>()
  const body: BodyMetricRow[] = []
  const client: PersistClient = {
    async upsertReadings(rows) {
      for (const r of rows) readings.set(`${r.user_id}|${r.provider}|${r.metric}|${r.recorded_at}`, r)
    },
    async replaceBodyMetricPoints(userId, source, points) {
      const keys = new Set(points.map((p) => `${p.metric}|${p.measured_on}`))
      for (let i = body.length - 1; i >= 0; i--) {
        const b = body[i]
        if (b.user_id === userId && b.source === source && keys.has(`${b.metric}|${b.measured_on}`)) body.splice(i, 1)
      }
      body.push(...points)
    },
  }
  return { client, readings, body }
}

describe('persistence · propagação end-to-end + idempotência', () => {
  const samples = [
    s('peso', '2026-07-20T08:00:00Z', 81.2, 'kg', 'w-1'),
    s('gordura_corporal', '2026-07-20T08:00:00Z', 22.4, '%', 'w-2'),
    s('passos', '2026-07-20T08:00:00Z', 8000, null, 'w-3'), // só bruto
  ]

  it('uma amostra corporal vira leitura BRUTA e ponto de COMPOSIÇÃO', async () => {
    const { client, readings, body } = fakeClient()
    const res = await propagateSamples(client, 'u1', samples)
    expect(res.rawCount).toBe(3)          // todas as 3 no bruto
    expect(res.projectedCount).toBe(2)    // só peso + gordura projetam
    expect(readings.size).toBe(3)
    expect(body.map((b) => b.metric).sort()).toEqual(['gordura_corporal', 'peso'])
  })

  it('rodar 2× = mesmo estado final (idempotente)', async () => {
    const { client, readings, body } = fakeClient()
    await propagateSamples(client, 'u1', samples)
    const snap1 = { r: readings.size, b: JSON.stringify([...body].sort((a, z) => a.metric.localeCompare(z.metric))) }
    await propagateSamples(client, 'u1', samples)
    const snap2 = { r: readings.size, b: JSON.stringify([...body].sort((a, z) => a.metric.localeCompare(z.metric))) }
    expect(snap2).toEqual(snap1)
    expect(readings.size).toBe(3)
    expect(body).toHaveLength(2)
  })

  it('re-sync com valor corrigido no mesmo instante NÃO duplica (bruto e projeção atualizam)', async () => {
    const { client, readings, body } = fakeClient()
    await propagateSamples(client, 'u1', [s('peso', '2026-07-20T08:00:00Z', 81.2, 'kg', 'w-1')])
    await propagateSamples(client, 'u1', [s('peso', '2026-07-20T08:00:00Z', 80.9, 'kg', 'w-1')])
    expect(readings.size).toBe(1)
    expect(body).toHaveLength(1)
    expect(body[0].value_text).toBe('80.9')
  })
})

// FUNC · WEA-001/HIP-001 — MOCK COMPORTAMENTAL: os 7 cenários de uma integração real.
import { describe, it, expect } from 'vitest'
import {
  createMockWorld, createMockConnector, createMockOAuthProvider, MOCK_SOURCE, generateDailySeries, type MockMeasurement,
} from '@/lib/connectors/mock'
import type { ConnectorContext } from '@/lib/connectors/registry'
import type { Clock } from '@/lib/connectors/orchestrator'
import { createConnectionStore, type ConnectionRepo, type ConnectionRow } from '@/lib/connectors/connections'
import { isTokenExpired } from '@/lib/connectors/oauth'

const clock: Clock = { now: () => '2026-07-20T12:00:00Z' }
const m = (metric: string, value: number, recordedAt: string, id: string): MockMeasurement => ({ metric, value, unit: 'kg', recordedAt, externalId: id })
const ctx = (since: string | null, until = '2026-07-31T00:00:00Z'): ConnectorContext => ({ userId: 'u1', accessToken: 'mock-access', window: { since, until } })

describe('mock comportamental · dados', () => {
  it('(a) 1ª sync: since=null → todo o histórico da janela', async () => {
    const world = createMockWorld({ measurements: [m('peso', 81, '2026-07-18T08:00:00Z', 'w1'), m('peso', 80.5, '2026-07-19T08:00:00Z', 'w2')] })
    const out = await createMockConnector(world).fetchSamples(ctx(null))
    expect(out.map((s) => s.provenance.externalId)).toEqual(['w1', 'w2'])
    expect(out[0].provenance.source).toBe(MOCK_SOURCE)
  })

  it('(b) incremental: só o que é mais novo que `since`', async () => {
    const world = createMockWorld({ measurements: [m('peso', 81, '2026-07-18T08:00:00Z', 'w1'), m('peso', 80.5, '2026-07-19T08:00:00Z', 'w2')] })
    const out = await createMockConnector(world).fetchSamples(ctx('2026-07-18T12:00:00Z'))
    expect(out.map((s) => s.provenance.externalId)).toEqual(['w2'])
  })

  it('(c) sem novidades → lista vazia', async () => {
    const world = createMockWorld({ measurements: [m('peso', 81, '2026-07-18T08:00:00Z', 'w1')] })
    const out = await createMockConnector(world).fetchSamples(ctx('2026-07-19T00:00:00Z'))
    expect(out).toEqual([])
  })

  it('(d) falha temporária: 1ª busca lança, a seguinte recupera', async () => {
    const world = createMockWorld({ measurements: [m('peso', 81, '2026-07-18T08:00:00Z', 'w1')], failNextFetches: 1 })
    const conn = createMockConnector(world)
    await expect(conn.fetchSamples(ctx(null))).rejects.toThrow(/tempor/)
    const out = await conn.fetchSamples(ctx(null))
    expect(out).toHaveLength(1)
  })

  it('(g) duplicidade: mesma janela → mesmos externalId (idempotência a jusante)', async () => {
    const world = createMockWorld({ measurements: [m('peso', 81, '2026-07-18T08:00:00Z', 'w1')] })
    const conn = createMockConnector(world)
    const a = await conn.fetchSamples(ctx(null))
    const b = await conn.fetchSamples(ctx(null))
    expect(a.map((s) => s.provenance.externalId)).toEqual(b.map((s) => s.provenance.externalId))
  })
})

describe('mock comportamental · série que CRESCE no tempo (3.2)', () => {
  const cfg = { startDate: '2026-07-01', startWeightKg: 82.6, dailyDeltaKg: -0.1 }
  it('gera uma medição por dia até o "until", determinístico', () => {
    const s = generateDailySeries(cfg, '2026-07-03T12:00:00Z')
    expect(s.map((m) => m.recordedAt)).toEqual(['2026-07-01T08:00:00Z', '2026-07-02T08:00:00Z', '2026-07-03T08:00:00Z'])
    expect(s[0].value).toBe(82.6)
    expect(s[2].value).toBe(82.4) // 82.6 - 0.1*2
    // determinístico: mesma entrada, mesma saída
    expect(generateDailySeries(cfg, '2026-07-03T12:00:00Z')).toEqual(s)
  })
  it('quando "hoje" avança, o sync incremental encontra o dia novo', async () => {
    const world = createMockWorld({ daily: cfg })
    const conn = createMockConnector(world)
    // 1ª sync até 02/07
    const d2 = await conn.fetchSamples(ctx(null, '2026-07-02T12:00:00Z'))
    expect(d2).toHaveLength(2)
    // retorno em 04/07 (incremental a partir do último) → só os dias novos
    const d4 = await conn.fetchSamples(ctx('2026-07-02T08:00:00Z', '2026-07-04T12:00:00Z'))
    expect(d4.map((m) => m.recordedAt)).toEqual(['2026-07-03T08:00:00Z', '2026-07-04T08:00:00Z'])
  })
})

describe('mock comportamental · OAuth/token', () => {
  it('(e) expiração de token: emite token com TTL; TTL curto fica expirado depois', async () => {
    const world = createMockWorld({ accessTokenTtlSeconds: 30 })
    const oauth = createMockOAuthProvider(world, clock)
    const t = await oauth.exchangeCode('code', 'https://app/callback')
    // válido no instante da emissão...
    expect(isTokenExpired(t.expiresAt, clock.now())).toBe(true) // TTL 30s < skew 60s → já "expirado" (força refresh)
    const world2 = createMockWorld({ accessTokenTtlSeconds: 3600 })
    const t2 = await createMockOAuthProvider(world2, clock).exchangeCode('code', 'https://app/callback')
    expect(isTokenExpired(t2.expiresAt, clock.now())).toBe(false)
  })

  it('(e/auth_error) refreshFails → refresh lança; ConnectionStore marca expired', async () => {
    const world = createMockWorld({ refreshFails: true })
    const oauth = createMockOAuthProvider(world, clock)
    await expect(oauth.refresh('r')).rejects.toThrow()
    // integra com o store: token expirado + refresh falho → expired
    const rows = new Map<string, ConnectionRow>([['u1|mock_demo', { userId: 'u1', provider: 'mock_demo', accessToken: 'old', refreshToken: 'r', expiresAt: '2026-07-20T11:00:00Z', scope: 'body', status: 'connected', externalUserId: null }]])
    const repo: ConnectionRepo = {
      async read(u, p) { return rows.get(`${u}|${p}`) ?? null },
      async upsert(row) { rows.set(`${row.userId}|${row.provider}`, row) },
      async setStatus(u, p, s) { const r = rows.get(`${u}|${p}`); if (r) rows.set(`${u}|${p}`, { ...r, status: s }) },
      async findByExternalId(provider, extId) { for (const r of rows.values()) if (r.provider === provider && r.externalUserId === extId) return { userId: r.userId }; return null },
    }
    const store = createConnectionStore(repo, clock)
    await expect(store.resolveAccessToken('u1', 'mock_demo', oauth)).rejects.toThrow()
    expect(rows.get('u1|mock_demo')?.status).toBe('expired')
  })

  it('(f) reconexão: nova autorização emite token fresco e incrementa o contador', async () => {
    const world = createMockWorld()
    const oauth = createMockOAuthProvider(world, clock)
    await oauth.exchangeCode('code1', 'https://app/callback')
    const t2 = await oauth.exchangeCode('code2', 'https://app/callback')
    expect(world.authorizations).toBe(2)
    expect(t2.accessToken).toContain('a2')
  })
})

// FUNC · WEA-001/HIP-001 — OAuth (expiração) + ConnectionStore (refresh/auth_error/revogação).
import { describe, it, expect } from 'vitest'
import { isTokenExpired, type OAuthProvider, type TokenSet } from '@/lib/connectors/oauth'
import {
  createConnectionStore, ReconnectRequiredError,
  type ConnectionRepo, type ConnectionRow,
} from '@/lib/connectors/connections'
import type { Clock } from '@/lib/connectors/orchestrator'

describe('oauth · isTokenExpired (puro)', () => {
  const now = '2026-07-20T12:00:00Z'
  it('futuro além do skew → não expirado', () => expect(isTokenExpired('2026-07-20T13:00:00Z', now)).toBe(false))
  it('passado → expirado', () => expect(isTokenExpired('2026-07-20T11:00:00Z', now)).toBe(true))
  it('dentro do skew (60s) → expirado (margem de segurança)', () => expect(isTokenExpired('2026-07-20T12:00:30Z', now)).toBe(true))
  it('nulo/ inválido → expirado (seguro)', () => {
    expect(isTokenExpired(null, now)).toBe(true)
    expect(isTokenExpired('lixo', now)).toBe(true)
  })
})

// Repo em memória + relógio fixo.
function fakeRepo(initial?: ConnectionRow) {
  const rows = new Map<string, ConnectionRow>()
  if (initial) rows.set(`${initial.userId}|${initial.provider}`, initial)
  const repo: ConnectionRepo = {
    async read(u, p) { return rows.get(`${u}|${p}`) ?? null },
    async upsert(row) { rows.set(`${row.userId}|${row.provider}`, row) },
    async setStatus(u, p, status) { const r = rows.get(`${u}|${p}`); if (r) rows.set(`${u}|${p}`, { ...r, status }) },
    async findByExternalId(provider, extId) { for (const r of rows.values()) if (r.provider === provider && r.externalUserId === extId) return { userId: r.userId }; return null },
  }
  return { repo, rows }
}
const clock: Clock = { now: () => '2026-07-20T12:00:00Z' }

const oauth = (impl?: Partial<OAuthProvider>): OAuthProvider => ({
  source: 'mock',
  getAuthorizeUrl: () => 'https://p/auth',
  exchangeCode: async () => ({ accessToken: 'a', refreshToken: 'r', expiresAt: '2026-07-20T13:00:00Z', scope: null }),
  refresh: async (): Promise<TokenSet> => ({ accessToken: 'a2', refreshToken: 'r2', expiresAt: '2026-07-20T13:00:00Z', scope: null }),
  ...impl,
})

const row = (over: Partial<ConnectionRow> = {}): ConnectionRow => ({
  userId: 'u1', provider: 'mock', accessToken: 'a1', refreshToken: 'r1',
  expiresAt: '2026-07-20T13:00:00Z', scope: null, status: 'connected', externalUserId: null, ...over,
})

describe('connections · ConnectionStore', () => {
  it('saveTokens grava e marca connected; getState não expõe tokens', async () => {
    const { repo } = fakeRepo()
    const store = createConnectionStore(repo, clock)
    await store.saveTokens('u1', 'mock', { accessToken: 'a', refreshToken: 'r', expiresAt: '2026-07-20T13:00:00Z', scope: 'body' })
    const state = await store.getState('u1', 'mock')
    expect(state).toMatchObject({ status: 'connected', scope: 'body' })
    expect(state as object).not.toHaveProperty('accessToken')
  })

  it('token válido → devolve o acesso atual sem refresh', async () => {
    const { repo } = fakeRepo(row())
    let refreshed = false
    const store = createConnectionStore(repo, clock)
    const token = await store.resolveAccessToken('u1', 'mock', oauth({ refresh: async () => { refreshed = true; return { accessToken: 'x', refreshToken: 'y', expiresAt: '', scope: null } } }))
    expect(token).toBe('a1')
    expect(refreshed).toBe(false)
  })

  it('token expirado → renova, persiste e devolve o novo', async () => {
    const { repo, rows } = fakeRepo(row({ expiresAt: '2026-07-20T11:00:00Z' }))
    const store = createConnectionStore(repo, clock)
    const token = await store.resolveAccessToken('u1', 'mock', oauth())
    expect(token).toBe('a2')
    expect(rows.get('u1|mock')).toMatchObject({ accessToken: 'a2', refreshToken: 'r2', status: 'connected' })
  })

  it('refresh falha → marca expired e lança ReconnectRequiredError', async () => {
    const { repo, rows } = fakeRepo(row({ expiresAt: '2026-07-20T11:00:00Z' }))
    const store = createConnectionStore(repo, clock)
    await expect(store.resolveAccessToken('u1', 'mock', oauth({ refresh: async () => { throw new Error('invalid_grant') } })))
      .rejects.toBeInstanceOf(ReconnectRequiredError)
    expect(rows.get('u1|mock')?.status).toBe('expired')
  })

  it('conexão revogada/ausente → ReconnectRequiredError', async () => {
    const store = createConnectionStore(fakeRepo(row({ status: 'revoked' })).repo, clock)
    await expect(store.resolveAccessToken('u1', 'mock', oauth())).rejects.toBeInstanceOf(ReconnectRequiredError)
    const empty = createConnectionStore(fakeRepo().repo, clock)
    await expect(empty.resolveAccessToken('u1', 'mock', oauth())).rejects.toBeInstanceOf(ReconnectRequiredError)
  })

  it('revoke marca revoked', async () => {
    const { repo, rows } = fakeRepo(row())
    const store = createConnectionStore(repo, clock)
    await store.revoke('u1', 'mock')
    expect(rows.get('u1|mock')?.status).toBe('revoked')
  })
})

// FUNC · HIP-002 — WithingsClient (envelope status/erros/backoff) + WithingsOAuthProvider (authorize/exchange/refresh).
// Puro/determinístico: `fetch` e `sleep` são fakes; nenhuma rede, nenhum segredo real.
import { describe, it, expect } from 'vitest'
import type { Clock } from '@/lib/connectors/orchestrator'
import { createWithingsClient, WithingsApiError, type FetchLike } from '@/lib/connectors/withings/client'
import { createWithingsOAuthProvider } from '@/lib/connectors/withings/oauth'
import type { WithingsConfig } from '@/lib/connectors/withings/config'

const clock: Clock = { now: () => '2026-07-20T12:00:00Z' }
const config: WithingsConfig = { clientId: 'cid', clientSecret: 'secret' }

/** fake fetch que devolve, em sequência, os envelopes Withings dados. */
function fakeFetch(responses: Array<{ status: number; body?: Record<string, unknown>; error?: unknown }>): { fetchImpl: FetchLike; calls: Array<{ url: string; body: string; auth?: string }> } {
  const calls: Array<{ url: string; body: string; auth?: string }> = []
  let i = 0
  const fetchImpl = (async (url: string, init?: RequestInit) => {
    const headers = (init?.headers ?? {}) as Record<string, string>
    calls.push({ url: String(url), body: String(init?.body ?? ''), auth: headers.Authorization })
    const payload = responses[Math.min(i, responses.length - 1)]
    i += 1
    return { status: 200, json: async () => payload } as unknown as Response
  }) as unknown as FetchLike
  return { fetchImpl, calls }
}

describe('WithingsClient · envelope de status', () => {
  it('status 0 → devolve o body', async () => {
    const { fetchImpl } = fakeFetch([{ status: 0, body: { hello: 'world' } }])
    const client = createWithingsClient({ fetchImpl, sleep: async () => {} })
    expect(await client.call('/measure', { action: 'getmeas' }, 'tok')).toEqual({ hello: 'world' })
  })

  it('envia Authorization Bearer quando há token', async () => {
    const { fetchImpl, calls } = fakeFetch([{ status: 0, body: {} }])
    const client = createWithingsClient({ fetchImpl, sleep: async () => {} })
    await client.call('/measure', { action: 'getmeas' }, 'secret-token')
    expect(calls[0].auth).toBe('Bearer secret-token')
  })

  it('status ≠ 0 → lança WithingsApiError com o status', async () => {
    const { fetchImpl } = fakeFetch([{ status: 401, error: 'invalid token' }])
    const client = createWithingsClient({ fetchImpl, sleep: async () => {} })
    await expect(client.call('/measure', {}, 'tok')).rejects.toMatchObject({ name: 'WithingsApiError', status: 401 })
    try { await client.call('/measure', {}, 'tok') } catch (e) { expect((e as WithingsApiError).isAuth).toBe(true) }
  })

  it('601 (rate limit) → faz backoff e retenta, então sucede', async () => {
    const { fetchImpl } = fakeFetch([{ status: 601 }, { status: 601 }, { status: 0, body: { ok: 1 } }])
    const slept: number[] = []
    const client = createWithingsClient({ fetchImpl, sleep: async (ms) => { slept.push(ms) }, backoffBaseMs: 10 })
    expect(await client.call('/measure', {}, 'tok')).toEqual({ ok: 1 })
    expect(slept).toEqual([10, 20]) // backoff exponencial (2 retries até o sucesso)
  })

  it('601 persistente além do limite → lança rate limit', async () => {
    const { fetchImpl } = fakeFetch([{ status: 601 }])
    const client = createWithingsClient({ fetchImpl, sleep: async () => {}, maxRetries: 2, backoffBaseMs: 1 })
    try { await client.call('/measure', {}, 'tok'); throw new Error('deveria falhar') }
    catch (e) { expect(e).toBeInstanceOf(WithingsApiError); expect((e as WithingsApiError).isRateLimit).toBe(true) }
  })
})

describe('WithingsOAuthProvider', () => {
  it('getAuthorizeUrl monta a URL oficial (authorize2 + params)', () => {
    const p = createWithingsOAuthProvider(config, { clock, fetchImpl: fakeFetch([{ status: 0, body: {} }]).fetchImpl })
    const url = new URL(p.getAuthorizeUrl('st8', 'https://app.exemplo/api/connectors/withings/callback'))
    expect(url.origin + url.pathname).toBe('https://account.withings.com/oauth2_user/authorize2')
    expect(url.searchParams.get('response_type')).toBe('code')
    expect(url.searchParams.get('client_id')).toBe('cid')
    expect(url.searchParams.get('scope')).toBe('user.metrics')
    expect(url.searchParams.get('state')).toBe('st8')
    expect(url.searchParams.get('redirect_uri')).toBe('https://app.exemplo/api/connectors/withings/callback')
  })

  it('redirectUri fixo na config tem prioridade', () => {
    const p = createWithingsOAuthProvider({ ...config, redirectUri: 'https://fixo/cb' }, { clock, fetchImpl: fakeFetch([{ status: 0 }]).fetchImpl })
    const url = new URL(p.getAuthorizeUrl('s', 'https://ignorado/cb'))
    expect(url.searchParams.get('redirect_uri')).toBe('https://fixo/cb')
  })

  it('exchangeCode → TokenSet com externalUserId (userid) e expiresAt pelo relógio', async () => {
    const { fetchImpl, calls } = fakeFetch([{ status: 0, body: { userid: 12345, access_token: 'at', refresh_token: 'rt', expires_in: 10800, scope: 'user.metrics', token_type: 'Bearer' } }])
    const p = createWithingsOAuthProvider(config, { clock, fetchImpl })
    const tokens = await p.exchangeCode('the-code', 'https://app/cb')
    expect(tokens).toEqual({
      accessToken: 'at', refreshToken: 'rt', scope: 'user.metrics',
      externalUserId: '12345', // userid numérico vira string (chave p/ webhook)
      expiresAt: '2026-07-20T15:00:00.000Z', // 12:00 + 10800s = 15:00
    })
    // corpo form-urlencoded correto
    expect(calls[0].body).toContain('action=requesttoken')
    expect(calls[0].body).toContain('grant_type=authorization_code')
    expect(calls[0].body).toContain('code=the-code')
  })

  it('refresh → TokenSet novo (rotação de refresh token vem no body)', async () => {
    const { fetchImpl, calls } = fakeFetch([{ status: 0, body: { userid: 7, access_token: 'at2', refresh_token: 'rt2-novo', expires_in: 3600, scope: 'user.metrics' } }])
    const p = createWithingsOAuthProvider(config, { clock, fetchImpl })
    const tokens = await p.refresh('rt-antigo')
    expect(tokens.accessToken).toBe('at2')
    expect(tokens.refreshToken).toBe('rt2-novo') // o núcleo persiste este novo refresh (rotação)
    expect(tokens.externalUserId).toBe('7')
    expect(calls[0].body).toContain('grant_type=refresh_token')
    expect(calls[0].body).toContain('refresh_token=rt-antigo')
  })
})

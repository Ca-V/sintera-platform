// Módulo Perfil do @sintera/api-client — contrato congelado (MOBILE-019). Supabase mockado (harness).
import { describe, it, expect, vi, afterEach } from 'vitest'
import { getProfile } from '../../packages/api-client/src/profile/get'
import { updateProfile } from '../../packages/api-client/src/profile/update'
import { withTimeout, TimeoutError, DEFAULT_TIMEOUT_MS } from '../../packages/api-client/src/net/timeout'
import { mockSupabase, mockQueryBuilder, fakeSession } from './supabaseMock'

/** Builder cuja espera REJEITA (simula o supabase-js rejeitando ao abortar/rede). */
function rejectingBuilder(err: unknown) {
  const b = mockQueryBuilder({ data: null, error: null }) as Record<string, unknown>
  b.then = (_res: unknown, rej: (e: unknown) => unknown) => Promise.reject(err).then(_res as never, rej)
  return b as ReturnType<typeof mockQueryBuilder>
}

describe('api-client · profile.getProfile — leitura (null=vazio, exceção=falha)', () => {
  it('linha existente → ProfileDTO só com os campos centrais', async () => {
    const row = {
      id: 'u1', name: 'Ana', phone: '+5511', age_range: '36-45', goals: ['sono'],
      avatar_url: null, updated_at: '2026-07-27T00:00:00Z',
      // campos de outros domínios que NÃO devem aparecer no DTO:
      cycle_length: 28, height_cm: 165, pref_daily_reminder: true,
    }
    const builder = mockQueryBuilder({ data: row, error: null })
    const client = mockSupabase({ session: fakeSession('u1'), from: () => builder })
    const dto = await getProfile(client)
    expect(dto).toEqual({ id: 'u1', name: 'Ana', phone: '+5511', age_range: '36-45', goals: ['sono'], avatar_url: null, updated_at: '2026-07-27T00:00:00Z' })
    expect(dto).not.toHaveProperty('cycle_length')
    expect(dto).not.toHaveProperty('pref_daily_reminder')
    // filtra pela própria linha e passa o abortSignal (timeout D2)
    const calls = (builder as unknown as { __calls: Record<string, unknown[]> }).__calls
    expect(calls.eq).toEqual(['id', 'u1'])
    expect(calls.abortSignal?.[0]).toBeInstanceOf(AbortSignal)
  })

  it('sem linha (usuário novo) → null (vazio legítimo, NÃO erro)', async () => {
    const client = mockSupabase({ session: fakeSession(), from: () => mockQueryBuilder({ data: null, error: null }) })
    expect(await getProfile(client)).toBeNull()
  })

  it('erro do banco → LANÇA (nunca null para erro)', async () => {
    const client = mockSupabase({ session: fakeSession(), from: () => mockQueryBuilder({ data: null, error: new Error('db down') }) })
    await expect(getProfile(client)).rejects.toThrow('db down')
  })

  it('não autenticado → LANÇA', async () => {
    const client = mockSupabase({ session: null })
    await expect(getProfile(client)).rejects.toThrow('Não autenticado')
  })
})

describe('api-client · profile.updateProfile — escrita (whitelist + { error })', () => {
  it('upsert com WHITELIST (id + updated_at + name + phone + age_range + goals) — descarta chaves de outros domínios', async () => {
    const builder = mockQueryBuilder({ data: null, error: null })
    const client = mockSupabase({ session: fakeSession('u9'), from: () => builder })
    // passa chaves extras (fora do contrato) de propósito — devem ser IGNORADAS
    await updateProfile(client, { name: 'Bea', phone: '+5521', age_range: '36-45', goals: ['sono'], pref_daily_reminder: false, cycle_length: 30 } as never)
    const payload = (builder as unknown as { __calls: Record<string, unknown[]> }).__calls.upsert[0] as Record<string, unknown>
    expect(payload).toMatchObject({ id: 'u9', name: 'Bea', phone: '+5521', age_range: '36-45', goals: ['sono'] })
    expect(payload).toHaveProperty('updated_at')
    expect(payload).not.toHaveProperty('cycle_length')
    expect(payload).not.toHaveProperty('pref_daily_reminder')
  })

  it('sucesso → { error: null }', async () => {
    const client = mockSupabase({ session: fakeSession(), from: () => mockQueryBuilder({ data: null, error: null }) })
    expect(await updateProfile(client, { name: 'Ana' })).toEqual({ error: null })
  })

  it('erro do banco → { error } (nunca lança)', async () => {
    const err = new Error('rls')
    const client = mockSupabase({ session: fakeSession(), from: () => mockQueryBuilder({ data: null, error: err }) })
    expect(await updateProfile(client, { name: 'Ana' })).toEqual({ error: err })
  })

  it('rejeição de rede/timeout → { error } (capturado, não lança)', async () => {
    const client = mockSupabase({ session: fakeSession(), from: () => rejectingBuilder(new TimeoutError()) })
    const r = await updateProfile(client, { name: 'Ana' })
    expect(r.error).toBeInstanceOf(TimeoutError)
  })

  it('não autenticado → { error }', async () => {
    const client = mockSupabase({ session: null })
    const r = await updateProfile(client, { name: 'Ana' })
    expect(r.error?.message).toBe('Não autenticado')
  })
})

describe('api-client · profile — contratos e casos extremos', () => {
  const calls = (b: unknown) => (b as { __calls: Record<string, unknown[]> }).__calls

  it('getProfile: mapeia TODOS os campos centrais, preservando nulls', async () => {
    const row = { id: 'u1', name: null, phone: null, age_range: null, goals: null, avatar_url: null, updated_at: null }
    const client = mockSupabase({ session: fakeSession('u1'), from: () => mockQueryBuilder({ data: row, error: null }) })
    expect(await getProfile(client)).toEqual({ id: 'u1', name: null, phone: null, age_range: null, goals: null, avatar_url: null, updated_at: null })
  })

  it('getProfile: linha com CHAVES AUSENTES → DTO com nulls (não undefined)', async () => {
    const client = mockSupabase({ session: fakeSession('u1'), from: () => mockQueryBuilder({ data: { id: 'u1' }, error: null }) })
    const dto = await getProfile(client)
    expect(dto).toEqual({ id: 'u1', name: null, phone: null, age_range: null, goals: null, avatar_url: null, updated_at: null })
  })

  it('getProfile: compõe o signal externo (abortSignal é passado mesmo com signal do chamador)', async () => {
    const builder = mockQueryBuilder({ data: null, error: null })
    const client = mockSupabase({ session: fakeSession('u1'), from: () => builder })
    await getProfile(client, new AbortController().signal)
    expect(calls(builder).abortSignal?.[0]).toBeInstanceOf(AbortSignal)
  })

  it('updateProfile: só NOME → payload tem name, NÃO tem phone', async () => {
    const builder = mockQueryBuilder({ data: null, error: null })
    const client = mockSupabase({ session: fakeSession('u1'), from: () => builder })
    await updateProfile(client, { name: 'Ana' })
    const p = calls(builder).upsert[0] as Record<string, unknown>
    expect(p).toHaveProperty('name', 'Ana')
    expect(p).not.toHaveProperty('phone')
  })

  it('updateProfile: só TELEFONE → payload tem phone, NÃO tem name', async () => {
    const builder = mockQueryBuilder({ data: null, error: null })
    const client = mockSupabase({ session: fakeSession('u1'), from: () => builder })
    await updateProfile(client, { phone: '+5511' })
    const p = calls(builder).upsert[0] as Record<string, unknown>
    expect(p).toHaveProperty('phone', '+5511')
    expect(p).not.toHaveProperty('name')
  })

  it('updateProfile: name:null LIMPA o campo (payload.name === null)', async () => {
    const builder = mockQueryBuilder({ data: null, error: null })
    const client = mockSupabase({ session: fakeSession('u1'), from: () => builder })
    await updateProfile(client, { name: null })
    expect((calls(builder).upsert[0] as Record<string, unknown>).name).toBeNull()
  })

  it('updateProfile: patch VAZIO → payload só com id + updated_at', async () => {
    const builder = mockQueryBuilder({ data: null, error: null })
    const client = mockSupabase({ session: fakeSession('u7'), from: () => builder })
    await updateProfile(client, {})
    const p = calls(builder).upsert[0] as Record<string, unknown>
    expect(Object.keys(p).sort()).toEqual(['id', 'updated_at'])
    expect(p.id).toBe('u7')
  })

  it('updateProfile: string não-Error do Supabase vira Error normalizado', async () => {
    const client = mockSupabase({ session: fakeSession(), from: () => mockQueryBuilder({ data: null, error: 'falha textual' }) })
    const r = await updateProfile(client, { name: 'Ana' })
    expect(r.error).toBeInstanceOf(Error)
    expect(r.error?.message).toBe('falha textual')
  })
})

describe('api-client · withTimeout — composição de signal + timeout (D2)', () => {
  afterEach(() => vi.useRealTimers())

  it('aborta por TIMEOUT após o prazo, com reason TimeoutError', () => {
    vi.useFakeTimers()
    const { signal, cleanup } = withTimeout(undefined, 50)
    expect(signal.aborted).toBe(false)
    vi.advanceTimersByTime(50)
    expect(signal.aborted).toBe(true)
    expect((signal.reason as Error).name).toBe('TimeoutError')
    cleanup()
  })

  it('aborta quando o signal EXTERNO aborta (ex.: hook no unmount)', () => {
    const external = new AbortController()
    const { signal, cleanup } = withTimeout(external.signal, 10_000)
    expect(signal.aborted).toBe(false)
    external.abort(new Error('unmount'))
    expect(signal.aborted).toBe(true)
    cleanup()
  })

  it('se o signal externo JÁ nasce abortado, o resultante já vem abortado (unmount antes da chamada)', () => {
    const external = new AbortController()
    external.abort(new Error('já cancelado'))
    const { signal, cleanup } = withTimeout(external.signal, 10_000)
    expect(signal.aborted).toBe(true)
    cleanup()
  })

  it('cleanup limpa o timer — não aborta depois de finalizado', () => {
    vi.useFakeTimers()
    const { signal, cleanup } = withTimeout(undefined, 50)
    cleanup()
    vi.advanceTimersByTime(1000)
    expect(signal.aborted).toBe(false)
  })

  it('DEFAULT_TIMEOUT_MS é 10s', () => {
    expect(DEFAULT_TIMEOUT_MS).toBe(10_000)
  })
})

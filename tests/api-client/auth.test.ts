// Cobertura retroativa do DOMÍNIO de autenticação (Inc 1, já entregue) — corrige o déficit "api-client sem testes".
// Testa as funções puras de domínio com o cliente Supabase mockado (harness compartilhado).
import { describe, it, expect, vi } from 'vitest'
import { signIn } from '../../packages/api-client/src/auth/login'
import { signOut } from '../../packages/api-client/src/auth/logout'
import { getSession, onAuthStateChange } from '../../packages/api-client/src/auth/session'
import { mockSupabase, fakeSession } from './supabaseMock'

describe('api-client · auth — contrato de domínio', () => {
  it('signIn devolve { session, error } vindos do Supabase (sucesso)', async () => {
    const session = fakeSession()
    const client = mockSupabase({ signInResult: { data: { session }, error: null } })
    const r = await signIn(client, 'a@b.com', 'senha')
    expect(r.session).toBe(session)
    expect(r.error).toBeNull()
    expect(client.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'a@b.com', password: 'senha' })
  })

  it('signIn propaga o erro do Supabase (credenciais inválidas)', async () => {
    const err = new Error('Invalid login credentials')
    const client = mockSupabase({ signInResult: { data: { session: null }, error: err } })
    const r = await signIn(client, 'a@b.com', 'errada')
    expect(r.session).toBeNull()
    expect(r.error).toBe(err)
  })

  it('signOut devolve { error } (sucesso = null)', async () => {
    const client = mockSupabase()
    expect(await signOut(client)).toEqual({ error: null })
    expect(client.auth.signOut).toHaveBeenCalledOnce()
  })

  it('signOut propaga o erro do Supabase', async () => {
    const err = new Error('network')
    const client = mockSupabase({ signOutError: err })
    expect(await signOut(client)).toEqual({ error: err })
  })

  it('getSession devolve a sessão persistida (ou null)', async () => {
    const session = fakeSession()
    expect(await getSession(mockSupabase({ session }))).toBe(session)
    expect(await getSession(mockSupabase({ session: null }))).toBeNull()
  })

  it('onAuthStateChange registra o listener e devolve a função de cancelamento (unsubscribe)', () => {
    const client = mockSupabase()
    const listener = vi.fn()
    const off = onAuthStateChange(client, listener)
    expect(client.auth.onAuthStateChange).toHaveBeenCalledOnce()
    expect(off).toBeTypeOf('function')
    off()
    expect(client.__unsubscribe).toHaveBeenCalledOnce()
  })
})

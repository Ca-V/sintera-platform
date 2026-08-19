// FUNC · SEC-006 — regressão do contrato de validação de entrada em rotas NÃO-CLÍNICAS. Fixa o comportamento
// existente (401/400/sucesso) para as rotas onde o helper foi (events, feedback) ou pode ser adotado. Preserva
// contrato: mesmas mensagens e status. Supabase mockado; sem dados reais, sem rede, sem produção.
import { describe, it, expect, vi, beforeEach } from 'vitest'

const h = vi.hoisted(() => ({
  user: null as { id: string } | null,
  from: (() => ({})) as (t: string) => unknown,
  admin: null as unknown,
  isKnown: (() => false) as (s: string) => boolean,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: h.user }, error: null }) },
    from: (t: string) => h.from(t),
  }),
}))
vi.mock('@supabase/supabase-js', () => ({ createClient: () => h.admin }))
vi.mock('@/lib/connectors/runtime.server', () => ({ adminClient: () => ({}) }))
vi.mock('@/lib/novelty/novelty', () => ({ isKnownStream: (s: string) => h.isKnown(s), markSeen: async () => ({}) }))

import { POST as eventsPOST } from '@/app/api/events/route'
import { POST as feedbackPOST } from '@/app/api/feedback/route'
import { POST as waitlistPOST } from '@/app/api/waitlist/route'
import { POST as noveltySeenPOST } from '@/app/api/novelty/seen/route'

const req = (payload: unknown) => ({ json: async () => payload }) as never
const reqThrows = () => ({ json: async () => { throw new Error('parse') } }) as never
const writable = () => ({ insert: async () => ({}), upsert: async () => ({}) })

beforeEach(() => { h.user = null; h.from = () => writable(); h.admin = null; h.isKnown = () => false })

describe('SEC-006 · events (migrado ao helper) — contrato preservado', () => {
  it('sem sessão → 401 "Nao autenticado"', async () => {
    const res = await eventsPOST(req({ event_name: 'x' }))
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Nao autenticado' })
  })
  it('event_name ausente/vazio → 400 (mensagem preservada)', async () => {
    h.user = { id: 'u1' }
    for (const body of [{}, { event_name: '' }, { event_name: 0 }]) {
      const res = await eventsPOST(req(body))
      expect(res.status).toBe(400)
      expect(await res.json()).toEqual({ error: 'Campo obrigatorio: event_name' })
    }
  })
  it('event_name presente → 200', async () => {
    h.user = { id: 'u1' }
    const res = await eventsPOST(req({ event_name: 'opened', metadata: { a: 1 } }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
  })
})

describe('SEC-006 · feedback (migrado ao helper) — contrato preservado', () => {
  it('sem sessão → 401', async () => {
    expect((await feedbackPOST(req({ comprehension: 5, trust: 5 }))).status).toBe(401)
  })
  it('comprehension/trust ausente → 400 (mensagem preservada)', async () => {
    h.user = { id: 'u1' }
    for (const body of [{}, { comprehension: 5 }, { trust: 5 }, { comprehension: 0, trust: 5 }]) {
      const res = await feedbackPOST(req(body))
      expect(res.status).toBe(400)
      expect(await res.json()).toEqual({ error: 'Campos obrigatorios: comprehension, trust' })
    }
  })
  it('campos presentes → 200', async () => {
    h.user = { id: 'u1' }
    const res = await feedbackPOST(req({ comprehension: 5, trust: 4 }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
  })
})

describe('SEC-006 · waitlist (não migrado — validação idiossincrática pinada)', () => {
  it('e-mail inválido → 400 "E-mail inválido"', async () => {
    const res = await waitlistPOST(req({ name: 'Ana', email: 'sem-arroba' }))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'E-mail inválido' })
  })
  it('nome curto → 400 "Nome obrigatório"', async () => {
    const res = await waitlistPOST(req({ name: 'A', email: 'a@b.com' }))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Nome obrigatório' })
  })
  it('válido → ok (admin mockado)', async () => {
    const prevKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const prevUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    h.admin = {
      from: () => ({
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }),
        insert: async () => ({ error: null }),
      }),
    }
    try {
      const res = await waitlistPOST(req({ name: 'Ana', email: 'ANA@b.com' }))
      expect(res.status).toBe(200)
      expect(await res.json()).toEqual({ ok: true, already: false })
    } finally {
      process.env.SUPABASE_SERVICE_ROLE_KEY = prevKey
      process.env.NEXT_PUBLIC_SUPABASE_URL = prevUrl
    }
  })
})

describe('SEC-006 · novelty/seen (não migrado — parse idiossincrático pinado)', () => {
  it('sem sessão → 401', async () => {
    expect((await noveltySeenPOST(req({ stream: 'x' }))).status).toBe(401)
  })
  it('corpo não parseável → 400 "Corpo inválido"', async () => {
    h.user = { id: 'u1' }
    const res = await noveltySeenPOST(reqThrows())
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Corpo inválido' })
  })
  it('stream desconhecido → 400 "Fluxo desconhecido"', async () => {
    h.user = { id: 'u1' }; h.isKnown = () => false
    const res = await noveltySeenPOST(req({ stream: 'inexistente' }))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Fluxo desconhecido' })
  })
  it('stream conhecido → 200', async () => {
    h.user = { id: 'u1' }; h.isKnown = () => true
    const res = await noveltySeenPOST(req({ stream: 'conhecido' }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
  })
})

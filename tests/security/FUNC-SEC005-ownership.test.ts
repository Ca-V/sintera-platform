// FUNC · SEC-005 — Autorização em nível de objeto (BOLA), comportamental. Com um Supabase MOCKADO, prova:
//  (1) sem sessão → 401;  (2) objeto que NÃO pertence à usuária → 404 (não vaza o objeto de outra usuária).
// Também cobre a preservação de comportamento da validação SEC-006 na rota de feedback.
// Sem dados reais, sem rede, sem produção — apenas o handler + mock.
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Controla o cliente Supabase retornado por createClient (hoisted para o factory do vi.mock).
const h = vi.hoisted(() => ({ client: null as unknown }))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => h.client }))

import { POST as feedbackPOST } from '@/app/api/insights/[id]/feedback/route'
import { DELETE as examsDELETE } from '@/app/api/exams/[id]/route'

// Query encadeável mínima: select().eq().eq().maybeSingle() e upsert().
function query(result: { data: unknown }) {
  const q: Record<string, unknown> = {}
  q.select = () => q
  q.eq = () => q
  q.maybeSingle = async () => result
  q.upsert = async () => ({ error: null })
  return q
}

function client(opts: { user: { id: string } | null; rows?: Record<string, { data: unknown }> }) {
  return {
    auth: { getUser: async () => ({ data: { user: opts.user }, error: null }) },
    from: (table: string) => query(opts.rows?.[table] ?? { data: null }),
  }
}

const params = (id: string) => ({ params: Promise.resolve({ id }) })
const jsonReq = (payload: unknown) => ({ json: async () => payload }) as never

beforeEach(() => { h.client = null })

describe('SEC-005 · feedback de insight — object-level authorization', () => {
  it('sem sessão → 401', async () => {
    h.client = client({ user: null })
    const res = await feedbackPOST(jsonReq({ rating: 'util' }), params('insight-de-outra'))
    expect(res.status).toBe(401)
  })

  it('insight de OUTRA usuária (não encontrado no escopo) → 404, sem vazar o objeto', async () => {
    // user autenticado, mas a query escopada por user_id não acha o objeto → data: null.
    h.client = client({ user: { id: 'user-A' }, rows: { ai_insights: { data: null } } })
    const res = await feedbackPOST(jsonReq({ rating: 'util' }), params('insight-de-B'))
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Insight não encontrado.' })
  })

  it('objeto próprio + rating válido → 200 (upsert)', async () => {
    h.client = client({ user: { id: 'user-A' }, rows: { ai_insights: { data: { id: 'i1', template_key: 'k' } } } })
    const res = await feedbackPOST(jsonReq({ rating: 'nao_util' }), params('i1'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
  })

  // SEC-006 · comportamento de validação preservado após o refactor para o helper.
  it('rating inválido → 400 com a MESMA mensagem de antes', async () => {
    h.client = client({ user: { id: 'user-A' }, rows: { ai_insights: { data: { id: 'i1', template_key: 'k' } } } })
    const res = await feedbackPOST(jsonReq({ rating: 'talvez' }), params('i1'))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: "rating deve ser 'util' ou 'nao_util'." })
  })

  it('corpo não-objeto → 400 "Corpo inválido."', async () => {
    h.client = client({ user: { id: 'user-A' } })
    const res = await feedbackPOST(jsonReq(null), params('i1'))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Corpo inválido.' })
  })
})

describe('SEC-005 · exclusão de exame — object-level authorization', () => {
  it('sem sessão → 401', async () => {
    h.client = client({ user: null })
    const res = await examsDELETE({} as never, params('exame-de-outra'))
    expect(res.status).toBe(401)
  })

  it('exame de OUTRA usuária (não encontrado no escopo) → 404, sem excluir nem vazar', async () => {
    h.client = client({ user: { id: 'user-A' }, rows: { exams: { data: null } } })
    const res = await examsDELETE({} as never, params('exame-de-B'))
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Exame não encontrado.' })
  })
})

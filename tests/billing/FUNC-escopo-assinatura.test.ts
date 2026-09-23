// FUNC · BILLING-003 §2.1 — uma pessoa tem DUAS assinaturas, e cada leitura pega a certa.
//
// A migração 116 criou `subscriptions` com user_id como chave primária: uma assinatura por pessoa. O modelo
// de negócio exige o contrário — a nutricionista assina o Evolução para a própria saúde e o Inteligência da
// Prática para a carteira. A migração 156 abre espaço para as duas; este teste prova que a leitura as
// distingue.
//
// SEM O RECORTE POR ESCOPO o defeito seria silencioso e caro: `maybeSingle()` sobre duas linhas devolve erro,
// o `catch` cai em FREE, e a pessoa que paga os dois planos perde os dois — sem nenhuma mensagem dizendo por
// quê. É a família "degradação silenciosa" outra vez.

import { describe, it, expect } from 'vitest'
import { loadEntitlements } from '@sintera/api-client'

const PLANO_PESSOAL = { entitlements: { features: ['extracao.exames'], limits: { profissionais: 3 }, modules: ['exames'] } }
const PLANO_PROF = { entitlements: { features: ['prof.painel_carteira'], limits: {}, modules: ['profissional'] } }

/** Supabase de mentira que registra o que foi filtrado e responde conforme o escopo pedido. */
function supabaseFake(linhas: Record<string, { plan_id: string; status: string }>) {
  const filtros: Record<string, string> = {}
  const chain: Record<string, unknown> = {}
  Object.assign(chain, {
    select: () => chain,
    eq: (col: string, val: string) => { filtros[col] = val; return chain },
    maybeSingle: async () => ({ data: linhas[filtros.escopo] ?? null }),
  })
  return {
    filtros,
    from(tabela: string) {
      if (tabela === 'billing_plans') {
        const porPlano: Record<string, unknown> = { evolucao: PLANO_PESSOAL, prof_inteligencia: PLANO_PROF }
        const p: Record<string, unknown> = {}
        Object.assign(p, {
          select: () => p,
          eq: (_c: string, id: string) => { (p as { _id?: string })._id = id; return p },
          maybeSingle: async () => ({ data: porPlano[(p as { _id?: string })._id ?? ''] ?? null }),
        })
        return p
      }
      return chain
    },
  }
}

const AS_DUAS = {
  pessoal: { plan_id: 'evolucao', status: 'active' },
  profissional: { plan_id: 'prof_inteligencia', status: 'active' },
}

describe('BILLING-003 · duas assinaturas para a mesma pessoa', () => {
  it('o escopo pessoal devolve o plano da pessoa, nunca o da prática', async () => {
    const db = supabaseFake(AS_DUAS)
    const e = await loadEntitlements(db, 'u1', 'pessoal')
    expect(e.plan).toBe('evolucao')
    expect(e.can('extracao.exames')).toBe(true)
    expect(e.can('prof.painel_carteira'), 'nao pode vazar permissao profissional para o perfil pessoal').toBe(false)
    expect(e.limit('profissionais')).toBe(3)
  })

  it('o escopo profissional devolve o plano da prática, nunca o da pessoa', async () => {
    const db = supabaseFake(AS_DUAS)
    const e = await loadEntitlements(db, 'u1', 'profissional')
    expect(e.plan).toBe('prof_inteligencia')
    expect(e.can('prof.painel_carteira')).toBe(true)
    expect(e.can('extracao.exames'), 'nao pode vazar permissao pessoal para o perfil profissional').toBe(false)
  })

  it('sem escopo explícito, lê o pessoal — é o que toda chamada existente significa', async () => {
    const db = supabaseFake(AS_DUAS)
    const e = await loadEntitlements(db, 'u1')
    expect(e.plan).toBe('evolucao')
    expect(db.filtros.escopo).toBe('pessoal')
  })

  it('a consulta filtra por user_id E por escopo — sem os dois, maybeSingle quebraria', async () => {
    const db = supabaseFake(AS_DUAS)
    await loadEntitlements(db, 'u1', 'profissional')
    expect(db.filtros.user_id).toBe('u1')
    expect(db.filtros.escopo).toBe('profissional')
  })

  it('quem só tem a assinatura pessoal cai em FREE no perfil profissional, sem quebrar', async () => {
    const db = supabaseFake({ pessoal: AS_DUAS.pessoal })
    const e = await loadEntitlements(db, 'u1', 'profissional')
    expect(e.plan).toBe('free')
    expect(e.active).toBe(false)
  })
})

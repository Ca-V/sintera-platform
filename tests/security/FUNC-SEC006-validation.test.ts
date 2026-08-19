// FUNC · SEC-006 — validação de schema de entrada (helper puro). Prova rejeição de payloads inválidos
// com mensagem acionável e aceitação dos válidos. Sem dados reais, sem rede, sem produção.
import { describe, it, expect } from 'vitest'
import {
  readJsonObject,
  requireString,
  requireEnum,
  requireIntInRange,
  badRequest,
} from '@/lib/api/validate'

const req = (payload: unknown) => ({ json: async () => payload })
const reqThrows = () => ({ json: async () => { throw new Error('parse') } })

describe('SEC-006 · readJsonObject', () => {
  it('aceita objeto JSON', async () => {
    const r = await readJsonObject(req({ a: 1 }))
    expect(r).toEqual({ ok: true, value: { a: 1 } })
  })
  it('rejeita array, null e primitivos', async () => {
    for (const bad of [[1, 2], null, 'x', 42, true]) {
      const r = await readJsonObject(req(bad))
      expect(r.ok).toBe(false)
    }
  })
  it('rejeita corpo não parseável (mensagem acionável)', async () => {
    const r = await readJsonObject(reqThrows(), 'Corpo inválido.')
    expect(r).toEqual({ ok: false, error: 'Corpo inválido.' })
  })
})

describe('SEC-006 · requireString', () => {
  it('aceita string não vazia', () => {
    expect(requireString({ name: 'Ana' }, 'name')).toEqual({ ok: true, value: 'Ana' })
  })
  it('rejeita ausente, vazio, só espaços e não-string', () => {
    expect(requireString({}, 'name').ok).toBe(false)
    expect(requireString({ name: '' }, 'name').ok).toBe(false)
    expect(requireString({ name: '   ' }, 'name').ok).toBe(false)
    expect(requireString({ name: 5 }, 'name').ok).toBe(false)
  })
})

describe('SEC-006 · requireEnum', () => {
  const ALLOWED = new Set(['util', 'nao_util'])
  it('aceita valor no allowlist', () => {
    expect(requireEnum({ rating: 'util' }, 'rating', ALLOWED)).toEqual({ ok: true, value: 'util' })
  })
  it('rejeita fora do allowlist com mensagem customizada', () => {
    const r = requireEnum({ rating: 'x' }, 'rating', ALLOWED, "rating deve ser 'util' ou 'nao_util'.")
    expect(r).toEqual({ ok: false, error: "rating deve ser 'util' ou 'nao_util'." })
  })
  it('aceita também array como allowlist', () => {
    expect(requireEnum({ k: 'a' }, 'k', ['a', 'b']).ok).toBe(true)
  })
})

describe('SEC-006 · requireIntInRange', () => {
  it('aceita inteiro dentro do intervalo', () => {
    expect(requireIntInRange({ n: 10 }, 'n', 1, 20)).toEqual({ ok: true, value: 10 })
  })
  it('rejeita fora do intervalo, não-inteiro e não-número', () => {
    expect(requireIntInRange({ n: 0 }, 'n', 1, 20).ok).toBe(false)
    expect(requireIntInRange({ n: 21 }, 'n', 1, 20).ok).toBe(false)
    expect(requireIntInRange({ n: 3.5 }, 'n', 1, 20).ok).toBe(false)
    expect(requireIntInRange({ n: '5' }, 'n', 1, 20).ok).toBe(false)
    expect(requireIntInRange({ n: NaN }, 'n', 1, 20).ok).toBe(false)
  })
})

describe('SEC-006 · badRequest', () => {
  it('responde 400 com { error } por padrão', async () => {
    const res = badRequest('Corpo inválido.')
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Corpo inválido.' })
  })
  it('aceita status customizado', () => {
    expect(badRequest('x', 422).status).toBe(422)
  })
})

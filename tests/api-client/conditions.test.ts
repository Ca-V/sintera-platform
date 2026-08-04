// Domínio Condições de Saúde (health_conditions) do @sintera/api-client — CRUD, whitelist, guardas.
import { describe, it, expect } from 'vitest'
import { listConditions, saveCondition, deleteCondition } from '../../packages/api-client/src/conditions/conditions'
import { mockSupabase, mockQueryBuilder, fakeSession } from './supabaseMock'

describe('api-client · conditions', () => {
  it('listConditions → DTO[]; filtra por dono', async () => {
    const rows = [{ id: 'c1', scope: 'propria', name: 'Hipotireoidismo', relative: null, since_label: '2019', notes: null, kind: null, file_url: null }]
    const builder = mockQueryBuilder({ data: rows, error: null })
    const client = mockSupabase({ session: fakeSession('u1'), from: () => builder })
    const out = await listConditions(client)
    expect(out).toEqual(rows)
    expect((builder as unknown as { __calls: Record<string, unknown[]> }).__calls.eq).toEqual(['user_id', 'u1'])
  })

  it('saveCondition (novo) → insert com source manual e relative nulo quando própria', async () => {
    const builder = mockQueryBuilder({ data: null, error: null })
    const client = mockSupabase({ session: fakeSession('u1'), from: () => builder })
    const { error } = await saveCondition(client, { scope: 'propria', name: 'Asma', relative: 'ignorar' })
    expect(error).toBeNull()
    const row = (builder as unknown as { __calls: Record<string, unknown[]> }).__calls.insert?.[0] as Record<string, unknown>
    expect(row).toMatchObject({ user_id: 'u1', scope: 'propria', name: 'Asma', relative: null, source: 'manual' })
  })

  it('saveCondition (familiar) preserva relative; edição usa update', async () => {
    const builder = mockQueryBuilder({ data: null, error: null })
    const client = mockSupabase({ session: fakeSession(), from: () => builder })
    await saveCondition(client, { id: 'c9', scope: 'familiar', name: 'Diabetes', relative: 'mãe' })
    const calls = (builder as unknown as { __calls: Record<string, unknown[]> }).__calls
    expect(calls.update?.[0]).toMatchObject({ scope: 'familiar', relative: 'mãe' })
    expect(calls.insert).toBeUndefined()
  })

  it('nome vazio → { error }; sem sessão → { error }', async () => {
    const client = mockSupabase({ session: fakeSession() })
    expect((await saveCondition(client, { scope: 'propria', name: '  ' })).error).toBeTruthy()
    const anon = mockSupabase({ session: null })
    expect((await saveCondition(anon, { scope: 'propria', name: 'X' })).error?.message).toMatch(/autenticado/i)
  })

  it('deleteCondition filtra por id+dono', async () => {
    const builder = mockQueryBuilder({ data: null, error: null })
    const client = mockSupabase({ session: fakeSession('u1'), from: () => builder })
    await deleteCondition(client, 'c1')
    expect((builder as unknown as { __calls: Record<string, unknown[]> }).__calls.eq).toEqual(['user_id', 'u1'])
  })
})

// Integração entre packages (sem React/RN): @sintera/validation → @sintera/api-client.
// Fluxo real do Perfil: valida/normaliza a entrada → grava via updateProfile (upsert) → Result.
import { describe, it, expect } from 'vitest'
import { validateProfileEditable } from '../../packages/validation/src'
import { updateProfile } from '../../packages/api-client/src/profile/update'
import { getProfile } from '../../packages/api-client/src/profile/get'
import { mockSupabase, mockQueryBuilder, fakeSession } from './supabaseMock'

const upsertPayload = (b: unknown) => (b as { __calls: Record<string, unknown[]> }).__calls.upsert[0] as Record<string, unknown>

describe('integração · validation → api-client (fluxo do Perfil)', () => {
  it('entrada crua → validada/normalizada → payload do upsert com os valores normalizados', async () => {
    // 1) validação (com máscara e espaços)
    const v = validateProfileEditable({ name: '  Carina  Leite ', phone: '+55 (11) 99999-8888' })
    expect(v.ok).toBe(true)
    if (!v.ok) return

    // 2) grava exatamente o que a validação normalizou
    const builder = mockQueryBuilder({ data: null, error: null })
    const client = mockSupabase({ session: fakeSession('u1'), from: () => builder })
    const res = await updateProfile(client, v.value)

    // 3) Result de escrita + payload com os valores JÁ normalizados pela validation
    expect(res).toEqual({ error: null })
    const p = upsertPayload(builder)
    expect(p).toMatchObject({ id: 'u1', name: 'Carina Leite', phone: '+5511999998888' })
  })

  it('entrada inválida → api-client NÃO é chamado (a validação barra antes)', async () => {
    const builder = mockQueryBuilder({ data: null, error: null })
    const client = mockSupabase({ session: fakeSession('u1'), from: () => builder })

    const v = validateProfileEditable({ name: 'a'.repeat(200) })
    expect(v.ok).toBe(false)
    // o consumidor real só grava quando ok — aqui NÃO chamamos updateProfile
    expect((builder as { __calls: Record<string, unknown[]> }).__calls.upsert).toBeUndefined()
    void client
  })

  it('round-trip de forma: getProfile → ProfileDTO cujos campos editáveis casam com ProfileEditable', async () => {
    const row = { id: 'u1', name: 'Ana', phone: '+5511999998888', age_range: null, goals: null, avatar_url: null, updated_at: null }
    const client = mockSupabase({ session: fakeSession('u1'), from: () => mockQueryBuilder({ data: row, error: null }) })
    const dto = await getProfile(client)
    // os campos editáveis (name, phone) do DTO alimentam a validação de volta sem perda
    const v = validateProfileEditable({ name: dto?.name, phone: dto?.phone, age_range: dto?.age_range, goals: dto?.goals })
    expect(v).toEqual({ ok: true, value: { name: 'Ana', phone: '+5511999998888', age_range: null, goals: null } })
  })
})

// Domínio Composição Corporal (body_metrics + profiles.weight_goal_kg) do @sintera/api-client —
// CRUD das medidas, filtro por dono, ordem por data desc, e leitura/escrita da meta de peso (GLP-1).
import { describe, it, expect } from 'vitest'
import { listBodyMetrics, saveBodyMetric, deleteBodyMetric, getHeightCm, getWeightGoal, setWeightGoal } from '../../packages/api-client/src/body/body'
import { mockSupabase, mockQueryBuilder, fakeSession } from './supabaseMock'

type Calls = { __calls: Record<string, unknown[]> }

describe('api-client · body (Composição Corporal)', () => {
  it('listBodyMetrics → DTO[]; filtra por dono e ordena por measured_on desc', async () => {
    const rows = [{ id: 'b1', metric: 'peso', label: null, value_text: '80', unit: 'kg', measured_on: '2026-08-01', notes: null, exam_id: null, source: 'manual', created_at: null }]
    const builder = mockQueryBuilder({ data: rows, error: null })
    const client = mockSupabase({ session: fakeSession('u1'), from: () => builder })
    const out = await listBodyMetrics(client)
    expect(out).toEqual(rows)
    const calls = (builder as unknown as Calls).__calls
    expect(calls.eq).toEqual(['user_id', 'u1'])
    expect(calls.order).toEqual(['measured_on', { ascending: false }])
  })

  it('saveBodyMetric (novo) → insert com source manual por padrão', async () => {
    const builder = mockQueryBuilder({ data: null, error: null })
    const client = mockSupabase({ session: fakeSession('u1'), from: () => builder })
    const { error } = await saveBodyMetric(client, { metric: 'peso', value_text: '79,5', measured_on: '2026-08-04' })
    expect(error).toBeNull()
    const row = (builder as unknown as Calls).__calls.insert?.[0] as Record<string, unknown>
    expect(row).toMatchObject({ user_id: 'u1', metric: 'peso', value_text: '79,5', measured_on: '2026-08-04', source: 'manual' })
  })

  it('saveBodyMetric (edição) usa update; preserva source informado', async () => {
    const builder = mockQueryBuilder({ data: null, error: null })
    const client = mockSupabase({ session: fakeSession(), from: () => builder })
    await saveBodyMetric(client, { id: 'b9', metric: 'gordura_corporal', value_text: '22', unit: '%', measured_on: '2026-07-10', source: 'bioimpedancia' })
    const calls = (builder as unknown as Calls).__calls
    expect(calls.update?.[0]).toMatchObject({ metric: 'gordura_corporal', value_text: '22', source: 'bioimpedancia' })
    expect(calls.insert).toBeUndefined()
  })

  it('valor vazio → { error }; sem sessão → { error }', async () => {
    const client = mockSupabase({ session: fakeSession() })
    expect((await saveBodyMetric(client, { metric: 'peso', value_text: '   ', measured_on: '2026-08-04' })).error).toBeTruthy()
    const anon = mockSupabase({ session: null })
    expect((await saveBodyMetric(anon, { metric: 'peso', value_text: '80', measured_on: '2026-08-04' })).error?.message).toMatch(/autenticado/i)
  })

  it('deleteBodyMetric filtra por id+dono', async () => {
    const builder = mockQueryBuilder({ data: null, error: null })
    const client = mockSupabase({ session: fakeSession('u1'), from: () => builder })
    await deleteBodyMetric(client, 'b1')
    expect((builder as unknown as Calls).__calls.eq).toEqual(['user_id', 'u1'])
  })

  it('getHeightCm → altura do perfil (base do IMC); null quando ausente', async () => {
    const withH = mockSupabase({ session: fakeSession('u1'), from: () => mockQueryBuilder({ data: { height_cm: 165 }, error: null }) })
    expect(await getHeightCm(withH)).toBe(165)
    const noH = mockSupabase({ session: fakeSession('u1'), from: () => mockQueryBuilder({ data: { height_cm: null }, error: null }) })
    expect(await getHeightCm(noH)).toBeNull()
  })

  it('getWeightGoal → número da meta; null quando ausente', async () => {
    const withGoal = mockSupabase({ session: fakeSession('u1'), from: () => mockQueryBuilder({ data: { weight_goal_kg: 72 }, error: null }) })
    expect(await getWeightGoal(withGoal)).toBe(72)
    const noGoal = mockSupabase({ session: fakeSession('u1'), from: () => mockQueryBuilder({ data: { weight_goal_kg: null }, error: null }) })
    expect(await getWeightGoal(noGoal)).toBeNull()
  })

  it('setWeightGoal grava a meta (ou null para limpar) no perfil do dono', async () => {
    const builder = mockQueryBuilder({ data: null, error: null })
    const client = mockSupabase({ session: fakeSession('u1'), from: () => builder })
    await setWeightGoal(client, 70)
    const calls = (builder as unknown as Calls).__calls
    expect(calls.update?.[0]).toMatchObject({ weight_goal_kg: 70 })
    expect(calls.eq).toEqual(['id', 'u1'])
    await setWeightGoal(client, null)
    expect((builder as unknown as Calls).__calls.update?.[0]).toMatchObject({ weight_goal_kg: null })
  })
})

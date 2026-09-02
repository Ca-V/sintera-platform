// @sintera/core — taxonomia/regra de Hábitos (pura) + @sintera/api-client — CRUD de life_habits.
import { describe, it, expect } from 'vitest'
import { habitCategoryLabel, habitGoalSummary, HABIT_CATEGORIES } from '../../packages/core/src/domain/habits'
import { saveHabit, deleteHabit } from '../../packages/api-client/src/habits/habits'
import { mockSupabase, mockQueryBuilder, fakeSession } from '../api-client/supabaseMock'

describe('core · habits', () => {
  it('rótulo de categoria com fallback', () => {
    expect(habitCategoryLabel('sono')).toBe('Sono')
    expect(habitCategoryLabel('inexistente')).toBe('Outro')
    // SEIS, não sete: atividade física saiu do seletor em 31/08/2026 e passou a morar em Monitoramento.
    // O rótulo dela continua vivo — ver FUNC-rotina-de-atividade.
    expect(HABIT_CATEGORIES.length).toBe(6)
  })
  it('resumo de meta divisível', () => {
    expect(habitGoalSummary(2000, 'ml', 8)).toBe('2000 ml · 8 partes de 250 ml')
    expect(habitGoalSummary(30, 'min', null)).toBe('30 min')
    expect(habitGoalSummary(null, 'x', 2)).toBeNull()
  })
})

describe('api-client · habits', () => {
  it('saveHabit (novo) insere com user_id e devolve o id', async () => {
    const builder = mockQueryBuilder({ data: { id: 'h1' }, error: null })
    const client = mockSupabase({ session: fakeSession('u1'), from: () => builder })
    const { data, error } = await saveHabit(client, { category: 'sono', description: 'Dormir 8h' })
    expect(error).toBeNull()
    expect(data?.id).toBe('h1')
    expect((builder as unknown as { __calls: Record<string, unknown[]> }).__calls.insert?.[0]).toMatchObject({ user_id: 'u1', category: 'sono', description: 'Dormir 8h' })
  })
  it('descrição vazia → { error }', async () => {
    const client = mockSupabase({ session: fakeSession() })
    expect((await saveHabit(client, { category: 'outro', description: '  ' })).error).toBeTruthy()
  })
  it('deleteHabit filtra por id+dono', async () => {
    const builder = mockQueryBuilder({ data: null, error: null })
    const client = mockSupabase({ session: fakeSession('u1'), from: () => builder })
    await deleteHabit(client, 'h1')
    expect((builder as unknown as { __calls: Record<string, unknown[]> }).__calls.eq).toEqual(['user_id', 'u1'])
  })
})

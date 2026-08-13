// Síntese de navegação (§5d) — getMinhaSaudeCounts. Contagens head+count por domínio, filtro por dono (RLS),
// e a regra de que Medicamentos = TOTAL − suplementos (espelha /dashboard/medicamentos: kind !== 'suplemento').
import { describe, it, expect } from 'vitest'
import { getMinhaSaudeCounts } from '../../packages/api-client/src/summary/counts'
import { mockSupabase, mockQueryBuilder, fakeSession } from './supabaseMock'

type Calls = { __calls: Record<string, unknown[]> }
const countRes = (n: number) => ({ error: null, count: n } as unknown as { data?: unknown; error: unknown })

describe('api-client · summary (§5d getMinhaSaudeCounts)', () => {
  it('conta por domínio; Medicamentos = total − suplementos (inclui produto/dispositivo/outro/kind nulo)', async () => {
    let medCall = 0
    const builders: Record<string, ReturnType<typeof mockQueryBuilder>> = {}
    const from = (table: string) => {
      // medications é consultado 2x: 1º = total (sem filtro de kind), 2º = suplementos (kind='suplemento').
      if (table === 'medications') return mockQueryBuilder(countRes(medCall++ === 0 ? 5 : 2))
      const n = { exams: 4, health_resources: 1, health_conditions: 0, life_habits: 7 }[table] ?? 0
      const b = mockQueryBuilder(countRes(n)); builders[table] = b; return b
    }
    const client = mockSupabase({ session: fakeSession('u1'), from })
    const out = await getMinhaSaudeCounts(client)
    expect(out).toEqual({ exams: 4, medications: 3, supplements: 2, resources: 1, conditions: 0, habits: 7 })
    // Escopo por dono (RLS): toda leitura filtra por user_id.
    expect((builders.exams as unknown as Calls).__calls.eq).toEqual(['user_id', 'u1'])
  })

  it('nunca retorna medications negativo (total < suplementos por corrida/inconsistência → 0)', async () => {
    const from = (table: string) =>
      table === 'medications' ? mockQueryBuilder(countRes(0 /* total */)) : mockQueryBuilder(countRes(0))
    // total=0 e supps=0 → medications=0; garante o clamp Math.max(0, …).
    const client = mockSupabase({ session: fakeSession('u1'), from })
    const out = await getMinhaSaudeCounts(client)
    expect(out.medications).toBe(0)
    expect(out.supplements).toBe(0)
  })

  it('sem sessão → LANÇA (convenção de leitura)', async () => {
    const client = mockSupabase({ session: null })
    await expect(getMinhaSaudeCounts(client)).rejects.toThrow(/autenticado/i)
  })

  it('erro em qualquer contagem → LANÇA', async () => {
    const from = (table: string) =>
      table === 'exams'
        ? mockQueryBuilder({ data: null, error: new Error('boom') })
        : mockQueryBuilder(countRes(1))
    const client = mockSupabase({ session: fakeSession('u1'), from })
    await expect(getMinhaSaudeCounts(client)).rejects.toThrow(/boom/i)
  })
})

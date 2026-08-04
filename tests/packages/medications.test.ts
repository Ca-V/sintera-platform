// @sintera/core — taxonomia/estimativa de Medicamentos (pura) + @sintera/api-client — CRUD de medications.
import { describe, it, expect } from 'vitest'
import { medKindLabel, medFormUnit, estimatedRunoutDays, MED_KINDS, MED_FORMS } from '../../packages/core/src/domain/medications'
import { saveMedication, deleteMedication } from '../../packages/api-client/src/medications/medications'
import { mockSupabase, mockQueryBuilder, fakeSession } from '../api-client/supabaseMock'

describe('core · medications', () => {
  it('rótulos + unidade da forma', () => {
    expect(medKindLabel('suplemento')).toBe('Suplemento')
    expect(medFormUnit('comprimido')).toBe('comprimidos')
    expect(MED_KINDS.length).toBe(5)
    expect(MED_FORMS.length).toBe(17)
  })
  it('estimativa de dias de estoque', () => {
    expect(estimatedRunoutDays(60, 2)).toBe(30)
    expect(estimatedRunoutDays(60, 0)).toBeNull()
    expect(estimatedRunoutDays(null, 2)).toBeNull()
  })
})

describe('api-client · medications', () => {
  it('saveMedication (novo) insere com user_id, zera repurchase_frequency se sem lembrete', async () => {
    const builder = mockQueryBuilder({ data: { id: 'm1' }, error: null })
    const client = mockSupabase({ session: fakeSession('u1'), from: () => builder })
    const { data, error } = await saveMedication(client, { name: 'Losartana', kind: 'medicamento', status: 'em_uso', repurchase_reminder: false, repurchase_frequency: 'monthly' })
    expect(error).toBeNull(); expect(data?.id).toBe('m1')
    const row = (builder as unknown as { __calls: Record<string, unknown[]> }).__calls.insert?.[0] as Record<string, unknown>
    expect(row).toMatchObject({ user_id: 'u1', name: 'Losartana', kind: 'medicamento', repurchase_reminder: false, repurchase_frequency: null })
  })
  it('nome vazio → { error }', async () => {
    const client = mockSupabase({ session: fakeSession() })
    expect((await saveMedication(client, { name: ' ', kind: 'medicamento', status: 'em_uso' })).error).toBeTruthy()
  })
  it('deleteMedication filtra por id+dono', async () => {
    const builder = mockQueryBuilder({ data: null, error: null })
    const client = mockSupabase({ session: fakeSession('u1'), from: () => builder })
    await deleteMedication(client, 'm1')
    expect((builder as unknown as { __calls: Record<string, unknown[]> }).__calls.eq).toEqual(['user_id', 'u1'])
  })
})

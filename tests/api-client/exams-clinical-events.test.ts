// Exames · leitura de resultados clínicos (CPE) + registro de uso (usage_events). Contrato compartilhado.
import { describe, it, expect } from 'vitest'
import { getExamClinicalResults } from '../../packages/api-client/src/exams/clinical'
import { logUsageEvent } from '../../packages/api-client/src/events/log'
import { mockSupabase, mockQueryBuilder, fakeSession } from './supabaseMock'

describe('api-client · exams.getExamClinicalResults', () => {
  it('linhas → ClinicalResultRow[]; filtra por exam_id', async () => {
    const rows = [{ clinical_model: 'pentacam', result_kind: 'parametric', name: 'K1', value_text: '43,2' }]
    const builder = mockQueryBuilder({ data: rows, error: null })
    const client = mockSupabase({ session: fakeSession('u1'), from: () => builder })
    const out = await getExamClinicalResults(client, 'e1')
    expect(out).toEqual(rows)
    const calls = (builder as unknown as { __calls: Record<string, unknown[]> }).__calls
    expect(calls.eq).toEqual(['exam_id', 'e1'])
  })
  it('sem linhas → []', async () => {
    const client = mockSupabase({ session: fakeSession(), from: () => mockQueryBuilder({ data: null, error: null }) })
    expect(await getExamClinicalResults(client, 'e1')).toEqual([])
  })
  it('sem sessão → LANÇA', async () => {
    const client = mockSupabase({ session: null })
    await expect(getExamClinicalResults(client, 'e1')).rejects.toThrow(/autenticado/i)
  })
})

describe('api-client · events.logUsageEvent', () => {
  it('insere { user_id, event_name, metadata } e retorna { error: null }', async () => {
    const builder = mockQueryBuilder({ data: null, error: null })
    const client = mockSupabase({ session: fakeSession('u1'), from: () => builder })
    const { error } = await logUsageEvent(client, 'problema_reportado', { exam_id: 'e1' })
    expect(error).toBeNull()
    const calls = (builder as unknown as { __calls: Record<string, unknown[]> }).__calls
    expect(calls.insert?.[0]).toEqual({ user_id: 'u1', event_name: 'problema_reportado', metadata: { exam_id: 'e1' } })
  })
  it('sem sessão → { error } (não lança)', async () => {
    const client = mockSupabase({ session: null })
    const { error } = await logUsageEvent(client, 'x')
    expect(error?.message).toMatch(/autenticado/i)
  })
  it('event_name vazio → { error }', async () => {
    const client = mockSupabase({ session: fakeSession() })
    const { error } = await logUsageEvent(client, '')
    expect(error).toBeTruthy()
  })
})

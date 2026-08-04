// Módulo Exames · leitura dos RESULTADOS estruturados (biomarcadores) — contrato compartilhado Web/Mobile.
// Supabase mockado (harness). Garante: projeção fiel (interpretação NÃO recomputada), filtro por exam_id +
// abortSignal, vazio legítimo ([]) × falha (LANÇA), guarda de sessão.
import { describe, it, expect } from 'vitest'
import { getExamBiomarkers } from '../../packages/api-client/src/exams/biomarkers'
import { mockSupabase, mockQueryBuilder, fakeSession } from './supabaseMock'

const ROW = {
  id: 'b1', name: 'Glicose', value: 92, value_text: null, unit: 'mg/dL',
  reference_min: 70, reference_max: 99, interpretation: 'dentro_da_referencia',
  result_type: 'numeric', range_extracted: true, reference_source: 'laudo',
  source: 'ai_extracted', catalog_id: 'cat1', source_material: 'Sangue', source_exam_name: 'Bioquímica',
}

describe('api-client · exams.getExamBiomarkers', () => {
  it('linhas → BiomarkerDTO[] fiel; interpretação preservada (não recomputada)', async () => {
    const builder = mockQueryBuilder({ data: [ROW], error: null })
    const client = mockSupabase({ session: fakeSession('u1'), from: () => builder })
    const dto = await getExamBiomarkers(client, 'e1')
    expect(dto).toHaveLength(1)
    expect(dto[0]).toEqual({
      id: 'b1', name: 'Glicose', value: 92, value_text: null, unit: 'mg/dL',
      reference_min: 70, reference_max: 99, interpretation: 'dentro_da_referencia',
      result_type: 'numeric', range_extracted: true, reference_source: 'laudo',
      source: 'ai_extracted', catalog_id: 'cat1', source_material: 'Sangue', source_exam_name: 'Bioquímica',
    })
    const calls = (builder as unknown as { __calls: Record<string, unknown[]> }).__calls
    expect(calls.eq).toEqual(['exam_id', 'e1'])
    expect(calls.abortSignal?.[0]).toBeInstanceOf(AbortSignal)
  })

  it('linha incompleta → defaults seguros (name "", value null, range_extracted false)', async () => {
    const builder = mockQueryBuilder({ data: [{ id: 'b2' }], error: null })
    const client = mockSupabase({ session: fakeSession(), from: () => builder })
    const [dto] = await getExamBiomarkers(client, 'e1')
    expect(dto).toMatchObject({ id: 'b2', name: '', value: null, range_extracted: false, interpretation: null })
  })

  it('sem resultados → [] (vazio legítimo, não erro)', async () => {
    const client = mockSupabase({ session: fakeSession(), from: () => mockQueryBuilder({ data: null, error: null }) })
    expect(await getExamBiomarkers(client, 'e1')).toEqual([])
  })

  it('sem sessão → LANÇA (não retorna [])', async () => {
    const client = mockSupabase({ session: null, from: () => mockQueryBuilder({ data: [], error: null }) })
    await expect(getExamBiomarkers(client, 'e1')).rejects.toThrow(/autenticado/i)
  })

  it('erro do banco → LANÇA', async () => {
    const client = mockSupabase({ session: fakeSession(), from: () => mockQueryBuilder({ data: null, error: new Error('db down') }) })
    await expect(getExamBiomarkers(client, 'e1')).rejects.toThrow()
  })
})

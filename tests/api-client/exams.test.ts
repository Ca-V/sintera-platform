// Módulo Exames (leitura) do @sintera/api-client. Supabase mockado (harness).
import { describe, it, expect } from 'vitest'
import { listExams } from '../../packages/api-client/src/exams/list'
import { getExam } from '../../packages/api-client/src/exams/get'
import { mockSupabase, mockQueryBuilder, fakeSession } from './supabaseMock'

const ROW = {
  id: 'e1', exam_date: '2026-07-01', display_title: 'Hemograma', document_type: 'lab',
  clinical_family: 'hematologia', status: 'ready', issuer: 'Lab X', requesting_physician: 'Dra. Y',
  file_url: 'https://x/e1.pdf', created_at: '2026-07-02T00:00:00Z',
  // campos internos/financeiros que NÃO devem vazar:
  exam_text: '...', document_sha256: 'abc', expense_amount_cents: 5000, patient_name: 'Fulana', page_count: 3,
}
const calls = (b: unknown) => (b as { __calls: Record<string, unknown[]> }).__calls

describe('api-client · exams.listExams', () => {
  it('linhas → ExamDTO[] só com campos centrais; filtra por user_id, ordena e passa abortSignal', async () => {
    const builder = mockQueryBuilder({ data: [ROW], error: null })
    const client = mockSupabase({ session: fakeSession('u1'), from: () => builder })
    const list = await listExams(client)
    expect(list).toHaveLength(1)
    expect(list[0]).toEqual({
      id: 'e1', exam_date: '2026-07-01', display_title: 'Hemograma', document_type: 'lab',
      clinical_family: 'hematologia', status: 'ready', issuer: 'Lab X', requesting_physician: 'Dra. Y',
      file_url: 'https://x/e1.pdf', created_at: '2026-07-02T00:00:00Z',
    })
    expect(list[0]).not.toHaveProperty('exam_text')
    expect(list[0]).not.toHaveProperty('expense_amount_cents')
    expect(list[0]).not.toHaveProperty('patient_name')
    expect(calls(builder).eq).toEqual(['user_id', 'u1'])
    expect(calls(builder).order?.[0]).toBe('exam_date')
    expect(calls(builder).abortSignal?.[0]).toBeInstanceOf(AbortSignal)
  })

  it('sem exames → [] (não null, não erro)', async () => {
    const client = mockSupabase({ session: fakeSession(), from: () => mockQueryBuilder({ data: [], error: null }) })
    expect(await listExams(client)).toEqual([])
  })

  it('data null do Supabase → [] (defensivo)', async () => {
    const client = mockSupabase({ session: fakeSession(), from: () => mockQueryBuilder({ data: null, error: null }) })
    expect(await listExams(client)).toEqual([])
  })

  it('erro do banco → LANÇA', async () => {
    const client = mockSupabase({ session: fakeSession(), from: () => mockQueryBuilder({ data: null, error: new Error('db down') }) })
    await expect(listExams(client)).rejects.toThrow('db down')
  })

  it('não autenticado → LANÇA', async () => {
    await expect(listExams(mockSupabase({ session: null }))).rejects.toThrow('Não autenticado')
  })

  it('filtros (data/tipo/família) aplicam gte/lte/eq no builder', async () => {
    const builder = mockQueryBuilder({ data: [], error: null })
    const client = mockSupabase({ session: fakeSession('u1'), from: () => builder })
    await listExams(client, { from: '2026-01-01', to: '2026-12-31', type: 'lab', family: 'hematologia' })
    const c = calls(builder)
    expect(c.gte).toEqual(['exam_date', '2026-01-01'])
    expect(c.lte).toEqual(['exam_date', '2026-12-31'])
    // eq é chamado para user_id, document_type e clinical_family — o harness guarda o último (family)
    expect(c.eq).toEqual(['clinical_family', 'hematologia'])
  })

  it('paginação usa range inclusivo [offset, offset+limit-1]', async () => {
    const builder = mockQueryBuilder({ data: [], error: null })
    const client = mockSupabase({ session: fakeSession(), from: () => builder })
    await listExams(client, { limit: 20, offset: 40 })
    expect(calls(builder).range).toEqual([40, 59])
  })

  it('sem paginação → não chama range', async () => {
    const builder = mockQueryBuilder({ data: [], error: null })
    const client = mockSupabase({ session: fakeSession(), from: () => builder })
    await listExams(client)
    expect(calls(builder).range).toBeUndefined()
  })
})

describe('api-client · exams.getExam', () => {
  it('linha → ExamDTO; filtra por id + user_id', async () => {
    const builder = mockQueryBuilder({ data: ROW, error: null })
    const client = mockSupabase({ session: fakeSession('u1'), from: () => builder })
    const dto = await getExam(client, 'e1')
    expect(dto?.id).toBe('e1')
    expect(dto?.display_title).toBe('Hemograma')
    expect(dto).not.toHaveProperty('exam_text')
    // eq chamado duas vezes (id e user_id) — o harness guarda o último; conferimos o filtro por user_id
    expect(calls(builder).eq).toEqual(['user_id', 'u1'])
    expect(calls(builder).maybeSingle).toBeDefined()
  })

  it('sem linha → null', async () => {
    const client = mockSupabase({ session: fakeSession(), from: () => mockQueryBuilder({ data: null, error: null }) })
    expect(await getExam(client, 'nope')).toBeNull()
  })

  it('erro do banco → LANÇA', async () => {
    const client = mockSupabase({ session: fakeSession(), from: () => mockQueryBuilder({ data: null, error: new Error('boom') }) })
    await expect(getExam(client, 'e1')).rejects.toThrow('boom')
  })

  it('não autenticado → LANÇA', async () => {
    await expect(getExam(mockSupabase({ session: null }), 'e1')).rejects.toThrow('Não autenticado')
  })
})

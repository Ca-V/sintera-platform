// createExam (escrita — Inc.6). Cobre a construção do payload (WHITELIST: user_id da sessão + type + file_url +
// exam_date + status 'pending'; id/created_at ficam a cargo do default do banco) e as guardas (sem sessão / erro).
import { describe, it, expect } from 'vitest'
import { createExam } from '../../packages/api-client/src/exams/create'
import { mockSupabase, mockQueryBuilder, fakeSession } from './supabaseMock'

const calls = (b: unknown) => (b as { __calls: Record<string, unknown[]> }).__calls

describe('api-client · exams.createExam', () => {
  it('insere com user_id da sessão + status pending e devolve o id gerado', async () => {
    const builder = mockQueryBuilder({ data: { id: 'exam-new' }, error: null })
    const client = mockSupabase({ session: fakeSession('u1'), from: () => builder })

    const r = await createExam(client, { file_url: 'https://x/f.pdf', type: 'Hemograma', exam_date: '2024-01-02' })

    expect(r).toEqual({ data: { id: 'exam-new' }, error: null })
    expect(calls(builder).insert?.[0]).toMatchObject({
      user_id: 'u1', type: 'Hemograma', file_url: 'https://x/f.pdf', exam_date: '2024-01-02', status: 'pending',
    })
    // NÃO envia id/created_at (default do banco); NÃO vaza chaves arbitrárias.
    expect(calls(builder).insert?.[0]).not.toHaveProperty('id')
    expect(calls(builder).abortSignal?.[0]).toBeInstanceOf(AbortSignal)
  })

  it('exam_date ausente → null (factual; a extração pode preencher depois)', async () => {
    const builder = mockQueryBuilder({ data: { id: 'e2' }, error: null })
    const client = mockSupabase({ session: fakeSession('u1'), from: () => builder })
    await createExam(client, { file_url: 'x', type: 't' })
    expect(calls(builder).insert?.[0]).toMatchObject({ exam_date: null })
  })

  it('sem sessão → { data: null, error } (não toca o banco)', async () => {
    const client = mockSupabase({ session: null })
    const r = await createExam(client, { file_url: 'x', type: 't' })
    expect(r.data).toBeNull()
    expect(r.error?.message).toMatch(/autenticado/i)
  })

  it('erro do banco → { data: null, error } (não lança)', async () => {
    const builder = mockQueryBuilder({ data: null, error: new Error('rls denied') })
    const client = mockSupabase({ session: fakeSession('u1'), from: () => builder })
    const r = await createExam(client, { file_url: 'x', type: 't' })
    expect(r.data).toBeNull()
    expect(r.error).toBeTruthy()
  })
})

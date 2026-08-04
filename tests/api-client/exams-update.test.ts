// Módulo Exames · ESCRITA de campos editáveis (renomear/data/financeiro/vínculo) — contrato compartilhado.
// Garante: whitelist (só campos permitidos), escopo por dono, patch vazio = no-op, guardas de sessão/erro.
import { describe, it, expect } from 'vitest'
import { updateExam } from '../../packages/api-client/src/exams/update'
import { mockSupabase, mockQueryBuilder, fakeSession } from './supabaseMock'

describe('api-client · exams.updateExam', () => {
  it('envia só os campos da whitelist e escopa por id+dono', async () => {
    const builder = mockQueryBuilder({ data: null, error: null })
    const client = mockSupabase({ session: fakeSession('u1'), from: () => builder })
    const patch = { type: 'Hemograma', exam_date: '2026-08-01', hacker: 'x' } as never
    const { error } = await updateExam(client, 'e1', patch)
    expect(error).toBeNull()
    const calls = (builder as unknown as { __calls: Record<string, unknown[]> }).__calls
    expect(calls.update?.[0]).toEqual({ type: 'Hemograma', exam_date: '2026-08-01' }) // 'hacker' descartado
    expect(calls.eq).toEqual(['user_id', 'u1']) // última chamada eq — escopo do dono
    expect(calls.abortSignal?.[0]).toBeInstanceOf(AbortSignal)
  })

  it('aceita null explícito (limpar data/financeiro)', async () => {
    const builder = mockQueryBuilder({ data: null, error: null })
    const client = mockSupabase({ session: fakeSession(), from: () => builder })
    await updateExam(client, 'e1', { exam_date: null, expense_amount_cents: null })
    const calls = (builder as unknown as { __calls: Record<string, unknown[]> }).__calls
    expect(calls.update?.[0]).toEqual({ exam_date: null, expense_amount_cents: null })
  })

  it('patch vazio → no-op (não chama o banco) e { error: null }', async () => {
    let called = false
    const client = mockSupabase({ session: fakeSession(), from: () => { called = true; return mockQueryBuilder({ data: null, error: null }) } })
    const { error } = await updateExam(client, 'e1', {})
    expect(error).toBeNull()
    expect(called).toBe(false)
  })

  it('sem sessão → { error } (não escreve)', async () => {
    const client = mockSupabase({ session: null })
    const { error } = await updateExam(client, 'e1', { type: 'X' })
    expect(error?.message).toMatch(/autenticado/i)
  })

  it('erro do banco → { error }', async () => {
    const client = mockSupabase({ session: fakeSession(), from: () => mockQueryBuilder({ data: null, error: new Error('rls') }) })
    const { error } = await updateExam(client, 'e1', { type: 'X' })
    expect(error).toBeTruthy()
  })
})

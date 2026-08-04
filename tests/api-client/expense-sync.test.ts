// @sintera/api-client — infra ÚNICA de despesa vinculada (syncLinkedExpense), reutilizada por Recursos/Medicamentos.
// valor>0 → upsert evento financeiro (realizado+directExpense+link); valor nulo → remove; distingue do lembrete.
import { describe, it, expect } from 'vitest'
import { syncLinkedExpense } from '../../packages/api-client/src/agenda/expense'
import { mockSupabase, mockQueryBuilder, fakeSession } from './supabaseMock'

function client(healthRows: unknown[]) {
  const builders: Record<string, ReturnType<typeof mockQueryBuilder>> = {
    agenda_events: mockQueryBuilder({ data: [], error: null }),
    health_events: mockQueryBuilder({ data: healthRows, error: null }),
  }
  return { c: mockSupabase({ session: fakeSession('u1'), from: (table: string) => builders[table] }), builders }
}
const calls = (b: ReturnType<typeof mockQueryBuilder>) => (b as unknown as { __calls: Record<string, unknown[]> }).__calls

describe('syncLinkedExpense', () => {
  it('valor>0 sem existente → upsert evento financeiro (realizado, directExpense, link)', async () => {
    const { c, builders } = client([])
    const { error } = await syncLinkedExpense(c, { type: 'resource', id: 'r1' }, { amountCents: 25000, docType: 'nota_fiscal', title: 'Compra: Óculos' })
    expect(error).toBeNull()
    const row = calls(builders.health_events).upsert?.[0] as Record<string, unknown>
    expect(row).toMatchObject({ status: 'realizado', direct_expense: true, amount_cents: 25000, expense_doc_type: 'nota_fiscal', title: 'Compra: Óculos' })
    expect(row.links).toEqual([{ type: 'resource', id: 'r1' }])
  })

  it('não confunde a DESPESA com o LEMBRETE vinculado (só o evento com valor é a despesa)', async () => {
    const reminder = { id: 'rem1', event_type: 'outro', title: 'Trocar', event_date: '2026-05-01', amount_cents: null, links: [{ type: 'resource', id: 'r1' }] }
    const { c, builders } = client([reminder])
    await syncLinkedExpense(c, { type: 'resource', id: 'r1' }, { amountCents: 10000, title: 'Compra: X' })
    // como não há evento COM valor, cria um novo (não sobrescreve o lembrete rem1)
    const row = calls(builders.health_events).upsert?.[0] as Record<string, unknown>
    expect(row.id).toBeUndefined()
    expect(row.amount_cents).toBe(10000)
  })

  it('valor nulo com despesa existente → remove', async () => {
    const exp = { id: 'exp1', event_type: 'outro', title: 'Compra', event_date: '2026-05-01', amount_cents: 5000, links: [{ type: 'medication', id: 'm1' }] }
    const { c, builders } = client([exp])
    const { error } = await syncLinkedExpense(c, { type: 'medication', id: 'm1' }, { amountCents: null, title: '' })
    expect(error).toBeNull()
    expect(calls(builders.health_events).delete).toBeDefined()
    expect(calls(builders.health_events).upsert).toBeUndefined()
  })
})

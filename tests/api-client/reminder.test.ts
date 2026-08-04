// @sintera/api-client — infra ÚNICA de lembrete vinculado (syncLinkedReminder), reutilizada por Hábitos/
// Recursos/Medicamentos. Verifica: ligado sem existente → upsert com o link + recorrência; desligado com
// existente → remove; ligado com existente → preserva a âncora (id/date).
import { describe, it, expect } from 'vitest'
import { syncLinkedReminder } from '../../packages/api-client/src/agenda/reminder'
import { mockSupabase, mockQueryBuilder, fakeSession } from './supabaseMock'

function client(healthRows: unknown[]) {
  const builders: Record<string, ReturnType<typeof mockQueryBuilder>> = {
    agenda_events: mockQueryBuilder({ data: [], error: null }),
    health_events: mockQueryBuilder({ data: healthRows, error: null }),
  }
  const c = mockSupabase({ session: fakeSession('u1'), from: (table: string) => builders[table] })
  return { c, builders }
}
const calls = (b: ReturnType<typeof mockQueryBuilder>) => (b as unknown as { __calls: Record<string, unknown[]> }).__calls

describe('syncLinkedReminder', () => {
  it('ligado, sem lembrete existente → upsert com link + recurrence_rule', async () => {
    const { c, builders } = client([])
    const { error } = await syncLinkedReminder(c, { type: 'habit', id: 'h1' }, { enabled: true, frequency: 'weekly', title: 'Hábito: Caminhar' })
    expect(error).toBeNull()
    const row = calls(builders.health_events).upsert?.[0] as Record<string, unknown>
    expect(row.recurrence_rule).toBe('freq=weekly;interval=1')
    expect(row.links).toEqual([{ type: 'habit', id: 'h1' }])
    expect(row.title).toBe('Hábito: Caminhar')
  })

  it('desligado, com lembrete existente → remove (delete)', async () => {
    const existing = { id: 'ev1', event_type: 'outro', title: 'x', event_date: '2026-05-01', links: [{ type: 'habit', id: 'h1' }] }
    const { c, builders } = client([existing])
    const { error } = await syncLinkedReminder(c, { type: 'habit', id: 'h1' }, { enabled: false, frequency: 'none', title: '' })
    expect(error).toBeNull()
    expect(calls(builders.health_events).delete).toBeDefined()
    expect(calls(builders.health_events).upsert).toBeUndefined()
  })

  it('ligado, com lembrete existente → preserva a âncora (id/date do existente)', async () => {
    const existing = { id: 'ev1', event_type: 'outro', title: 'x', event_date: '2026-05-01', links: [{ type: 'resource', id: 'r1' }] }
    const { c, builders } = client([existing])
    await syncLinkedReminder(c, { type: 'resource', id: 'r1' }, { enabled: true, frequency: 'monthly', title: 'Trocar: Óculos', date: '2099-01-01' })
    const row = calls(builders.health_events).upsert?.[0] as Record<string, unknown>
    expect(row.id).toBe('ev1')           // preserva o id
    expect(row.event_date).toBe('2026-05-01') // preserva a âncora (não usa a date nova)
    expect(row.recurrence_rule).toBe('freq=monthly;interval=1')
  })

  it('desligado, sem existente → no-op sem erro', async () => {
    const { c } = client([])
    expect((await syncLinkedReminder(c, { type: 'habit', id: 'h9' }, { enabled: false, frequency: 'none', title: '' })).error).toBeNull()
  })
})

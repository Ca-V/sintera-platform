// Domínio Agenda (health_events) do @sintera/api-client — leitura (legado+canônico, dedup, ordem) + escrita.
import { describe, it, expect } from 'vitest'
import { listEvents, saveEvent, deleteEvent } from '../../packages/api-client/src/agenda/events'
import { mockSupabase, mockQueryBuilder, fakeSession } from './supabaseMock'

function multiTable(map: Record<string, { data?: unknown; error: unknown }>) {
  const builders: Record<string, ReturnType<typeof mockQueryBuilder>> = {}
  const client = mockSupabase({ session: fakeSession('u1'), from: (table: string) => {
    builders[table] = builders[table] ?? mockQueryBuilder(map[table] ?? { data: [], error: null })
    return builders[table]
  } })
  return { client, builders }
}

describe('api-client · agenda.listEvents', () => {
  it('une legado+canônico, canônico vence no mesmo id, ordena por data', async () => {
    const { client } = multiTable({
      agenda_events: { data: [{ id: 'x', event_type: 'consulta', title: 'Legado', event_date: '2026-08-10', status: 'pending' }], error: null },
      health_events: { data: [
        { id: 'x', event_type: 'consulta', title: 'Canônico', event_date: '2026-08-10', status: 'planejado' },
        { id: 'y', event_type: 'exame', title: 'Outro', event_date: '2026-08-01', status: 'planejado' },
      ], error: null },
    })
    const evs = await listEvents(client)
    expect(evs.map(e => e.id)).toEqual(['y', 'x']) // ordenado por data (08-01 antes de 08-10)
    expect(evs.find(e => e.id === 'x')?.title).toBe('Canônico') // canônico venceu o legado
  })

  it('sem sessão → LANÇA', async () => {
    const client = mockSupabase({ session: null })
    await expect(listEvents(client)).rejects.toThrow(/autenticado/i)
  })

  it('erro do banco → LANÇA', async () => {
    const { client } = multiTable({ health_events: { data: null, error: new Error('db') } })
    await expect(listEvents(client)).rejects.toThrow()
  })
})

describe('api-client · agenda.saveEvent / deleteEvent', () => {
  it('saveEvent faz upsert em health_events com a linha mapeada', async () => {
    const builder = mockQueryBuilder({ data: null, error: null })
    const client = mockSupabase({ session: fakeSession('u1'), from: () => builder })
    const { error } = await saveEvent(client, { type: 'consulta', title: 'Cardiologista', date: '2026-09-01' })
    expect(error).toBeNull()
    const calls = (builder as unknown as { __calls: Record<string, unknown[]> }).__calls
    const row = calls.upsert?.[0] as Record<string, unknown>
    expect(row).toMatchObject({ user_id: 'u1', event_type: 'consulta', title: 'Cardiologista', event_date: '2026-09-01' })
  })

  it('saveEvent sem sessão → { error }', async () => {
    const client = mockSupabase({ session: null })
    expect((await saveEvent(client, { type: 'x', title: 'y', date: '2026-01-01' })).error?.message).toMatch(/autenticado/i)
  })

  it('deleteEvent filtra por id + dono', async () => {
    const builder = mockQueryBuilder({ data: null, error: null })
    const client = mockSupabase({ session: fakeSession('u1'), from: () => builder })
    const { error } = await deleteEvent(client, 'e9')
    expect(error).toBeNull()
    const calls = (builder as unknown as { __calls: Record<string, unknown[]> }).__calls
    expect(calls.eq).toEqual(['user_id', 'u1'])
  })
})

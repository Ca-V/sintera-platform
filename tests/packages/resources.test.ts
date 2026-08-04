// @sintera/core — taxonomia/resumo de Recursos (puro) + @sintera/api-client — CRUD de health_resources.
import { describe, it, expect } from 'vitest'
import { resourceTypeLabel, resourceStatusLabel, visionSummary, RESOURCE_TYPES } from '../../packages/core/src/domain/resources'
import { saveResource, deleteResource } from '../../packages/api-client/src/resources/resources'
import { mockSupabase, mockQueryBuilder, fakeSession } from '../api-client/supabaseMock'

describe('core · resources', () => {
  it('rótulos com fallback', () => {
    expect(resourceTypeLabel('correcao_visual')).toBe('Correção visual')
    expect(resourceTypeLabel('x')).toBe('Outro')
    expect(resourceStatusLabel('suspenso')).toBe('Suspenso')
    expect(RESOURCE_TYPES.length).toBe(6)
  })
  it('resumo de prescrição visual (OD/OE)', () => {
    expect(visionSummary({ od: { sph: '-1,00', cyl: '-0,50', axis: '180' }, oe: { sph: '-1,25' } }))
      .toBe('OD: esf -1,00 cil -0,50 eixo 180 · OE: esf -1,25')
    expect(visionSummary({})).toBeNull()
    expect(visionSummary(null)).toBeNull()
  })
})

describe('api-client · resources', () => {
  it('saveResource (novo) insere com user_id + attributes e devolve id', async () => {
    const builder = mockQueryBuilder({ data: { id: 'r1' }, error: null })
    const client = mockSupabase({ session: fakeSession('u1'), from: () => builder })
    const { data, error } = await saveResource(client, { resource_type: 'correcao_visual', name: 'Óculos', status: 'em_uso', attributes: { vision_kind: 'oculos' } })
    expect(error).toBeNull()
    expect(data?.id).toBe('r1')
    expect((builder as unknown as { __calls: Record<string, unknown[]> }).__calls.insert?.[0]).toMatchObject({ user_id: 'u1', resource_type: 'correcao_visual', name: 'Óculos', attributes: { vision_kind: 'oculos' } })
  })
  it('nome vazio → { error }', async () => {
    const client = mockSupabase({ session: fakeSession() })
    expect((await saveResource(client, { resource_type: 'outro', name: ' ', status: 'em_uso' })).error).toBeTruthy()
  })
  it('deleteResource filtra por id+dono', async () => {
    const builder = mockQueryBuilder({ data: null, error: null })
    const client = mockSupabase({ session: fakeSession('u1'), from: () => builder })
    await deleteResource(client, 'r1')
    expect((builder as unknown as { __calls: Record<string, unknown[]> }).__calls.eq).toEqual(['user_id', 'u1'])
  })
})

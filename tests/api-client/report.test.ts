// Domínio Relatório (Camada de Comunicação) do @sintera/api-client — links públicos (report_shares),
// perfis salvos (report_templates) e leitura de ômica (omics_panels). Filtro por dono e guardas de sessão.
import { describe, it, expect } from 'vitest'
import { listShares, createShare, revokeShare, listTemplates, saveTemplate, deleteTemplate, listOmicsPanels } from '../../packages/api-client/src/report/report'
import { mockSupabase, mockQueryBuilder, fakeSession } from './supabaseMock'

type Calls = { __calls: Record<string, unknown[]> }

describe('api-client · report (Camada de Comunicação)', () => {
  it('listShares filtra por dono, não-revogados e não expirados', async () => {
    const rows = [{ id: 's1', token: 'abc', expires_at: '2099-01-01T00:00:00Z' }]
    const builder = mockQueryBuilder({ data: rows, error: null })
    const client = mockSupabase({ session: fakeSession('u1'), from: () => builder })
    expect(await listShares(client)).toEqual(rows)
    const calls = (builder as unknown as Calls).__calls
    expect(calls.eq).toEqual(['revoked', false]) // último eq encadeado
  })

  it('createShare gera token e grava seções + período do dono', async () => {
    const builder = mockQueryBuilder({ data: null, error: null })
    const client = mockSupabase({ session: fakeSession('u1'), from: () => builder })
    const { data, error } = await createShare(client, { sections: ['exames', 'gastos'], period: { preset: 'all' } })
    expect(error).toBeNull()
    expect(typeof data?.token).toBe('string')
    expect((data?.token.length ?? 0)).toBeGreaterThan(16)
    const row = (builder as unknown as Calls).__calls.insert?.[0] as Record<string, unknown>
    expect(row).toMatchObject({ user_id: 'u1', sections: ['exames', 'gastos'], revoked: false })
    expect(row.token).toBe(data?.token)
  })

  it('revokeShare marca revoked=true por id+dono', async () => {
    const builder = mockQueryBuilder({ data: null, error: null })
    const client = mockSupabase({ session: fakeSession('u1'), from: () => builder })
    await revokeShare(client, 's1')
    const calls = (builder as unknown as Calls).__calls
    expect(calls.update?.[0]).toMatchObject({ revoked: true })
    expect(calls.eq).toEqual(['user_id', 'u1'])
  })

  it('templates: save exige nome; delete filtra por dono; list normaliza selection nula → {}', async () => {
    const noName = mockSupabase({ session: fakeSession('u1') })
    expect((await saveTemplate(noName, { name: '  ', selection: {} })).error).toBeTruthy()

    const listBuilder = mockQueryBuilder({ data: [{ id: 't1', name: 'Cardio', selection: null }], error: null })
    const listClient = mockSupabase({ session: fakeSession('u1'), from: () => listBuilder })
    expect(await listTemplates(listClient)).toEqual([{ id: 't1', name: 'Cardio', selection: {} }])

    const delBuilder = mockQueryBuilder({ data: null, error: null })
    const delClient = mockSupabase({ session: fakeSession('u1'), from: () => delBuilder })
    await deleteTemplate(delClient, 't1')
    expect((delBuilder as unknown as Calls).__calls.eq).toEqual(['user_id', 'u1'])
  })

  it('listOmicsPanels → DTO[] do dono; sem sessão lança em leitura', async () => {
    const rows = [{ domain: 'metabolomics', laboratory: 'Lab', total_features: 200, collected_on: '2026-01-01', created_at: null }]
    const builder = mockQueryBuilder({ data: rows, error: null })
    const client = mockSupabase({ session: fakeSession('u1'), from: () => builder })
    expect(await listOmicsPanels(client)).toEqual(rows)
    const anon = mockSupabase({ session: null })
    await expect(listOmicsPanels(anon)).rejects.toThrow(/autenticado/i)
  })
})

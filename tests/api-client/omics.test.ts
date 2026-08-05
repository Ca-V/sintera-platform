// Domínio Exames de Ômica do @sintera/api-client — LEITURAS via ponte /api/omics (fetch + Bearer) e ESCRITAS
// diretas (RLS dono). Testa a montagem da URL/token do bridge e os payloads de escrita.
import { describe, it, expect, vi, afterEach } from 'vitest'
import { listOmicsPanels, getOmicsPanel, searchOmicsCatalog, createOmicsPanel, addOmicsResult, deleteOmicsPanel } from '../../packages/api-client/src/omics/omics'
import { mockSupabase, mockQueryBuilder, fakeSession } from './supabaseMock'

type Calls = { __calls: Record<string, unknown[]> }
const WEB = 'https://web.example'

function stubFetch(json: unknown, ok = true) {
  const f = vi.fn(async () => ({ ok, status: ok ? 200 : 500, json: async () => json }))
  ;(globalThis as unknown as { fetch: unknown }).fetch = f
  return f
}
afterEach(() => { vi.restoreAllMocks() })

describe('api-client · omics', () => {
  it('listPanels chama /api/omics/panels com Bearer e devolve panels', async () => {
    const f = stubFetch({ panels: [{ id: 'p1', domain: 'metabolomics' }] })
    const client = mockSupabase({ session: { ...fakeSession('u1'), access_token: 'tok' } as never })
    const out = await listOmicsPanels(client, WEB)
    expect(out).toEqual([{ id: 'p1', domain: 'metabolomics' }])
    const [url, opts] = f.mock.calls[0] as unknown as [string, { headers: Record<string, string> }]
    expect(url).toBe(`${WEB}/api/omics/panels`)
    expect(opts.headers.Authorization).toBe('Bearer tok')
  })

  it('getPanel usa a rota do id; sem webBaseUrl lança', async () => {
    stubFetch({ panel: { id: 'p1' }, categories: [], total_results: 0 })
    const client = mockSupabase({ session: { ...fakeSession('u1'), access_token: 'tok' } as never })
    const d = await getOmicsPanel(client, WEB, 'p1')
    expect(d.total_results).toBe(0)
    await expect(getOmicsPanel(client, undefined, 'p1')).rejects.toThrow(/URL/i)
  })

  it('searchCatalog monta q+domain; termo vazio não chama a rede', async () => {
    const f = stubFetch({ resolved: { id: 'c1', canonical_name: 'Leucine' }, matches: [] })
    const client = mockSupabase({ session: { ...fakeSession('u1'), access_token: 'tok' } as never })
    expect(await searchOmicsCatalog(client, WEB, '  ', 'metabolomics')).toEqual({ resolved: null, matches: [] })
    expect(f).not.toHaveBeenCalled()
    const r = await searchOmicsCatalog(client, WEB, 'Leucine', 'metabolomics')
    expect(r.resolved?.canonical_name).toBe('Leucine')
    expect((f.mock.calls[0] as unknown as [string])[0]).toContain('/api/omics/search?q=Leucine&domain=metabolomics')
  })

  it('createOmicsPanel insere no dono e retorna id', async () => {
    const builder = mockQueryBuilder({ data: { id: 'np' }, error: null })
    const client = mockSupabase({ session: fakeSession('u1'), from: () => builder })
    const { data, error } = await createOmicsPanel(client, { domain: 'proteomics', laboratory: 'Lab' })
    expect(error).toBeNull(); expect(data?.id).toBe('np')
    expect((builder as unknown as Calls).__calls.insert?.[0]).toMatchObject({ user_id: 'u1', domain: 'proteomics', laboratory: 'Lab' })
  })

  it('addOmicsResult grava feature_id resolvido + panel_id + dono; sem nome → erro', async () => {
    const builder = mockQueryBuilder({ data: null, error: null })
    const client = mockSupabase({ session: fakeSession('u1'), from: () => builder })
    const { error } = await addOmicsResult(client, 'p1', { domain: 'metabolomics', featureId: 'c1', featureName: 'Leucine', categoryId: 'cat1', value: 12.5, unit: 'µmol/L', rawValue: '12,5', method: 'LC-MS', measuredOn: '2026-08-01' })
    expect(error).toBeNull()
    expect((builder as unknown as Calls).__calls.insert?.[0]).toMatchObject({ panel_id: 'p1', user_id: 'u1', feature_id: 'c1', feature_name: 'Leucine', value: 12.5 })
    expect((await addOmicsResult(client, 'p1', { domain: 'metabolomics', featureId: null, featureName: '  ', categoryId: null, value: null, unit: null, rawValue: null, method: null, measuredOn: null })).error).toBeTruthy()
  })

  it('deleteOmicsPanel filtra por id+dono', async () => {
    const builder = mockQueryBuilder({ data: null, error: null })
    const client = mockSupabase({ session: fakeSession('u1'), from: () => builder })
    await deleteOmicsPanel(client, 'p1')
    expect((builder as unknown as Calls).__calls.eq).toEqual(['user_id', 'u1'])
  })
})

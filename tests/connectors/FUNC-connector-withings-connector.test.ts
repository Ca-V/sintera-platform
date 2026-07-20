// FUNC · HIP-002 — WithingsConnector.fetchSamples: getmeas → CanonicalSample (mapa meastype, value×10^unit,
// category, paginação, janela incremental via lastupdate, modelo aberto). Puro: WithingsClient é um fake.
import { describe, it, expect } from 'vitest'
import type { ConnectorContext } from '@/lib/connectors/registry'
import type { WithingsClient } from '@/lib/connectors/withings/client'
import { createWithingsConnector, WITHINGS_MEASTYPES } from '@/lib/connectors/withings/connector'

/** Fake do WithingsClient: devolve, em sequência, os `body` de getmeas dados; registra os forms recebidos. */
function fakeClient(bodies: Array<Record<string, unknown>>): { client: WithingsClient; forms: Array<Record<string, string>> } {
  const forms: Array<Record<string, string>> = []
  let i = 0
  const client: WithingsClient = {
    async call(_path, form) { forms.push(form); const b = bodies[Math.min(i, bodies.length - 1)]; i += 1; return b },
  }
  return { client, forms }
}

const ctx = (since: string | null): ConnectorContext => ({ userId: 'u1', accessToken: 'tok', window: { since, until: '2026-07-20T12:00:00Z' } })

// 2026-07-05T08:00:00Z = 1783238400 (unix s)
const D_2026_07_05 = 1783238400

describe('WithingsConnector.fetchSamples', () => {
  it('mapeia peso+gordura de um grupo (value×10^unit) com externalId grpid-type', async () => {
    const { client } = fakeClient([{ measuregrps: [
      { grpid: 111, date: D_2026_07_05, category: 1, measures: [
        { value: 80500, type: 1, unit: -3 },  // 80.5 kg
        { value: 2340, type: 6, unit: -2 },    // 23.4 %
      ] },
    ] }])
    const samples = await createWithingsConnector({ client }).fetchSamples(ctx(null))
    expect(samples).toEqual([
      { metric: 'peso', value: 80.5, unit: 'kg', recordedAt: '2026-07-05T08:00:00.000Z', provenance: { source: 'withings', connectorVersion: 'withings-v1', externalId: '111-1' } },
      { metric: 'gordura_corporal', value: 23.4, unit: '%', recordedAt: '2026-07-05T08:00:00.000Z', provenance: { source: 'withings', connectorVersion: 'withings-v1', externalId: '111-6' } },
    ])
  })

  it('ignora category≠1 (objetivos) e meastype fora do escopo (modelo aberto)', async () => {
    const { client } = fakeClient([{ measuregrps: [
      { grpid: 1, date: D_2026_07_05, category: 2, measures: [{ value: 70000, type: 1, unit: -3 }] }, // objetivo → ignora
      { grpid: 2, date: D_2026_07_05, category: 1, measures: [
        { value: 60000, type: 1, unit: -3 },   // peso → mantém
        { value: 12000, type: 9, unit: -3 },   // PA diastólica (fora do escopo D1) → ignora
      ] },
    ] }])
    const samples = await createWithingsConnector({ client }).fetchSamples(ctx(null))
    expect(samples).toEqual([
      { metric: 'peso', value: 60, unit: 'kg', recordedAt: '2026-07-05T08:00:00.000Z', provenance: { source: 'withings', connectorVersion: 'withings-v1', externalId: '2-1' } },
    ])
  })

  it('1ª sync (since=null) NÃO envia lastupdate; incremental envia lastupdate (unix s)', async () => {
    const first = fakeClient([{ measuregrps: [] }])
    await createWithingsConnector({ client: first.client }).fetchSamples(ctx(null))
    expect(first.forms[0].lastupdate).toBeUndefined()
    expect(first.forms[0]).toMatchObject({ action: 'getmeas', category: '1', meastypes: WITHINGS_MEASTYPES })

    const inc = fakeClient([{ measuregrps: [] }])
    await createWithingsConnector({ client: inc.client }).fetchSamples(ctx('2026-07-05T08:00:00.000Z'))
    expect(inc.forms[0].lastupdate).toBe(String(D_2026_07_05))
  })

  it('pagina por more/offset, agregando todos os grupos', async () => {
    const { client, forms } = fakeClient([
      { measuregrps: [{ grpid: 1, date: D_2026_07_05, category: 1, measures: [{ value: 80000, type: 1, unit: -3 }] }], more: 1, offset: 5 },
      { measuregrps: [{ grpid: 2, date: D_2026_07_05, category: 1, measures: [{ value: 79000, type: 1, unit: -3 }] }], more: 0 },
    ])
    const samples = await createWithingsConnector({ client }).fetchSamples(ctx(null))
    expect(samples.map((s) => s.value)).toEqual([80, 79])
    expect(forms[1].offset).toBe('5') // 2ª página usou o offset devolvido
  })
})

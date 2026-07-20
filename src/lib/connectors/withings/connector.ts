// HIP-002 — WithingsConnector (ISOLADO). Implementa o contrato genérico Connector do núcleo: busca medidas via
// getmeas e as traduz em CanonicalSample (o núcleo persiste/deduplica/projeta sem conhecer o Withings). Só Composição
// Corporal (D1). Modelo aberto ([[principio_modelo_aberto]]): meastype fora do escopo é IGNORADO, nunca quebra.

import type { Connector, ConnectorContext } from '../registry'
import type { CanonicalSample } from '../connector'
import { createWithingsClient, type WithingsClient, type FetchLike, type Sleep } from './client'
import { WITHINGS_SOURCE, WITHINGS_LABEL, WITHINGS_VERSION } from './config'

/** Withings `meastype` → métrica canônica corporal (chaves de BODY_METRIC_KEYS) + unidade de exibição. */
interface MetricDef { metric: string; unit: string }
const METRIC_BY_MEASTYPE: Record<number, MetricDef> = {
  1: { metric: 'peso', unit: 'kg' },             // Weight
  5: { metric: 'massa_magra', unit: 'kg' },      // Fat Free Mass
  6: { metric: 'gordura_corporal', unit: '%' },  // Fat Ratio
  76: { metric: 'massa_muscular', unit: 'kg' },  // Muscle Mass
  77: { metric: 'agua_corporal', unit: 'kg' },   // Hydration
  88: { metric: 'massa_ossea', unit: 'kg' },     // Bone Mass
}

/** Lista de meastypes que pedimos ao getmeas (só os do escopo D1). */
export const WITHINGS_MEASTYPES = Object.keys(METRIC_BY_MEASTYPE).join(',')

interface WithingsMeasure { value: number; type: number; unit: number }
interface WithingsGroup { grpid: number; date: number; category: number; measures?: WithingsMeasure[] }
interface GetmeasBody { measuregrps?: WithingsGroup[]; more?: number; offset?: number }

/** Teto de segurança de páginas (getmeas pagina por offset/more). */
const MAX_PAGES = 50

export interface WithingsConnectorDeps {
  client?: WithingsClient
  fetchImpl?: FetchLike
  sleep?: Sleep
}

export function createWithingsConnector(deps: WithingsConnectorDeps = {}): Connector {
  const client = deps.client ?? createWithingsClient({ fetchImpl: deps.fetchImpl, sleep: deps.sleep })

  return {
    descriptor: {
      source: WITHINGS_SOURCE,
      label: WITHINGS_LABEL,
      domain: 'wearable',
      acquisition: 'oauth',
      version: WITHINGS_VERSION,
      capabilities: [...new Set(Object.values(METRIC_BY_MEASTYPE).map((m) => m.metric))],
    },

    async fetchSamples(ctx: ConnectorContext): Promise<CanonicalSample[]> {
      const groups = await fetchAllGroups(client, ctx)
      const out: CanonicalSample[] = []
      for (const g of groups) {
        if (g.category !== 1) continue // só medidas REAIS (category 2 = "objetivos" do usuário)
        const recordedAt = new Date(g.date * 1000).toISOString() // date unix (s) → ISO (DATE-001)
        for (const m of g.measures ?? []) {
          const def = METRIC_BY_MEASTYPE[m.type]
          if (!def) continue // meastype fora do escopo → ignora (modelo aberto)
          const value = Math.round(m.value * 10 ** m.unit * 1000) / 1000 // valor real = value×10^unit
          out.push({
            metric: def.metric,
            value,
            unit: def.unit,
            recordedAt,
            provenance: { source: WITHINGS_SOURCE, connectorVersion: WITHINGS_VERSION, externalId: `${g.grpid}-${m.type}` },
          })
        }
      }
      return out
    },
  }
}

/**
 * Busca todos os grupos de medida da janela, paginando por offset/more.
 * - 1ª sync (`since=null`): histórico completo (sem cursor).
 * - Incremental (`since` = marca d'água): `lastupdate` (unix s) — pega o que chegou/mudou desde então (robusto a
 *   uploads atrasados do dispositivo; o núcleo deduplica por idempotência, então re-buscar é inofensivo).
 */
async function fetchAllGroups(client: WithingsClient, ctx: ConnectorContext): Promise<WithingsGroup[]> {
  const base: Record<string, string> = { action: 'getmeas', meastypes: WITHINGS_MEASTYPES, category: '1' }
  if (ctx.window.since) base.lastupdate = String(Math.floor(new Date(ctx.window.since).getTime() / 1000))

  const groups: WithingsGroup[] = []
  let offset: string | undefined
  for (let page = 0; page < MAX_PAGES; page++) {
    const form = offset ? { ...base, offset } : base
    const body = (await client.call('/measure', form, ctx.accessToken)) as GetmeasBody
    groups.push(...(body.measuregrps ?? []))
    if (body.more && body.offset != null) offset = String(body.offset)
    else break
  }
  return groups
}

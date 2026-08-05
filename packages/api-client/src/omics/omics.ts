// @sintera/api-client — Exames de Ômica (omics). LEITURAS via PONTE (ADR-020) para as rotas /api/omics/* da Web
// (joins + paginação + resolução de catálogo no servidor — sem duplicar lógica), autenticando por Bearer. ESCRITAS
// (criar painel, adicionar/remover resultado, excluir painel) direto nas tabelas omics_* (RLS dono). A ingestão por
// IA (upload de laudo) é captura de device + edge, fora deste módulo. Leitura LANÇA; escrita { error }.
import type { SupabaseClient } from '@supabase/supabase-js'
import { asError } from '../net/errors'

export interface OmicsPanelDTO {
  id: string; exam_id: string | null; domain: string; technology: string | null; platform: string | null
  total_features: number | null; laboratory: string | null; collected_on: string | null; created_at: string
}
export interface OmicsCategoryDTO { category_id: string | null; name: string; display_order: number | null; count: number }
export interface OmicsResultDTO {
  id: string; feature_id: string | null; feature_name: string; category_id: string | null
  value: number | null; unit: string | null; raw_value: string | null; detection_status: string | null
  method: string | null; measured_on: string | null
}
export interface OmicsHistoryPoint { measured_on: string | null; value: number | null; unit: string | null; laboratory: string | null }
export interface OmicsCatalogMatch { id: string; canonical_name: string; category_id: string | null; unit_default: string | null }
export interface OmicsPanelDetail { panel: OmicsPanelDTO; categories: OmicsCategoryDTO[]; total_results: number }

export interface OmicsResultInput {
  domain: string; featureId: string | null; featureName: string; categoryId: string | null
  value: number | null; unit: string | null; rawValue: string | null; method: string | null; measuredOn: string | null
}

function base(url: string | undefined): string { if (!url) throw new Error('URL da Web não configurada (ômica).'); return url.replace(/\/+$/, '') }

/** GET autenticado por Bearer numa rota /api/omics/* — reusa a lógica de servidor (joins/paginação). LANÇA em falha. */
async function bridgeGet<T>(client: SupabaseClient, webBaseUrl: string | undefined, path: string): Promise<T> {
  const { data: { session } } = await client.auth.getSession()
  if (!session) throw new Error('Não autenticado')
  const res = await fetch(`${base(webBaseUrl)}${path}`, { headers: { Authorization: `Bearer ${session.access_token}` } })
  if (!res.ok) throw new Error(`Falha ao carregar ômica (${res.status}).`)
  return res.json() as Promise<T>
}

export async function listOmicsPanels(client: SupabaseClient, webBaseUrl: string | undefined, domain?: string): Promise<OmicsPanelDTO[]> {
  const q = domain ? `?domain=${encodeURIComponent(domain)}` : ''
  const json = await bridgeGet<{ panels: OmicsPanelDTO[] }>(client, webBaseUrl, `/api/omics/panels${q}`)
  return json.panels ?? []
}

export async function getOmicsPanel(client: SupabaseClient, webBaseUrl: string | undefined, id: string): Promise<OmicsPanelDetail> {
  return bridgeGet<OmicsPanelDetail>(client, webBaseUrl, `/api/omics/panels/${id}`)
}

export async function getOmicsResults(client: SupabaseClient, webBaseUrl: string | undefined, panelId: string, categoryId?: string | null): Promise<OmicsResultDTO[]> {
  const q = categoryId ? `?category_id=${encodeURIComponent(categoryId)}` : ''
  const json = await bridgeGet<{ results: OmicsResultDTO[] }>(client, webBaseUrl, `/api/omics/panels/${panelId}/results${q}`)
  return json.results ?? []
}

export async function getOmicsFeatureHistory(client: SupabaseClient, webBaseUrl: string | undefined, featureId: string): Promise<OmicsHistoryPoint[]> {
  const json = await bridgeGet<{ history: OmicsHistoryPoint[] }>(client, webBaseUrl, `/api/omics/features/${featureId}/history`)
  return json.history ?? []
}

/** Resolve um termo (nome/sinônimo/ID externo) no catálogo do domínio. Retorna a melhor resolução + candidatos. */
export async function searchOmicsCatalog(client: SupabaseClient, webBaseUrl: string | undefined, term: string, domain: string): Promise<{ resolved: OmicsCatalogMatch | null; matches: OmicsCatalogMatch[] }> {
  if (!term.trim()) return { resolved: null, matches: [] }
  return bridgeGet(client, webBaseUrl, `/api/omics/search?q=${encodeURIComponent(term.trim())}&domain=${encodeURIComponent(domain)}`)
}

// ── Escritas (direto nas tabelas omics_*, RLS dono) ──────────────────────────────────────────────────────────
export async function createOmicsPanel(client: SupabaseClient, input: { domain: string; laboratory?: string | null; technology?: string | null; collectedOn?: string | null }): Promise<{ data: { id: string } | null; error: Error | null }> {
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) return { data: null, error: new Error('Não autenticado') }
    const { data, error } = await client.from('omics_panels').insert({
      user_id: session.user.id, domain: input.domain, laboratory: input.laboratory?.trim() || null,
      technology: input.technology?.trim() || null, collected_on: input.collectedOn || null,
    } as never).select('id').single()
    if (error) return { data: null, error: asError(error) }
    return { data: { id: (data as { id: string }).id }, error: null }
  } catch (e) {
    return { data: null, error: asError(e) }
  }
}

export async function addOmicsResult(client: SupabaseClient, panelId: string, input: OmicsResultInput): Promise<{ error: Error | null }> {
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) return { error: new Error('Não autenticado') }
    if (!input.featureName.trim()) return { error: new Error('Informe a feature') }
    const { error } = await client.from('omics_results').insert({
      panel_id: panelId, user_id: session.user.id, domain: input.domain,
      feature_id: input.featureId, feature_name: input.featureName.trim(), category_id: input.categoryId,
      value: input.value, unit: input.unit?.trim() || null, raw_value: input.rawValue?.trim() || null,
      method: input.method?.trim() || null, measured_on: input.measuredOn || null,
    } as never)
    return { error: error ? asError(error) : null }
  } catch (e) {
    return { error: asError(e) }
  }
}

export async function deleteOmicsResult(client: SupabaseClient, id: string): Promise<{ error: Error | null }> {
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) return { error: new Error('Não autenticado') }
    const { error } = await client.from('omics_results').delete().eq('id', id).eq('user_id', session.user.id)
    return { error: error ? asError(error) : null }
  } catch (e) {
    return { error: asError(e) }
  }
}

export async function deleteOmicsPanel(client: SupabaseClient, id: string): Promise<{ error: Error | null }> {
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) return { error: new Error('Não autenticado') }
    const { error } = await client.from('omics_panels').delete().eq('id', id).eq('user_id', session.user.id)
    return { error: error ? asError(error) : null }
  } catch (e) {
    return { error: asError(e) }
  }
}

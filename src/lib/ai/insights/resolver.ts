// ============================================================
// SINTERA — Motor de Insights: Resolver
// ============================================================
// Resolve biomarcadores extraídos (nome + unidade do laudo) contra o
// catálogo canônico (biomarker_catalog / biomarker_aliases).
//
// Esta é uma porta 1:1 da lógica SQL das migrações 022 e 022b, que hoje
// resolve 100% dos 133 biomarcadores reais em produção. A correspondência
// está anotada clause-a-clause abaixo para facilitar auditoria.
//
// Sem dependência clínica: apenas normalização de texto e casamento de
// apelidos. Não emite juízo de valor sobre os resultados.
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  AliasEntry,
  CatalogEntry,
  CatalogIndex,
  ResolutionResult,
  ResolvableBiomarker,
  BiomarkerCategory,
  MeasureKind,
  Specimen,
} from './types'

// Mapa de remoção de acentos — idêntico ao translate() das migrações 022/022b.
// Maiúsculas e minúsculas acentuadas → ASCII correspondente. O lower() é aplicado depois.
const ACCENT_FROM = 'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇáàâãäéèêëíìîïóòôõöúùûüç'
const ACCENT_TO   = 'AAAAAEEEEIIIIOOOOOUUUUCaaaaaeeeeiiiiooooouuuuc'

const ACCENT_MAP: Record<string, string> = (() => {
  const m: Record<string, string> = {}
  for (let i = 0; i < ACCENT_FROM.length; i++) m[ACCENT_FROM[i]] = ACCENT_TO[i]
  return m
})()

/**
 * Normaliza o nome de um biomarcador exatamente como a SQL:
 *   lower(trim(translate(name, <acentos>, <ascii>)))
 * Remove acentos, passa a minúsculas e remove espaços nas pontas.
 */
export function normalizeBiomarkerName(name: string): string {
  let out = ''
  for (const ch of name) out += ACCENT_MAP[ch] ?? ch
  return out.toLowerCase().trim()
}

/**
 * Seleciona o melhor apelido entre os candidatos de uma mesma chave normalizada,
 * replicando o WHERE + ORDER BY da migração 022b:
 *   WHERE unit_pattern IS NULL
 *      OR (unit IS NOT NULL AND strpos(lower(unit), lower(unit_pattern)) > 0)   -- substring LITERAL
 *   ORDER BY (unit_pattern IS NOT NULL) DESC,        -- apelido com unidade vence o genérico
 *            length(coalesce(unit_pattern,'')) DESC  -- pattern mais específico vence
 * Retorna o apelido vencedor, ou null se nenhum for elegível.
 */
function pickBestAlias(candidates: AliasEntry[], unit: string | null): AliasEntry | null {
  const unitLower = unit ? unit.toLowerCase() : null

  const eligible = candidates.filter(a => {
    if (a.unitPattern === null) return true
    if (unitLower === null) return false
    // strpos(...) > 0 → substring literal (não LIKE): includes() é literal
    return unitLower.includes(a.unitPattern.toLowerCase())
  })

  if (eligible.length === 0) return null

  eligible.sort((a, b) => {
    const aHasPattern = a.unitPattern !== null
    const bHasPattern = b.unitPattern !== null
    if (aHasPattern !== bHasPattern) return aHasPattern ? -1 : 1 // com unidade primeiro
    const aLen = a.unitPattern?.length ?? 0
    const bLen = b.unitPattern?.length ?? 0
    return bLen - aLen // pattern mais longo (específico) primeiro
  })

  return eligible[0]
}

/**
 * Resolve um único biomarcador contra o índice do catálogo.
 * Não toca o banco — opera sobre o índice carregado por loadCatalogIndex().
 */
export function resolveBiomarker(
  index: CatalogIndex,
  biomarker: ResolvableBiomarker,
): ResolutionResult {
  const normalizedKey = normalizeBiomarkerName(biomarker.name)
  const candidates = index.aliasesByName.get(normalizedKey) ?? []
  const best = pickBestAlias(candidates, biomarker.unit)

  return {
    catalog: best ? index.byId.get(best.catalogId) ?? null : null,
    normalizedKey,
    disambiguatedByUnit: best !== null && candidates.length > 1 && best.unitPattern !== null,
  }
}

/**
 * Carrega catálogo + apelidos do banco e monta o índice em memória.
 * Leitura única; o índice pode ser reaproveitado para um lote de biomarcadores.
 * Usa o client recebido (respeita RLS — ambas as tabelas têm policy de SELECT
 * para authenticated, ver migração 022).
 */
export async function loadCatalogIndex(supabase: SupabaseClient): Promise<CatalogIndex> {
  const [catalogRes, aliasRes] = await Promise.all([
    supabase
      .from('biomarker_catalog')
      .select('id, code, display_name, category, specimen, canonical_unit, measure_kind, is_critical'),
    supabase
      .from('biomarker_aliases')
      .select('alias_normalized, catalog_id, unit_pattern'),
  ])

  if (catalogRes.error) throw new Error(`Falha ao carregar biomarker_catalog: ${catalogRes.error.message}`)
  if (aliasRes.error) throw new Error(`Falha ao carregar biomarker_aliases: ${aliasRes.error.message}`)

  const byId = new Map<string, CatalogEntry>()
  for (const row of (catalogRes.data ?? []) as Array<Record<string, unknown>>) {
    const entry: CatalogEntry = {
      id: row.id as string,
      code: row.code as string,
      displayName: row.display_name as string,
      category: row.category as BiomarkerCategory,
      specimen: row.specimen as Specimen,
      canonicalUnit: (row.canonical_unit as string | null) ?? null,
      measureKind: row.measure_kind as MeasureKind,
      isCritical: row.is_critical === true,
    }
    byId.set(entry.id, entry)
  }

  const aliasesByName = new Map<string, AliasEntry[]>()
  for (const row of (aliasRes.data ?? []) as Array<Record<string, unknown>>) {
    const alias: AliasEntry = {
      aliasNormalized: row.alias_normalized as string,
      catalogId: row.catalog_id as string,
      unitPattern: (row.unit_pattern as string | null) ?? null,
    }
    const list = aliasesByName.get(alias.aliasNormalized)
    if (list) list.push(alias)
    else aliasesByName.set(alias.aliasNormalized, [alias])
  }

  return { byId, aliasesByName }
}

/**
 * Conveniência: carrega o índice e resolve um lote de biomarcadores de uma vez.
 * Retorna cada entrada com sua resolução (catalog pode ser null se não casar).
 */
export async function resolveBiomarkers(
  supabase: SupabaseClient,
  biomarkers: ResolvableBiomarker[],
): Promise<Array<{ input: ResolvableBiomarker; resolution: ResolutionResult }>> {
  const index = await loadCatalogIndex(supabase)
  return biomarkers.map(input => ({ input, resolution: resolveBiomarker(index, input) }))
}

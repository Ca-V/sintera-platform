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
 * Lê TODAS as linhas de uma consulta paginando em páginas de 1.000.
 * O PostgREST/Supabase devolve no máximo ~1.000 linhas por requisição e
 * truncaria silenciosamente catálogos maiores — por isso paginamos até a
 * última página. Essencial para escalar a centenas/milhares de biomarcadores.
 */
async function fetchAllPaged(
  makeQuery: (from: number, to: number) => PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>,
  label: string,
): Promise<Array<Record<string, unknown>>> {
  const PAGE = 1000
  const all: Array<Record<string, unknown>> = []
  let from = 0
  for (;;) {
    const { data, error } = await makeQuery(from, from + PAGE - 1)
    if (error) throw new Error(`Falha ao carregar ${label}: ${error.message}`)
    const rows = (data ?? []) as Array<Record<string, unknown>>
    all.push(...rows)
    if (rows.length < PAGE) break // última página
    from += PAGE
  }
  return all
}

/**
 * Carrega catálogo + apelidos do banco e monta o índice em memória.
 * Leitura única (paginada). Usado pela camada de cache abaixo.
 * Usa o client recebido (respeita RLS — ambas as tabelas têm policy de SELECT
 * para authenticated, ver migração 022).
 */
async function fetchCatalogIndex(supabase: SupabaseClient): Promise<CatalogIndex> {
  const [catalogRows, aliasRows] = await Promise.all([
    fetchAllPaged(
      (from, to) => supabase
        .from('biomarker_catalog')
        .select('id, code, display_name, category, specimen, canonical_unit, measure_kind, is_critical')
        .range(from, to),
      'biomarker_catalog',
    ),
    fetchAllPaged(
      (from, to) => supabase
        .from('biomarker_aliases')
        .select('alias_normalized, catalog_id, unit_pattern')
        .range(from, to),
      'biomarker_aliases',
    ),
  ])

  const byId = new Map<string, CatalogEntry>()
  for (const row of catalogRows) {
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
  for (const row of aliasRows) {
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

// ── Cache do índice ───────────────────────────────────────────────────────────
// O catálogo/apelidos mudam raramente (só por curadoria) e são GLOBAIS — a RLS
// é `USING (true)` para authenticated, então o índice é idêntico para todas as
// usuárias e pode ser cacheado no processo com segurança (sem dado individual).
// Evita rebuscar dezenas de milhares de apelidos a cada extração. Em ambiente
// serverless o cache vive na instância "quente"; cold starts recarregam.
const CATALOG_CACHE_TTL_MS = Number(process.env.CATALOG_CACHE_TTL_MS ?? 5 * 60 * 1000)
let cachedIndex: { index: CatalogIndex; expiresAt: number } | null = null

/** Invalida o cache do índice (testes ou após uma atualização de curadoria). */
export function clearCatalogIndexCache(): void {
  cachedIndex = null
}

/**
 * Retorna o índice do catálogo, servindo do cache em memória quando válido.
 * Passe `{ forceReload: true }` para ignorar o cache (ex.: logo após curadoria).
 */
export async function loadCatalogIndex(
  supabase: SupabaseClient,
  opts: { forceReload?: boolean } = {},
): Promise<CatalogIndex> {
  const now = Date.now()
  if (!opts.forceReload && cachedIndex && cachedIndex.expiresAt > now) {
    return cachedIndex.index
  }
  const index = await fetchCatalogIndex(supabase)
  cachedIndex = { index, expiresAt: now + CATALOG_CACHE_TTL_MS }
  return index
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

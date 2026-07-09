// ============================================================
// SINTERA — Motor de Insights: Assembler (serviço de DOMÍNIO)
// ============================================================
// Organiza os biomarcadores de um exame OU de toda a pessoa, já resolvidos
// contra o catálogo, mais o perfil (no contexto per-exame do motor clínico).
//
// É serviço de DOMÍNIO, não componente de UI: devolve dados organizados; a tela
// adapta a apresentação. Nenhuma tela reagrupa por conta própria — todas
// consomem o mesmo objeto (SSOT da organização dos exames).
//
// Não cria informação clínica. `rangeStatus` é aritmético (valor vs. intervalo
// IMPRESSO no laudo). A criticidade clínica (clinical_flag) é do motor
// determinístico — que depende de aprovação clínica e NÃO está aqui.
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import { loadCatalogIndex, resolveBiomarker } from './resolver'
import type {
  AssembledBiomarker,
  AssembledProfile,
  BiomarkerCategory,
  CatalogIndex,
  InsightContext,
  OrganizedBiomarkers,
  RangeStatus,
  ResolvableBiomarker,
} from './types'

/** Linha de biomarcador como vem da tabela `current_biomarkers`. */
interface BiomarkerRow {
  id: string
  name: string
  unit: string | null
  value: number | null
  value_text: string | null
  result_type: string
  reference_min: number | null
  reference_max: number | null
  reference_source: string
  catalog_id: string | null
}

const BIOMARKER_COLUMNS =
  'id, name, unit, value, value_text, result_type, reference_min, reference_max, reference_source, catalog_id'

/**
 * Status aritmético do valor em relação ao intervalo impresso no laudo.
 * Só compara números; nunca infere faixa por conhecimento externo.
 */
export function computeRangeStatus(row: {
  result_type: string
  value: number | null
  reference_min: number | null
  reference_max: number | null
}): RangeStatus {
  if (row.result_type !== 'numeric' || row.value === null) return 'non_numeric'
  const { value, reference_min, reference_max } = row
  if (reference_min === null && reference_max === null) return 'no_reference'
  if (reference_min !== null && value < reference_min) return 'below'
  if (reference_max !== null && value > reference_max) return 'above'
  return 'within'
}

/** Enriquece uma linha de biomarcador com dados do catálogo + status de faixa. */
function assembleBiomarker(row: BiomarkerRow, index: CatalogIndex): AssembledBiomarker {
  // Prefere catalog_id já persistido; resolve em runtime se ausente (ex.: exame antigo).
  let catalog = row.catalog_id ? index.byId.get(row.catalog_id) ?? null : null
  if (!catalog) {
    const res = resolveBiomarker(index, { name: row.name, unit: row.unit })
    catalog = res.catalog
  }

  return {
    id: row.id,
    name: row.name,
    catalogId: catalog?.id ?? null,
    catalogCode: catalog?.code ?? null,
    displayName: catalog?.displayName ?? null,
    category: catalog?.category ?? null,
    isCritical: catalog?.isCritical ?? false,
    value: row.value,
    valueText: row.value_text,
    unit: row.unit,
    resultType: row.result_type,
    referenceMin: row.reference_min,
    referenceMax: row.reference_max,
    referenceSource: row.reference_source,
    rangeStatus: computeRangeStatus(row),
  }
}

/**
 * SSOT do AGRUPAMENTO — função PURA (sem I/O), reutilizada por qualquer escopo.
 * Nenhum consumidor reimplementa isto. Agrupa por categoria, separa fora-de-faixa
 * (aritmético) e lista os não resolvidos.
 */
export function organizeBiomarkers(biomarkers: AssembledBiomarker[]): {
  byCategory: Partial<Record<BiomarkerCategory, AssembledBiomarker[]>>
  outOfPrintedRange: AssembledBiomarker[]
  unresolved: ResolvableBiomarker[]
} {
  const byCategory: Partial<Record<BiomarkerCategory, AssembledBiomarker[]>> = {}
  const unresolved: ResolvableBiomarker[] = []
  for (const b of biomarkers) {
    if (b.category) {
      const list = byCategory[b.category]
      if (list) list.push(b)
      else byCategory[b.category] = [b]
    } else {
      unresolved.push({ name: b.name, unit: b.unit })
    }
  }
  const outOfPrintedRange = biomarkers.filter(
    b => b.rangeStatus === 'below' || b.rangeStatus === 'above',
  )
  return { byCategory, outOfPrintedRange, unresolved }
}

/** Carrega e enriquece os biomarcadores de um exame OU de toda a pessoa (RLS aplicada). */
async function loadAssembledBiomarkers(
  supabase: SupabaseClient,
  index: CatalogIndex,
  filter: { userId: string; examId?: string },
): Promise<AssembledBiomarker[]> {
  let query = supabase
    .from('current_biomarkers')
    .select(BIOMARKER_COLUMNS)
    .eq('user_id', filter.userId)
  if (filter.examId) query = query.eq('exam_id', filter.examId)

  const res = await query
  if (res.error) {
    throw new Error(`Falha ao carregar biomarcadores: ${res.error.message}`)
  }
  const rows = (res.data ?? []) as unknown as BiomarkerRow[]
  return rows.map(r => assembleBiomarker(r, index))
}

/**
 * SERVIÇO DE DOMÍNIO — organização factual reutilizável. `scope`:
 *   - com `examId`  → organiza um exame;
 *   - sem `examId`  → agrega TODOS os biomarcadores atuais da pessoa.
 * Devolve o contrato `OrganizedBiomarkers` (screen-agnostic). Consumido por
 * Dashboard, Relatório, Timeline, visão do médico — todos o mesmo objeto.
 */
export async function assembleOrganizedBiomarkers(
  supabase: SupabaseClient,
  params: { userId: string; examId?: string },
): Promise<OrganizedBiomarkers> {
  const index = await loadCatalogIndex(supabase)
  const biomarkers = await loadAssembledBiomarkers(supabase, index, params)
  const { byCategory, outOfPrintedRange, unresolved } = organizeBiomarkers(biomarkers)

  return {
    scope: params.examId ? 'exam' : 'user',
    examId: params.examId ?? null,
    userId: params.userId,
    biomarkers,
    byCategory,
    outOfPrintedRange,
    unresolved,
    counts: {
      total:      biomarkers.length,
      categories: Object.keys(byCategory).length,
      outOfRange: outOfPrintedRange.length,
      unresolved: unresolved.length,
    },
    generatedAt: new Date().toISOString(),
  }
}

/**
 * Monta o contexto PER-EXAME do motor determinístico (futuro, clínico):
 * organização factual + perfil + `criticalPresent` (flag de catálogo).
 * Reusa a MESMA lógica de agrupamento (`organizeBiomarkers`). Usa o client
 * recebido (RLS garante que só dados da própria usuária são lidos).
 */
export async function assembleInsightContext(
  supabase: SupabaseClient,
  params: { examId: string; userId: string },
): Promise<InsightContext> {
  const { examId, userId } = params

  const index = await loadCatalogIndex(supabase)
  const [biomarkers, profileRes] = await Promise.all([
    loadAssembledBiomarkers(supabase, index, { userId, examId }),
    supabase
      .from('profiles')
      .select('age_range, cycle_length, cycle_regularity')
      .eq('id', userId)
      .maybeSingle(),
  ])

  const { byCategory, outOfPrintedRange, unresolved } = organizeBiomarkers(biomarkers)
  const criticalPresent = biomarkers.filter(b => b.isCritical)

  const profileRow = (profileRes.data ?? null) as {
    age_range: string | null
    cycle_length: number | null
    cycle_regularity: string | null
  } | null

  const profile: AssembledProfile | null = profileRow
    ? {
        ageRange: profileRow.age_range,
        cycleLength: profileRow.cycle_length,
        cycleRegularity: profileRow.cycle_regularity,
      }
    : null

  return {
    examId,
    userId,
    profile,
    biomarkers,
    byCategory,
    outOfPrintedRange,
    criticalPresent,
    unresolved,
    generatedAt: new Date().toISOString(),
  }
}

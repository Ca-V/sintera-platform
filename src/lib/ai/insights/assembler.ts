// ============================================================
// SINTERA — Motor de Insights: Assembler
// ============================================================
// Monta um contexto estruturado a partir dos biomarcadores de um exame,
// já resolvidos contra o catálogo, mais o perfil da usuária.
//
// Não cria informação clínica. `rangeStatus` é aritmético (valor vs.
// intervalo IMPRESSO no laudo). A classificação de criticidade
// (clinical_flag) é responsabilidade do motor determinístico — que
// depende de aprovação clínica e NÃO está implementado aqui.
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import { loadCatalogIndex, resolveBiomarker } from './resolver'
import type {
  AssembledBiomarker,
  AssembledProfile,
  BiomarkerCategory,
  CatalogIndex,
  InsightContext,
  RangeStatus,
  ResolvableBiomarker,
} from './types'

/** Linha de biomarcador como vem da tabela `biomarkers`. */
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
 * Monta o contexto completo de um exame. Carrega biomarcadores + perfil,
 * resolve contra o catálogo e organiza por categoria, fora-de-faixa e críticos.
 * Usa o client recebido (RLS garante que só dados da própria usuária são lidos).
 */
export async function assembleInsightContext(
  supabase: SupabaseClient,
  params: { examId: string; userId: string },
): Promise<InsightContext> {
  const { examId, userId } = params

  const [index, biomarkersRes, profileRes] = await Promise.all([
    loadCatalogIndex(supabase),
    supabase
      .from('biomarkers')
      .select('id, name, unit, value, value_text, result_type, reference_min, reference_max, reference_source, catalog_id')
      .eq('exam_id', examId)
      .eq('user_id', userId),
    supabase
      .from('profiles')
      .select('age_range, cycle_length, cycle_regularity')
      .eq('id', userId)
      .maybeSingle(),
  ])

  if (biomarkersRes.error) {
    throw new Error(`Falha ao carregar biomarcadores: ${biomarkersRes.error.message}`)
  }

  const rows = (biomarkersRes.data ?? []) as unknown as BiomarkerRow[]
  const biomarkers = rows.map(r => assembleBiomarker(r, index))

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

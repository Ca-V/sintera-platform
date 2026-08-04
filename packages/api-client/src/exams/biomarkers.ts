// @sintera/api-client — leitura dos RESULTADOS estruturados de um exame (biomarcadores), FIEL ao laudo.
// Lê a view `current_biomarkers` (mesma fonte da Web); RLS limita ao dono via propriedade do exame.
// Contrato do pacote: `[]` se não houver; LANÇA em falha operacional (rede/timeout/DB/auth). SÓ leitura/
// projeção — a interpretação já vem calculada do backend (nunca recomputada aqui). REG-001: FACTUAL.
import type { SupabaseClient } from '@supabase/supabase-js'
import { withTimeout } from '../net/timeout'
import { asError } from '../net/errors'

/** Um resultado estruturado como LIDO do laudo. Campos fiéis à `current_biomarkers` (Fidelidade da Ingestão). */
export interface BiomarkerDTO {
  id: string
  name: string
  value: number | null            // resultado numérico (null p/ qualitativo/ausente)
  value_text: string | null       // resultado descritivo (qualitativo)
  unit: string | null
  reference_min: number | null    // faixa de referência do documento (quando impressa)
  reference_max: number | null
  interpretation: string | null   // já calculada pelo backend (acima/abaixo/dentro/…); NUNCA recomputar
  result_type: string | null      // numeric | qualitative | missing | extraction_failed
  range_extracted: boolean
  reference_source: string | null // laudo | catalog | ausente | …
  source: string | null           // origem do resultado (ai_extracted | laudo | manual | catalog)
  catalog_id: string | null       // vínculo ao biomarker_catalog (enriquecimento de rótulo/material)
  source_material: string | null  // material do laudo (sangue/urina…) — fiel ao documento
  source_exam_name: string | null // nome do exame no laudo — fiel ao documento
}

/** Colunas lidas — explícitas (não `*`), idênticas às que a Web consome de `current_biomarkers`. */
export const BIOMARKER_COLUMNS =
  'id, name, value, value_text, unit, reference_min, reference_max, interpretation, result_type, range_extracted, reference_source, source, catalog_id, source_material, source_exam_name' as const

/** Projeta a linha da view no DTO (só o contrato; sem recomputar interpretação). */
export function toBiomarkerDTO(row: Record<string, unknown>): BiomarkerDTO {
  return {
    id: row.id as string,
    name: (row.name as string | null) ?? '',
    value: (row.value as number | null) ?? null,
    value_text: (row.value_text as string | null) ?? null,
    unit: (row.unit as string | null) ?? null,
    reference_min: (row.reference_min as number | null) ?? null,
    reference_max: (row.reference_max as number | null) ?? null,
    interpretation: (row.interpretation as string | null) ?? null,
    result_type: (row.result_type as string | null) ?? null,
    range_extracted: (row.range_extracted as boolean | null) ?? false,
    reference_source: (row.reference_source as string | null) ?? null,
    source: (row.source as string | null) ?? null,
    catalog_id: (row.catalog_id as string | null) ?? null,
    source_material: (row.source_material as string | null) ?? null,
    source_exam_name: (row.source_exam_name as string | null) ?? null,
  }
}

/** Lê os resultados estruturados de um exame. `[]` se não houver/for de outro usuário (RLS). LANÇA em falha. */
export async function getExamBiomarkers(
  client: SupabaseClient,
  examId: string,
  signal?: AbortSignal,
): Promise<BiomarkerDTO[]> {
  const { signal: s, cleanup } = withTimeout(signal)
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) throw new Error('Não autenticado')

    const { data, error } = await client
      .from('current_biomarkers')
      .select(BIOMARKER_COLUMNS)
      .eq('exam_id', examId)
      .abortSignal(s)

    if (error) throw asError(error)
    return ((data as Record<string, unknown>[] | null) ?? []).map(toBiomarkerDTO)
  } finally {
    cleanup()
  }
}

// @sintera/api-client — leitura dos RESULTADOS CLÍNICOS não-laboratoriais (CPE) de um exame, como linhas de
// `clinical_results`. O consumidor converte para UCDA (contrato canônico) via @sintera/core. RLS limita ao dono.
// `[]` se não houver; LANÇA em falha operacional. FACTUAL (REG-001) — só leitura/projeção.
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ClinicalResultRow } from '@sintera/core'
import { withTimeout } from '../net/timeout'
import { asError } from '../net/errors'

const CLINICAL_COLUMNS =
  'clinical_model, result_kind, item_type, name, value_text, value_num, unit, code, code_system, value_code, region, anatomy, specimen, method, context, group_label, reference_text, page, raw_text' as const

/** Lê os resultados clínicos (CPE) de um exame. `[]` se não houver. LANÇA em falha. */
export async function getExamClinicalResults(
  client: SupabaseClient,
  examId: string,
  signal?: AbortSignal,
): Promise<ClinicalResultRow[]> {
  const { signal: s, cleanup } = withTimeout(signal)
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) throw new Error('Não autenticado')

    const { data, error } = await client
      .from('clinical_results')
      .select(CLINICAL_COLUMNS)
      .eq('exam_id', examId)
      .abortSignal(s)

    if (error) throw asError(error)
    return (data as ClinicalResultRow[] | null) ?? []
  } finally {
    cleanup()
  }
}

// @sintera/api-client — última extração bem-sucedida de um exame (ai_processing_log). Informativo no detalhe
// (paridade Web: "Última extração: … · reparado automaticamente · leitura nativa PDF"). RLS limita ao dono.
import type { SupabaseClient } from '@supabase/supabase-js'
import { withTimeout } from '../net/timeout'
import { asError } from '../net/errors'
import type { ExamExtractionLog } from './types'

export async function getLastExtractionLog(
  client: SupabaseClient,
  examId: string,
  signal?: AbortSignal,
): Promise<ExamExtractionLog | null> {
  const { signal: s, cleanup } = withTimeout(signal)
  try {
    const { data, error } = await client
      .from('ai_processing_log')
      .select('started_at, parse_repaired, extraction_path')
      .eq('exam_id', examId)
      .eq('status', 'success')
      .order('started_at', { ascending: false })
      .limit(1)
      .abortSignal(s)
    if (error) throw asError(error)
    const row = (data as Record<string, unknown>[] | null)?.[0]
    return row
      ? {
          started_at: row.started_at as string,
          parse_repaired: Boolean(row.parse_repaired),
          extraction_path: (row.extraction_path as string | null) ?? null,
        }
      : null
  } finally {
    cleanup()
  }
}

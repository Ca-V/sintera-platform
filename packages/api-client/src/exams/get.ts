// @sintera/api-client — leitura de um exame por id (domínio Exames · leitura). Recebe o cliente Supabase.
// Contrato: `null` se não existir/for de outro usuário (RLS); LANÇA em falha operacional.
import type { SupabaseClient } from '@supabase/supabase-js'
import { withTimeout } from '../net/timeout'
import { EXAM_DETAIL_COLUMNS, type ExamDetailDTO } from './types'
import { toExamDetailDTO } from './map'
import { asError } from '../net/errors'

export async function getExam(client: SupabaseClient, id: string, signal?: AbortSignal): Promise<ExamDetailDTO | null> {
  const { signal: s, cleanup } = withTimeout(signal)
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) throw new Error('Não autenticado')

    const { data, error } = await client
      .from('exams')
      .select(EXAM_DETAIL_COLUMNS)
      .eq('id', id)
      .eq('user_id', session.user.id)
      .abortSignal(s)
      .maybeSingle()

    if (error) throw asError(error)                        // falha operacional → LANÇA
    return data ? toExamDetailDTO(data as Record<string, unknown>) : null // sem linha → null
  } finally {
    cleanup()
  }
}

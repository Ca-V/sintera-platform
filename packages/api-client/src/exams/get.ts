// @sintera/api-client — leitura de um exame por id (domínio Exames · leitura). Recebe o cliente Supabase.
// Contrato: `null` se não existir/for de outro usuário (RLS); LANÇA em falha operacional.
import type { SupabaseClient } from '@supabase/supabase-js'
import { withTimeout } from '../net/timeout'
import { EXAM_COLUMNS, type ExamDTO } from './types'
import { asError, toExamDTO } from './map'

export async function getExam(client: SupabaseClient, id: string, signal?: AbortSignal): Promise<ExamDTO | null> {
  const { signal: s, cleanup } = withTimeout(signal)
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) throw new Error('Não autenticado')

    const { data, error } = await client
      .from('exams')
      .select(EXAM_COLUMNS)
      .eq('id', id)
      .eq('user_id', session.user.id)
      .abortSignal(s)
      .maybeSingle()

    if (error) throw asError(error)                        // falha operacional → LANÇA
    return data ? toExamDTO(data as Record<string, unknown>) : null // sem linha → null
  } finally {
    cleanup()
  }
}

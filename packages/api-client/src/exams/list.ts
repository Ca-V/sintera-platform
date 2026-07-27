// @sintera/api-client — lista de exames do usuário (domínio Exames · leitura). Recebe o cliente Supabase.
// Contrato: devolve os exames do usuário (mais recentes primeiro); `[]` se não houver; LANÇA em falha.
import type { SupabaseClient } from '@supabase/supabase-js'
import { withTimeout } from '../net/timeout'
import { EXAM_COLUMNS, type ExamDTO } from './types'
import { asError, toExamDTO } from './map'

export async function listExams(client: SupabaseClient, signal?: AbortSignal): Promise<ExamDTO[]> {
  const { signal: s, cleanup } = withTimeout(signal)
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) throw new Error('Não autenticado')

    const { data, error } = await client
      .from('exams')
      .select(EXAM_COLUMNS)
      .eq('user_id', session.user.id)
      .order('exam_date', { ascending: false, nullsFirst: false })
      .abortSignal(s)

    if (error) throw asError(error)                       // falha operacional → LANÇA
    return (data ?? []).map((row) => toExamDTO(row as Record<string, unknown>)) // sem linhas → []
  } finally {
    cleanup()
  }
}

// @sintera/api-client — leitura dos EXAMES-com-valor para a projeção de Despesas (FB-008). RLS: dono.
// Retorna as linhas cruas (o core projeta via examExpenseToEntry). `[]` se não houver; LANÇA em falha.
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ExamExpenseRow } from '@sintera/core'
import { withTimeout } from '../net/timeout'
import { asError } from '../net/errors'

const COLUMNS = 'id, type, exam_date, created_at, issuer, expense_amount_cents, expense_doc_type, expense_doc_url' as const

/** Exames do usuário com valor pago (> 0), para as Despesas. `[]` se não houver. LANÇA em falha. */
export async function listExamExpenses(client: SupabaseClient, signal?: AbortSignal): Promise<ExamExpenseRow[]> {
  const { signal: s, cleanup } = withTimeout(signal)
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) throw new Error('Não autenticado')

    const { data, error } = await client
      .from('exams')
      .select(COLUMNS)
      .eq('user_id', session.user.id)
      .gt('expense_amount_cents', 0)
      .abortSignal(s)

    if (error) throw asError(error)
    return (data as ExamExpenseRow[] | null) ?? []
  } finally {
    cleanup()
  }
}

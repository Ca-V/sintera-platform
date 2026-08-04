// @sintera/api-client — ESCRITA de campos editáveis de um exame (domínio Exames). Espelha exatamente as edições
// que a Web faz por `exams.update({...})` no detalhe: renomear (`type`), data (`exam_date`), financeiro do exame
// (FB-008: `expense_amount_cents`/`expense_doc_type`/`expense_doc_url`) e vínculo de origem (`fulfills_order_id`).
// MESMA regra de negócio, contrato ÚNICO. Convenção de escrita: NÃO lança; retorna `{ error }`. RLS garante o dono.
import type { SupabaseClient } from '@supabase/supabase-js'
import { withTimeout } from '../net/timeout'
import { asError } from '../net/errors'

/** Campos editáveis pelo usuário no detalhe do exame (whitelist — nada além disto é escrito). */
export interface ExamFieldsPatch {
  type?: string                       // renomear (rótulo do exame)
  exam_date?: string | null           // data do exame (YYYY-MM-DD)
  expense_amount_cents?: number | null
  expense_doc_type?: string | null
  expense_doc_url?: string | null
  fulfills_order_id?: string | null   // vínculo ao pedido de origem (Q1)
}

const ALLOWED: (keyof ExamFieldsPatch)[] = [
  'type', 'exam_date', 'expense_amount_cents', 'expense_doc_type', 'expense_doc_url', 'fulfills_order_id',
]

/** Atualiza os campos editáveis do exame (whitelist). `{ error: null }` em sucesso. NÃO lança. */
export async function updateExam(
  client: SupabaseClient,
  id: string,
  patch: ExamFieldsPatch,
  signal?: AbortSignal,
): Promise<{ error: Error | null }> {
  const { signal: s, cleanup } = withTimeout(signal)
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) return { error: new Error('Não autenticado') }

    // Só as chaves permitidas e efetivamente presentes no patch entram no update.
    const clean: Record<string, unknown> = {}
    for (const k of ALLOWED) if (k in patch) clean[k] = patch[k]
    if (Object.keys(clean).length === 0) return { error: null } // nada a fazer

    const { error } = await client
      .from('exams')
      .update(clean as never)
      .eq('id', id)
      .eq('user_id', session.user.id)
      .abortSignal(s)

    return { error: error ? asError(error) : null }
  } catch (e) {
    return { error: asError(e) }
  } finally {
    cleanup()
  }
}

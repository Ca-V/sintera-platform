// @sintera/api-client — CRIAÇÃO do registro de exame (domínio Exames · escrita, etapa 2). Recebe o cliente
// Supabase (interno ao pacote). Persiste os metadados apontando para o arquivo já enviado, com `status:'pending'`
// (a extração é posterior e server-side — MOBILE-027 §7.2.1). Paridade com o insert da Web; `id`/`created_at`/
// `status` têm default no banco (verificado), então só `user_id` (sessão) + `type` + `file_url` são setados.
// Convenção de escrita: retorna `{ data, error }` — NUNCA lança.
import type { SupabaseClient } from '@supabase/supabase-js'
import { withTimeout } from '../net/timeout'
import { asError } from '../net/errors'
import type { CreateExamInput } from './write'

export async function createExam(
  client: SupabaseClient,
  input: CreateExamInput,
  signal?: AbortSignal,
): Promise<{ data: { id: string } | null; error: Error | null }> {
  const { signal: s, cleanup } = withTimeout(signal)
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) return { data: null, error: new Error('Não autenticado') }

    // WHITELIST estrita — nunca repassa chaves arbitrárias. id/status/created_at ficam a cargo do default do banco.
    const payload = {
      user_id: session.user.id,
      type: input.type,
      file_url: input.file_url,
      exam_date: input.exam_date ?? null,
      status: 'pending',
    }
    const { data, error } = await client
      .from('exams')
      .insert(payload as never)
      .select('id')
      .abortSignal(s)
      .single()
    if (error) return { data: null, error: asError(error) }
    return { data: { id: (data as { id: string }).id }, error: null }
  } catch (e) {
    return { data: null, error: asError(e) }
  } finally {
    cleanup()
  }
}

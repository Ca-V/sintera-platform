// @sintera/api-client — lista de exames do usuário (domínio Exames · leitura). Recebe o cliente Supabase.
// Contrato: exames do usuário (mais recentes primeiro), com filtros/paginação opcionais; `[]` se não houver;
// LANÇA em falha operacional (rede/timeout/DB/auth).
import type { SupabaseClient } from '@supabase/supabase-js'
import { withTimeout } from '../net/timeout'
import { EXAM_COLUMNS, type ExamDTO, type ExamsQuery } from './types'
import { asError, toExamDTO } from './map'

export async function listExams(
  client: SupabaseClient,
  query: ExamsQuery = {},
  signal?: AbortSignal,
): Promise<ExamDTO[]> {
  const { signal: s, cleanup } = withTimeout(signal)
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) throw new Error('Não autenticado')

    // Filtros opcionais encadeados; ordena por data (mais recentes primeiro).
    let q = client.from('exams').select(EXAM_COLUMNS).eq('user_id', session.user.id)
    if (query.from) q = q.gte('exam_date', query.from)
    if (query.to) q = q.lte('exam_date', query.to)
    if (query.type) q = q.eq('document_type', query.type)
    if (query.family) q = q.eq('clinical_family', query.family)
    q = q.order('exam_date', { ascending: false, nullsFirst: false })
    // Paginação (opcional): range é inclusivo [offset, offset+limit-1].
    if (typeof query.limit === 'number') {
      const offset = query.offset ?? 0
      q = q.range(offset, offset + query.limit - 1)
    }

    const { data, error } = await q.abortSignal(s)
    if (error) throw asError(error)                       // falha operacional → LANÇA
    return (data ?? []).map((row) => toExamDTO(row as Record<string, unknown>)) // sem linhas → []
  } finally {
    cleanup()
  }
}

// @sintera/api-client — EXCLUSÃO de exame (domínio Exames · escrita). Remove o arquivo do Storage (best-effort) e
// o registro; a CASCATA de FKs (verificada) limpa biomarkers/logs/insights/scores/clinical_results/extraction_
// versions/omics. LGPD-positivo (a pessoa apaga o próprio dado). Convenção de escrita: { error } — não lança.
//
// PENDÊNCIA DE INFRA (isolada — MOBILE-030): a tabela `exams` ainda NÃO tem política RLS de DELETE; enquanto ela
// não existir, esta função retorna erro (a RLS bloqueia o delete). O código está pronto; falta só a migration.
import type { SupabaseClient } from '@supabase/supabase-js'
import { withTimeout } from '../net/timeout'
import { asError } from '../net/errors'

/** Caminho no bucket 'exams' a partir da URL (assinada) do arquivo. `null` se não reconhecer o formato. Puro. */
export function storagePathFromUrl(fileUrl: string | null | undefined): string | null {
  if (!fileUrl) return null
  const m = fileUrl.match(/\/exams\/([^?]+)/)
  return m ? decodeURIComponent(m[1]) : null
}

export async function deleteExam(
  client: SupabaseClient,
  id: string,
  signal?: AbortSignal,
): Promise<{ error: Error | null }> {
  const { signal: s, cleanup } = withTimeout(signal)
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) return { error: new Error('Não autenticado') }

    // Remove o arquivo do Storage (best-effort; a RLS de storage confina ao dono; não bloqueia a exclusão).
    const { data: row } = await client.from('exams').select('file_url').eq('id', id).single()
    const path = storagePathFromUrl((row as { file_url: string | null } | null)?.file_url)
    if (path) {
      await client.storage.from('exams').remove([path])
    }

    // Exclui o registro (a cascata de FKs cuida dos dependentes).
    const { error } = await client.from('exams').delete().eq('id', id).abortSignal(s)
    return { error: error ? asError(error) : null }
  } catch (e) {
    return { error: asError(e) }
  } finally {
    cleanup()
  }
}

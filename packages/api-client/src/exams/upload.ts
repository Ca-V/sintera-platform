// @sintera/api-client — UPLOAD físico do documento ao Storage (domínio Exames · escrita, etapa 1). Recebe o
// cliente Supabase (interno ao pacote). Paridade com a Web (`src/lib/capture/processors/exam.ts`): bucket
// `exams`, path `${userId}/<id-gerado>.<ext>` (o NOME do arquivo NUNCA é identificador — segurança), signed URL
// de 1 ano. Convenção de escrita: retorna `{ data, error }` — NUNCA lança. Backend/RLS revalidam a permissão.
import type { SupabaseClient } from '@supabase/supabase-js'
import { asError } from '../net/errors'
import type { UploadResult } from './write'

// Extensão canônica por MIME (o conteúdo real manda; a extensão é só para o nome no Storage).
const EXT_BY_MIME: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/heic': 'heic',
}

/** Identificador de arquivo portável (RN/Web) — unicidade dentro da pasta do usuário (não é token de segurança;
 *  a proteção é a RLS + o path user-scoped). Evita depender de `crypto.randomUUID` (ausente em parte do RN). */
function storageId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
}

export async function uploadExam(
  client: SupabaseClient,
  file: { uri: string; mimeType: string; sizeBytes: number },
): Promise<{ data: UploadResult | null; error: Error | null }> {
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) return { data: null, error: new Error('Não autenticado') }

    const ext = EXT_BY_MIME[file.mimeType] ?? 'bin'
    const path = `${session.user.id}/${storageId()}.${ext}`

    // Lê os bytes do uri (file:// no Mobile · blob/obj URL na Web) — padrão oficial Supabase para RN.
    const bytes = await fetch(file.uri).then((r) => r.arrayBuffer())

    const up = await client.storage.from('exams').upload(path, bytes, { contentType: file.mimeType, upsert: false })
    if (up.error) return { data: null, error: asError(up.error) }

    const signed = await client.storage.from('exams').createSignedUrl(path, 60 * 60 * 24 * 365)
    if (signed.error || !signed.data) {
      return { data: null, error: asError(signed.error ?? new Error('URL do documento indisponível')) }
    }
    return {
      data: { storagePath: path, url: signed.data.signedUrl, mimeType: file.mimeType, sizeBytes: file.sizeBytes },
      error: null,
    }
  } catch (e) {
    return { data: null, error: asError(e) }
  }
}

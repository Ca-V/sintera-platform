// Espelho-Mobile do ritual de PERSISTÊNCIA DE DOCUMENTO da Web (src/lib/api/storage.ts):
// mesmo bucket ('exams'), mesmo esquema de path (`userId/uuid.ext`) e mesmo TTL de signed
// URL (1 ano). O upload usa o supabase-js autenticado (a sessão já resolve o userId via
// RLS/storage policy), então o Mobile persiste igual à Web sem rota nova. Só o formato do
// binário difere: no RN lemos a URI local como ArrayBuffer.
import { supabase } from './supabase'

const DOCUMENTS_BUCKET = 'exams'
const DOCUMENT_URL_TTL = 60 * 60 * 24 * 365 // 1 ano (paridade com a Web)

export interface UploadedDocument {
  path: string
  signedUrl: string | null
}

/** Envia um arquivo local (URI do image-picker/câmera) e devolve path + signed URL durável. */
export async function uploadExamFile(opts: {
  userId: string
  uri: string
  mimeType?: string | null
  fileName?: string | null
}): Promise<UploadedDocument> {
  const ext = extOf(opts.fileName, opts.uri, opts.mimeType)
  const path = `${opts.userId}/${randomId()}.${ext}`
  const arrayBuffer = await (await fetch(opts.uri)).arrayBuffer()
  const { error } = await supabase.storage.from(DOCUMENTS_BUCKET).upload(path, arrayBuffer, {
    contentType: opts.mimeType || 'application/octet-stream',
    upsert: false,
  })
  if (error) throw new Error(error.message || 'Falha ao enviar o arquivo.')
  const { data } = await supabase.storage.from(DOCUMENTS_BUCKET).createSignedUrl(path, DOCUMENT_URL_TTL)
  return { path, signedUrl: data?.signedUrl ?? null }
}

function extOf(fileName: string | null | undefined, uri: string, mime: string | null | undefined): string {
  const fromName = fileName?.includes('.') ? fileName.split('.').pop() : undefined
  const fromUri = uri.includes('.') ? uri.split('.').pop()?.split('?')[0] : undefined
  const fromMime = mime?.includes('/') ? mime.split('/').pop() : undefined
  return (fromName || fromUri || fromMime || 'jpg').toLowerCase()
}

// crypto.randomUUID pode não existir em todos os runtimes RN — fallback simples e suficiente
// (o path já é escopado por userId; unicidade local basta).
function randomId(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto
  if (c?.randomUUID) return c.randomUUID()
  return `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`
}

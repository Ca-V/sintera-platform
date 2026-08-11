// ============================================================
// SINTERA — Fundação de Storage: PERSISTÊNCIA DE DOCUMENTO/ARQUIVO
// ============================================================
// Dono ÚNICO do ritual de escrita de documento privado da usuária (upload → signed
// URL durável): bucket, TTL e esquema de path. Antes reimplementado byte-a-byte em 5
// call-sites de 4 domínios (Exames, Ômica, Recursos, Agenda), cada um hardcodando o
// bucket, o TTL mágico e o path. É a irmã-ESCRITA da camada de Proveniência
// (`lib/provenance`, dona da LEITURA do documento) e a irmã de infra de `lib/api/db.ts`.
//
// Isomórfico: recebe o SupabaseClient (browser ou server), como `db.ts`. Sem `next/*`.
//
// DECISÕES DE INFRA/PRODUTO REGISTRADAS (fora do escopo desta fundação de CÓDIGO):
//   • Hoje um ÚNICO bucket 'exams' guarda exames/ômica/recursos/anexos — a divisão em
//     buckets dedicados e a materialização de `health_documents` (DOC-001, já prevista em
//     `lib/provenance`) exigem migração de infra/schema → decisão do Product Owner.
//   • Exclusão de conta (`api/account`) faz `list(userId)` NÃO-recursivo no bucket, que
//     não alcança `userId/omics/...` — correção de LGPD é decisão de infra à parte.
// Centralizar bucket/TTL/path AQUI é o pré-requisito para essas evoluções acontecerem
// num só lugar, sem tocar os domínios.
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js'

/** Bucket privado dos documentos (ver nota DOC-001 acima). */
export const DOCUMENTS_BUCKET = 'exams'
/** Validade da signed URL: 1 ano. */
export const DOCUMENT_URL_TTL = 60 * 60 * 24 * 365

export interface UploadedDocument {
  path: string
  /** null se a assinatura falhar — o consumidor decide se isso é erro. */
  signedUrl: string | null
}

/**
 * Persiste um arquivo privado da usuária e devolve caminho + signed URL durável.
 * LANÇA em falha de UPLOAD (o consumidor que tolera perda envolve em try/catch).
 * `prefix` adiciona uma subpasta (ex.: 'omics'); `keepFilename` preserva o nome
 * original no path (ex.: laudos de ômica).
 */
export async function uploadUserDocument(
  supabase: SupabaseClient,
  opts: { userId: string; file: File; prefix?: string; keepFilename?: boolean; ttl?: number },
): Promise<UploadedDocument> {
  const ext = opts.file.name.split('.').pop() ?? 'bin'
  const folder = opts.prefix ? `${opts.userId}/${opts.prefix}` : opts.userId
  const filename = opts.keepFilename ? `${crypto.randomUUID()}-${opts.file.name}` : `${crypto.randomUUID()}.${ext}`
  const path = `${folder}/${filename}`
  const { error } = await supabase.storage.from(DOCUMENTS_BUCKET)
    .upload(path, opts.file, { contentType: opts.file.type || 'application/octet-stream', upsert: false })
  if (error) throw new Error(error.message || 'Falha ao enviar o arquivo.')
  const { data } = await supabase.storage.from(DOCUMENTS_BUCKET).createSignedUrl(path, opts.ttl ?? DOCUMENT_URL_TTL)
  return { path, signedUrl: data?.signedUrl ?? null }
}

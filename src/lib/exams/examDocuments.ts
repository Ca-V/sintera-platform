// EXDOC-004 — Múltiplos documentos por exame + ANEXAÇÃO POSTERIOR (camada de domínio/dados ISOLADA).
//
// Preparada para entrar JUNTO com a Fase 0 (tabela `exam_documents`, EXDOC-002). Pura/testável;
// NÃO conecta banco, NÃO aplica schema, NÃO toca UI. O binding real (SupabaseClient) é passado (com cast)
// só no wiring gated. INVARIANTE CENTRAL: anexar um documento a um exame EXISTENTE NUNCA cria um novo
// exame/evento clínico — só insere em `exam_documents` sob o mesmo `exam_id`. Cada documento mantém sua
// própria proveniência (source/uploaded_at) e extração (current_extraction_version_id, preenchida no analyze).
import { MAX_UPLOAD_BYTES } from '@/lib/capture/limits'

export type ExamDocumentRole = 'laudo_preliminar' | 'laudo_final' | 'complementar' | 'outro'

/** Formatos suportados no upload de documento de exame (auditoria: PDF, JPG, PNG; ver EXDOC-004 doc). */
export const SUPPORTED_DOCUMENT_MIME = ['application/pdf', 'image/jpeg', 'image/png'] as const
export type SupportedMime = (typeof SUPPORTED_DOCUMENT_MIME)[number]

export function isSupportedDocument(file: { type: string; size: number }): { ok: boolean; reason?: string } {
  if (!(SUPPORTED_DOCUMENT_MIME as readonly string[]).includes(file.type))
    return { ok: false, reason: 'formato não suportado (aceitos: PDF, JPG, PNG)' }
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, reason: 'arquivo excede o limite' }
  return { ok: true }
}

export function contentTypeFromUrl(url: string): SupportedMime | null {
  const u = url.toLowerCase()
  if (/\.pdf(\?|$)/.test(u)) return 'application/pdf'
  if (/\.png(\?|$)/.test(u)) return 'image/png'
  if (/\.jpe?g(\?|$)/.test(u)) return 'image/jpeg'
  return null
}

export interface NewExamDocument {
  file_url: string
  role?: ExamDocumentRole
  source?: string
  document_sha256?: string | null
  exam_date?: string | null
  issuer?: string | null
}

/** Linha pronta para inserir em `public.exam_documents` (schema EXDOC-002/Fase 0). */
export interface ExamDocumentInsert {
  exam_id: string
  user_id: string
  file_url: string
  document_role: ExamDocumentRole
  source: string
  document_sha256: string | null
  exam_date: string | null
  issuer: string | null
  is_primary: boolean
  status: string
}

const ROLE_DEFAULT: ExamDocumentRole = 'outro'

/**
 * Monta as linhas de `exam_documents` de UM exame para N documentos — puro.
 * `primaryIndex` marca o documento primário (default: o 1º; use -1 para nenhum, ex.: anexação posterior).
 * TODOS os documentos recebem o MESMO `exam_id` → um único evento clínico, N documentos.
 */
export function buildExamDocumentInserts(
  exam_id: string, user_id: string, docs: NewExamDocument[],
  opts: { primaryIndex?: number; source?: string } = {},
): ExamDocumentInsert[] {
  const primary = opts.primaryIndex ?? 0
  return docs.map((d, i) => ({
    exam_id, user_id,
    file_url: d.file_url,
    document_role: d.role ?? ROLE_DEFAULT,
    source: d.source ?? opts.source ?? 'upload_usuario',
    document_sha256: d.document_sha256 ?? null,
    exam_date: d.exam_date ?? null,
    issuer: d.issuer ?? null,
    is_primary: i === primary,
    status: 'pending',
  }))
}

// ── Planejador de upload multi-documento (puro; núcleo do runtime B1) ──────────────────────────────────
// Regra de produto (fundadora): N arquivos (formatos MISTOS: PDF + imagem, vários PDFs, várias imagens) →
// documentos do MESMO exame. **"PDF não encerra o fluxo":** ao contrário do Document Bundle atual (que para no
// 1º PDF), aqui TODOS os arquivos suportados são mantidos. Nenhum arquivo cria exame novo (isso é `buildExamDocumentInserts`).
export interface PlannedFile { file_url: string; type?: string; role?: ExamDocumentRole }
export interface MultiDocumentPlan {
  docs: NewExamDocument[]                       // documentos planejados (ordem preservada; TODOS os suportados)
  rejected: { file_url: string; reason: string }[]  // formatos não suportados (não interrompem o restante)
}

/**
 * Planeja N arquivos como documentos de UM exame — puro. Valida o formato de cada um (por `type` MIME ou pela
 * extensão da URL); mantém TODOS os suportados (um PDF no meio NÃO descarta os demais); os não suportados vão para
 * `rejected` sem interromper o fluxo. Não escreve nada; o `exam_id` é atribuído depois em `buildExamDocumentInserts`.
 */
export function planMultiDocumentUpload(files: PlannedFile[]): MultiDocumentPlan {
  const docs: NewExamDocument[] = []
  const rejected: { file_url: string; reason: string }[] = []
  for (const f of files) {
    const supported = (f.type && (SUPPORTED_DOCUMENT_MIME as readonly string[]).includes(f.type))
      || contentTypeFromUrl(f.file_url) != null
    if (!supported) { rejected.push({ file_url: f.file_url, reason: 'formato não suportado (aceitos: PDF, JPG, PNG)' }); continue }
    docs.push({ file_url: f.file_url, role: f.role ?? ROLE_DEFAULT })
  }
  return { docs, rejected }
}

// ── Escrita isolada (cliente mínimo; SupabaseClient real entra só no wiring gated) ─────────────────────
export interface ExamDocInsertBuilder { select(cols: string): Promise<{ data: { id: string }[] | null; error: unknown }> }
export interface ExamDocWriteClient { from(table: string): { insert(rows: unknown): ExamDocInsertBuilder } }

async function insertExamDocuments(client: ExamDocWriteClient, rows: ExamDocumentInsert[]): Promise<{ ids: string[]; error: Error | null }> {
  // Só toca `exam_documents` — NUNCA `exams` (não cria novo exame/evento).
  const { data, error } = await client.from('exam_documents').insert(rows).select('id')
  if (error) return { ids: [], error: error instanceof Error ? error : new Error(String(error)) }
  return { ids: (data ?? []).map(r => r.id), error: null }
}

/** Cria os N documentos de um exame (novo ou já criado). N arquivos → N documentos no MESMO `exam_id`. */
export async function createExamDocuments(
  client: ExamDocWriteClient,
  params: { exam_id: string; user_id: string; docs: NewExamDocument[]; primaryIndex?: number; source?: string },
): Promise<{ ids: string[]; error: Error | null }> {
  if (params.docs.length === 0) return { ids: [], error: null }
  const rows = buildExamDocumentInserts(params.exam_id, params.user_id, params.docs, { primaryIndex: params.primaryIndex, source: params.source })
  return insertExamDocuments(client, rows)
}

/**
 * ANEXAÇÃO POSTERIOR: adiciona UM documento a um exame EXISTENTE. Não é primário por padrão e — invariante —
 * NÃO cria exame/evento novo (só insere em `exam_documents`). A promoção a primário/status é decisão à parte.
 */
export async function attachDocumentToExam(
  client: ExamDocWriteClient,
  params: { exam_id: string; user_id: string; doc: NewExamDocument },
): Promise<{ id: string | null; error: Error | null }> {
  const rows = buildExamDocumentInserts(params.exam_id, params.user_id, [params.doc], { primaryIndex: -1 })
  const { ids, error } = await insertExamDocuments(client, rows)
  return { id: ids[0] ?? null, error }
}

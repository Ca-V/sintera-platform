// @sintera/api-client — domínio Documentos do paciente (DOC-001/DOC-002): receita · atestado · relatório ·
// encaminhamento · outros. SEPARADO de `exams`/`exam_documents`.
//
// INVARIANTE (do domínio, testada em @sintera/core): criar ou associar um Documento NUNCA cria um exame nem
// muta o registro-alvo — só escreve em `patient_documents` / `patient_document_links`.
//
// Convenção do pacote: leitura LANÇA; escrita retorna { data, error }.
import type { SupabaseClient } from '@supabase/supabase-js'
import type { PatientDocumentSubtype, DocumentTargetDomain, DocumentAssociation } from '@sintera/core'
import { buildPatientDocumentInsert, buildDocumentLinkInserts } from '@sintera/core'
import { withTimeout } from '../net/timeout'
import { asError } from '../net/errors'

export interface PatientDocumentDTO {
  id: string
  subtype: PatientDocumentSubtype
  file_url: string
  issuer: string | null
  doc_date: string | null
  notes: string | null
  status: string
  created_at: string
}

/** Uma PÁGINA do documento (ANEXO-001). A ordem do array é a ordem de leitura. */
export interface DocumentPageInput {
  file_url: string
  file_name?: string | null
  mime_type?: string | null
  size_bytes?: number | null
}

export interface PatientDocumentPage {
  id: string
  file_url: string
  file_name: string | null
  mime_type: string | null
  size_bytes: number | null
  position: number
}

export interface PatientDocumentInput {
  id?: string
  subtype: PatientDocumentSubtype
  /** Primeira página. Mantido para compatibilidade com documentos anteriores ao ANEXO-001. */
  file_url: string
  issuer?: string | null
  doc_date?: string | null
  notes?: string | null
  document_sha256?: string | null
  /** Associações a registros-alvo (a receita pode alimentar Medicamento E Suplemento, por exemplo). */
  associations?: DocumentAssociation[]
  /**
   * PÁGINAS do documento. Um atestado fotografado em duas páginas é UM atestado — sem isto, seria preciso
   * criar um registro por página, e a lista mostraria três receitas onde há uma.
   * A primeira página deve coincidir com `file_url`.
   */
  pages?: DocumentPageInput[]
}

const COLUMNS = 'id, subtype, file_url, issuer, doc_date, notes, status, created_at' as const

async function requireUserId(client: SupabaseClient): Promise<string> {
  const { data: { session } } = await client.auth.getSession()
  if (!session) throw new Error('Não autenticado')
  return session.user.id
}

/** Lista os documentos do usuário, do mais recente para o mais antigo. `[]` se não houver. LANÇA em falha. */
export async function listDocuments(client: SupabaseClient, signal?: AbortSignal): Promise<PatientDocumentDTO[]> {
  const { signal: s, cleanup } = withTimeout(signal)
  try {
    const userId = await requireUserId(client)
    const { data, error } = await client.from('patient_documents').select(COLUMNS)
      .eq('user_id', userId).order('created_at', { ascending: false }).abortSignal(s)
    if (error) throw asError(error)
    return (data as PatientDocumentDTO[] | null) ?? []
  } finally {
    cleanup()
  }
}

/**
 * Documentos associados a um registro-alvo — ex.: as receitas ligadas a um medicamento.
 * Consulta os links primeiro porque o índice `(user_id, target_domain, target_id)` responde sem join.
 */
export async function listDocumentsForTarget(
  client: SupabaseClient, target_domain: DocumentTargetDomain, target_id: string, signal?: AbortSignal,
): Promise<PatientDocumentDTO[]> {
  const { signal: s, cleanup } = withTimeout(signal)
  try {
    const userId = await requireUserId(client)
    const { data: links, error: le } = await client.from('patient_document_links').select('document_id')
      .eq('user_id', userId).eq('target_domain', target_domain).eq('target_id', target_id).abortSignal(s)
    if (le) throw asError(le)
    const ids = (links as { document_id: string }[] | null ?? []).map(l => l.document_id)
    if (ids.length === 0) return []
    const { data, error } = await client.from('patient_documents').select(COLUMNS)
      .eq('user_id', userId).in('id', ids).order('created_at', { ascending: false }).abortSignal(s)
    if (error) throw asError(error)
    return (data as PatientDocumentDTO[] | null) ?? []
  } finally {
    cleanup()
  }
}

/**
 * Documentos de VÁRIOS alvos de uma vez — ex.: as receitas de todos os medicamentos da lista.
 *
 * Existe para a tela não fazer uma consulta por item. Devolve um mapa `target_id → documentos`; alvo sem
 * documento simplesmente não aparece no mapa.
 */
export async function listDocumentsForTargets(
  client: SupabaseClient, target_domain: DocumentTargetDomain, target_ids: string[], signal?: AbortSignal,
): Promise<Record<string, PatientDocumentDTO[]>> {
  if (target_ids.length === 0) return {}
  const { signal: s, cleanup } = withTimeout(signal)
  try {
    const userId = await requireUserId(client)
    const { data: links, error: le } = await client.from('patient_document_links')
      .select('document_id, target_id')
      .eq('user_id', userId).eq('target_domain', target_domain).in('target_id', target_ids).abortSignal(s)
    if (le) throw asError(le)
    const rows = (links as { document_id: string; target_id: string }[] | null) ?? []
    if (rows.length === 0) return {}

    const { data, error } = await client.from('patient_documents').select(COLUMNS)
      .eq('user_id', userId).in('id', rows.map(r => r.document_id))
      .order('created_at', { ascending: false }).abortSignal(s)
    if (error) throw asError(error)

    const byId = new Map((((data as PatientDocumentDTO[] | null) ?? [])).map(d => [d.id, d]))
    const out: Record<string, PatientDocumentDTO[]> = {}
    for (const r of rows) {
      const doc = byId.get(r.document_id)
      if (!doc) continue
      ;(out[r.target_id] ??= []).push(doc)
    }
    return out
  } finally {
    cleanup()
  }
}

/**
 * Cria um documento e (opcional) suas N associações. As LINHAS são montadas pelo domínio no core — inclusive a
 * validação de quais pares (subtipo × alvo) são legítimos, que LANÇA para associação fora da especificação.
 * NÃO lança: devolve o erro.
 */
export async function saveDocument(
  client: SupabaseClient, input: PatientDocumentInput,
): Promise<{ data: { id: string } | null; error: Error | null }> {
  try {
    const userId = await requireUserId(client)
    if (!input.file_url?.trim()) return { data: null, error: new Error('Anexe o documento') }

    const row = buildPatientDocumentInsert(userId, {
      file_url: input.file_url,
      subtype: input.subtype,
      issuer: input.issuer ?? null,
      doc_date: input.doc_date ?? null,
      notes: input.notes ?? null,
      document_sha256: input.document_sha256 ?? null,
    })
    const { data, error } = await client.from('patient_documents').insert([row]).select('id')
    if (error) return { data: null, error: asError(error) }
    const id = (data as { id: string }[] | null)?.[0]?.id
    if (!id) return { data: null, error: new Error('documento não criado') }

    const associations = input.associations ?? []
    if (associations.length > 0) {
      let links
      try { links = buildDocumentLinkInserts(id, userId, input.subtype, associations) }
      catch (e) { return { data: { id }, error: e instanceof Error ? e : new Error(String(e)) } }
      const { error: le } = await client.from('patient_document_links').insert(links)
      if (le) return { data: { id }, error: asError(le) }
    }

    // PÁGINAS (ANEXO-001). A ordem do array é a ordem de leitura — a pessoa fotografou na ordem que quer ler.
    const pages = input.pages ?? []
    if (pages.length > 0) {
      const rows = pages.map((p, i) => ({
        document_id: id,
        user_id: userId,
        file_url: p.file_url,
        file_name: p.file_name ?? null,
        mime_type: p.mime_type ?? null,
        size_bytes: p.size_bytes ?? null,
        position: i,
      }))
      const { error: pe } = await client.from('patient_document_files').insert(rows)
      // O documento já existe e a primeira página está em `file_url`: uma falha aqui perde as páginas
      // extras, não o documento. Devolver o erro é o que permite à tela dizer isso à pessoa.
      if (pe) return { data: { id }, error: asError(pe) }
    }
    return { data: { id }, error: null }
  } catch (e) {
    return { data: null, error: e instanceof Error ? e : new Error(String(e)) }
  }
}

/**
 * Páginas de VÁRIOS documentos de uma vez — `document_id → páginas`, na ordem de leitura.
 * Em lote para a lista não fazer uma consulta por documento.
 */
export async function listPagesForDocuments(
  client: SupabaseClient, documentIds: string[], signal?: AbortSignal,
): Promise<Record<string, PatientDocumentPage[]>> {
  if (documentIds.length === 0) return {}
  const { signal: s, cleanup } = withTimeout(signal)
  try {
    const userId = await requireUserId(client)
    const { data, error } = await client.from('patient_document_files')
      .select('id, document_id, file_url, file_name, mime_type, size_bytes, position')
      .eq('user_id', userId).in('document_id', documentIds)
      .order('position', { ascending: true }).abortSignal(s)
    if (error) throw asError(error)
    const out: Record<string, PatientDocumentPage[]> = {}
    for (const r of (data as (PatientDocumentPage & { document_id: string })[] | null) ?? []) {
      const { document_id, ...page } = r
      ;(out[document_id] ??= []).push(page)
    }
    return out
  } finally {
    cleanup()
  }
}

/** Atualiza os fatos documentais (emissor, data, observação, subtipo). NÃO lança. */
export async function updateDocument(
  client: SupabaseClient, id: string, patch: Partial<Pick<PatientDocumentInput, 'subtype' | 'issuer' | 'doc_date' | 'notes'>>,
): Promise<{ error: Error | null }> {
  try {
    const userId = await requireUserId(client)
    const { error } = await client.from('patient_documents')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id).eq('user_id', userId)
    return { error: error ? asError(error) : null }
  } catch (e) {
    return { error: e instanceof Error ? e : new Error(String(e)) }
  }
}

/** Remove o documento. Os links caem por `on delete cascade`. NÃO lança. */
export async function deleteDocument(client: SupabaseClient, id: string): Promise<{ error: Error | null }> {
  try {
    const userId = await requireUserId(client)
    const { error } = await client.from('patient_documents').delete().eq('id', id).eq('user_id', userId)
    return { error: error ? asError(error) : null }
  } catch (e) {
    return { error: e instanceof Error ? e : new Error(String(e)) }
  }
}

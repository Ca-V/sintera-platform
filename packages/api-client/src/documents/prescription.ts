// @sintera/api-client — RECEITA: arquivamento no domínio de Documentos (DOC-002).
//
// O PROBLEMA: a receita era gravada em `medications.prescription_url` — o arquivo tinha um dono por tabela.
// Quem procurasse a receita em Documentos não a encontrava, porque ela nunca esteve lá.
//
// A REGRA (ADR-001 · fundadora 25/08): o domínio de Documentos é o dono do fato "existe este documento". O
// medicamento REFERENCIA pelo vínculo; não guarda uma segunda cópia do arquivo. A receita pode aparecer em mais
// de um lugar, mas todos os lugares leem da MESMA fonte.
//
// Web e Mobile chamam esta função — não cada uma a sua versão. É o que impede as pontas de divergirem.
import type { SupabaseClient } from '@supabase/supabase-js'
import type { DocumentAssociation } from '@sintera/core'
import { prescriptionDocumentFor } from '@sintera/core'
import { listDocumentsForTarget, saveDocument, type PatientDocumentDTO } from './documents'

/**
 * Garante que a receita `fileUrl` esteja arquivada em Documentos e vinculada a `target`.
 *
 * IDEMPOTENTE: se já houver um documento com esse mesmo arquivo vinculado a esse alvo, não faz nada. Sem isso,
 * cada vez que a pessoa salvasse o medicamento de novo nasceria uma receita duplicada em Documentos.
 *
 * `fileUrl` nulo é no-op — não há receita a arquivar.
 *
 * NÃO toca `medications`. Limpar o ponteiro legado `prescription_url` é passo próprio e destrutivo; não se
 * mistura com este, que só acrescenta.
 */
export async function archivePrescription(
  client: SupabaseClient,
  params: {
    target: DocumentAssociation
    fileUrl: string | null | undefined
    meta?: { issuer?: string | null; doc_date?: string | null }
  },
): Promise<{ documentId: string | null; error: Error | null }> {
  const url = params.fileUrl?.trim()
  if (!url) return { documentId: null, error: null }

  let existing: PatientDocumentDTO[] = []
  try {
    existing = await listDocumentsForTarget(client, params.target.target_domain, params.target.target_id)
  } catch (e) {
    return { documentId: null, error: e instanceof Error ? e : new Error(String(e)) }
  }
  const already = existing.find(d => d.file_url === url)
  if (already) return { documentId: already.id, error: null }

  const { data, error } = await saveDocument(client, prescriptionDocumentFor(url, params.target, params.meta))
  return { documentId: data?.id ?? null, error }
}

/**
 * A receita vigente de um alvo, para exibir. Prefere o DOCUMENTO (a fonte) e só cai no ponteiro legado quando
 * o registro é anterior ao DOC-002 e ainda não passou por uma edição.
 *
 * É o que garante que a tela de Medicamentos e a de Documentos mostrem a mesma coisa.
 */
export function prescriptionUrlOf(
  docsByTarget: Record<string, PatientDocumentDTO[]>,
  targetId: string,
  legacyUrl: string | null | undefined,
): string | null {
  const doc = docsByTarget[targetId]?.find(d => d.subtype === 'receita')
  return doc?.file_url ?? legacyUrl ?? null
}

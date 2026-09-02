// @sintera/api-client — VÍNCULO entre um documento e o registro que ele originou.
//
// PEDIDO DA FUNDADORA (28/08), com o modelo que ela mesma propôs: "a receita deveria ser da mesma forma que o
// pedido de exame. Quando um exame é adicionado, a plataforma pergunta se quer vincular algum pedido. E da mesma
// forma pode ser feito com medicamento, suplemento e produto: quando for adicionado, a plataforma pergunta se
// quer vincular alguma receita."
//
// POR QUE O MODELO DELA É MELHOR QUE O MEU. Eu ia oferecer o vínculo pelo lado do DOCUMENTO — ao salvar a
// receita, escolher a que medicamento ela pertence. O problema é a ordem em que as coisas acontecem: quem
// fotografa a receita quase sempre ainda não cadastrou os medicamentos dela. Pelo lado do REGISTRO funciona: ao
// cadastrar o medicamento, a receita já está lá, guardada. E é o padrão que a pessoa já conhece de exame/pedido.
//
// ASSOCIAR NÃO É MUTAR (ADR-001/DOC-001). O vínculo escreve SÓ em `patient_document_links`. Nada é copiado do
// documento para o medicamento, e nada do medicamento volta para o documento: cada um continua dono do que
// sabe, e o vínculo é a terceira coisa que diz que se referem ao mesmo fato.
import type { SupabaseClient } from '@supabase/supabase-js'
import { canAssociate, type DocumentTargetDomain, type PatientDocumentSubtype } from '@sintera/core'
import { COLUMNS, type PatientDocumentDTO } from './documents'
import { withTimeout } from '../net/timeout'

function asError(e: unknown): Error { return e instanceof Error ? e : new Error(String(e)) }

async function requireUserId(client: SupabaseClient): Promise<string> {
  const { data: { session } } = await client.auth.getSession()
  if (!session) throw new Error('Não autenticado')
  return session.user.id
}

/**
 * Documentos de um subtipo que a pessoa já guardou, para oferecer no seletor de vínculo.
 *
 * Devolve os mais recentes primeiro: uma receita recém-fotografada é quase sempre a que se quer vincular ao
 * medicamento que se está cadastrando agora.
 */
export async function listLinkableDocuments(
  client: SupabaseClient, subtype: PatientDocumentSubtype, signal?: AbortSignal,
): Promise<PatientDocumentDTO[]> {
  const { signal: s, cleanup } = withTimeout(signal)
  try {
    const userId = await requireUserId(client)
    const { data, error } = await client.from('patient_documents').select(COLUMNS)
      .eq('user_id', userId).eq('subtype', subtype)
      .order('doc_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .abortSignal(s)
    if (error) throw asError(error)
    return (data as PatientDocumentDTO[] | null) ?? []
  } finally { cleanup() }
}

/**
 * Liga um documento a um registro. Idempotente: vincular duas vezes não cria duas linhas.
 *
 * A validação de QUE subtipo pode apontar para QUE domínio vem do core (`canAssociate`) — é regra de domínio, e
 * vale igual nas duas pontas. Uma receita aponta para medicamento, suplemento, recurso e mais quatro contextos;
 * um atestado aponta para consulta ou exame. Vínculo fora disso é recusado aqui, não descoberto no banco.
 */
export async function linkDocumentToTarget(
  client: SupabaseClient,
  documentId: string,
  subtype: PatientDocumentSubtype,
  target_domain: DocumentTargetDomain,
  target_id: string,
): Promise<{ error: Error | null }> {
  try {
    if (!canAssociate(subtype, target_domain)) {
      return { error: new Error(`associação inválida: ${subtype} → ${target_domain}`) }
    }
    const userId = await requireUserId(client)
    // `upsert` com a chave do vínculo: repetir a mesma associação é operação sem efeito, não erro. Quem toca
    // "vincular" duas vezes por engano não deve ver uma falha.
    const { error } = await client.from('patient_document_links')
      .upsert(
        [{ document_id: documentId, user_id: userId, target_domain, target_id }] as never,
        { onConflict: 'document_id,target_domain,target_id', ignoreDuplicates: true },
      )
    return { error: error ? asError(error) : null }
  } catch (e) {
    return { error: asError(e) }
  }
}

/** Desfaz o vínculo. O documento e o registro permanecem — só a ligação entre eles some. */
export async function unlinkDocumentFromTarget(
  client: SupabaseClient, documentId: string, target_domain: DocumentTargetDomain, target_id: string,
): Promise<{ error: Error | null }> {
  try {
    const userId = await requireUserId(client)
    const { error } = await client.from('patient_document_links')
      .delete()
      .eq('user_id', userId).eq('document_id', documentId)
      .eq('target_domain', target_domain).eq('target_id', target_id)
    return { error: error ? asError(error) : null }
  } catch (e) {
    return { error: asError(e) }
  }
}

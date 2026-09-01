// @sintera/api-client — TRANSCRIÇÃO de receita, atestado e demais documentos de paciente.
//
// DECISÃO DA FUNDADORA (01/09/2026): todo documento adicionado precisa ser lido e transcrito, independente da
// forma como entra. `patient_documents` nunca teve transcrição — buscar uma palavra dentro de uma receita
// nunca funcionou porque nunca houve o que buscar.
//
// PONTE TRANSITÓRIA (ADR-020), mesmo arranjo de `analyzeExam`: a leitura roda no servidor, onde vivem o prompt
// governado e a chave do provedor. As duas pontas chamam a MESMA rota — se cada uma tivesse a sua, seriam duas
// regras de leitura para o mesmo documento, e elas divergiriam.
import type { SupabaseClient } from '@supabase/supabase-js'
import { asError } from '../net/errors'
import type { StatusDaTranscricao } from '@sintera/core'

export interface ResultadoTranscricao {
  readonly status: StatusDaTranscricao
  readonly trechosIlegiveis: number
  readonly paginas: number
  /** Frase pronta para a tela, vinda do núcleo pelo servidor. */
  readonly mensagem: string
}

/**
 * Manda ler o documento. NÃO LANÇA — devolve `{ data, error }`.
 *
 * Uma falha aqui NUNCA pode desfazer o salvamento: o documento já está guardado, e o arquivo é a fonte da
 * verdade. O que se perde é a busca alcançar o conteúdo — e isso é recuperável, tentando de novo.
 */
export async function transcribeDocument(
  client: SupabaseClient,
  webBaseUrl: string | undefined,
  id: string,
): Promise<{ data: ResultadoTranscricao | null; error: Error | null }> {
  try {
    if (!webBaseUrl) return { data: null, error: new Error('URL da leitura não configurada.') }
    const { data: { session } } = await client.auth.getSession()
    if (!session) return { data: null, error: new Error('Não autenticado') }

    const res = await fetch(`${webBaseUrl.replace(/\/+$/, '')}/api/documents/${id}/transcribe`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    // O CÓDIGO HTTP É DITO. "Falhou" sem número é o silêncio que fez a leitura assistida devolver `null` em
    // cinco situações diferentes e ninguém descobrir qual delas era.
    if (!res.ok) return { data: null, error: new Error(`A leitura do documento falhou (${res.status}).`) }

    const json = await res.json() as Partial<ResultadoTranscricao> & { jaTranscrito?: boolean }
    return {
      data: {
        status: (json.status ?? 'falhou') as StatusDaTranscricao,
        trechosIlegiveis: json.trechosIlegiveis ?? 0,
        paginas: json.paginas ?? 1,
        mensagem: json.mensagem ?? '',
      },
      error: null,
    }
  } catch (e) {
    return { data: null, error: asError(e) }
  }
}

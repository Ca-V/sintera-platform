// @sintera/api-client — Ingestão de leituras de conector (HIP-014 §5/§6).
//
// POR QUE ESTA SUPERFÍCIE EXISTE: o Health Connect roda NO APARELHO, e o aplicativo precisa gravar o que leu.
// A regra do pacote é que Web e Mobile consomem só a API pública, nunca o SDK do Supabase direto — então o
// aplicativo não pode receber o cliente cru para montar o `PersistClient` por conta própria. Esta função faz
// isso por dentro: recebe amostras canônicas e devolve o que foi gravado.
//
// A lógica determinística (dedup, projeção, idempotência) vive em `propagateSamples`, no core, e é testada lá.
// Aqui só há a ligação com o banco.
//
// Escreve com o cliente que lhe passam. No aplicativo é a SESSÃO da pessoa — desde a migração 150 o dono tem
// política de INSERT em `wearable_readings`. Nenhuma credencial privilegiada entra neste caminho.
import type { SupabaseClient } from '@supabase/supabase-js'
import { propagateSamples, type CanonicalSample, type PropagationResult } from '@sintera/core'
import { createSupabasePersistClient } from '../connectors/persist'
import { asError } from '../net/errors'

export type { PropagationResult }

/**
 * Grava um lote de amostras: a série BRUTA (SSOT, com proveniência) e a projeção de exibição.
 * Idempotente — rodar de novo com a mesma janela produz o mesmo estado final.
 *
 * Lote vazio não toca o banco.
 */
export async function ingestWearableSamples(
  client: SupabaseClient,
  samples: readonly CanonicalSample[],
): Promise<{ result: PropagationResult; error: Error | null }> {
  const vazio: PropagationResult = { rawCount: 0, projectedCount: 0 }
  try {
    if (samples.length === 0) return { result: vazio, error: null }
    const { data: { session } } = await client.auth.getSession()
    if (!session) return { result: vazio, error: new Error('Não autenticado') }

    const persist = createSupabasePersistClient(client)
    const result = await propagateSamples(persist, session.user.id, samples)
    return { result, error: null }
  } catch (e) {
    return { result: vazio, error: asError(e) }
  }
}

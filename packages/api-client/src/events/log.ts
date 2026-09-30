// @sintera/api-client — registro de evento de uso (usage_events): telemetria de produto + "reportar problema".
//
// Convenção de escrita: NÃO lança; retorna `{ error }`. Best-effort — telemetria nunca deve quebrar a UI.
//
// ============================================================================================
// A VALIDAÇÃO ENTROU EM 29/09/2026, E ELA ESTAVA FALTANDO DESDE O INÍCIO
// ============================================================================================
// O VAL-001 definiu um catálogo de eventos e uma lista de metadados proibidos, e o core tem as duas funções
// que julgam isso — `ehEventoConhecido` e `problemasNoMetadata`. **Nada no runtime as chamava.** Catálogo,
// regra e teste existiam; o caminho por onde o evento realmente passa não consultava nenhum.
//
// É o padrão "especificado mas nunca ligado", e o custo dele aqui é específico: um nome de evento digitado
// errado — `convite_enviado` virando `conviteEnviado`, ou `first_value` em vez de `primeiro_valor` — grava
// sem reclamar e some da análise. Meses depois a coorte não fecha e ninguém sabe por quê, porque o dado
// nunca existiu sob o nome que a consulta procura.
//
// Pior ainda é o metadado: um campo com dado pessoal entra em `usage_events`, que é tabela de telemetria e
// não de saúde, e passa a viver fora do regime de acesso que o resto da plataforma respeita.
import type { SupabaseClient } from '@supabase/supabase-js'
import { ehEventoConhecido, ehEventoLegado, problemasNoMetadata } from '@sintera/core'
import { asError } from '../net/errors'

/**
 * Registra um evento de uso do próprio usuário. `{ error: null }` em sucesso. NÃO lança.
 *
 * RECUSA, e não corrige: nome fora do catálogo e metadado proibido voltam como erro, sem gravar. Corrigir
 * silenciosamente — truncar o campo, renomear o evento — produziria um dado que ninguém pediu e que parece
 * legítimo na análise. Recusar deixa o defeito visível para quem escreveu a chamada.
 */
export async function logUsageEvent(
  client: SupabaseClient,
  eventName: string,
  metadata?: Record<string, unknown> | null,
): Promise<{ error: Error | null }> {
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) return { error: new Error('Não autenticado') }
    if (!eventName) return { error: new Error('event_name obrigatório') }

    // VAL-001 §1: o catálogo é fechado. Nome fora dele não é evento novo — é erro de digitação que só
    // apareceria meses depois, na análise que não fecha.
    if (!ehEventoConhecido(eventName)) {
      return { error: new Error(`Evento fora do catálogo VAL-001: "${eventName}"`) }
    }

    // VAL-001 §3: `usage_events` é telemetria, não prontuário. Metadado com dado pessoal passaria a viver
    // fora do regime de acesso que o resto da plataforma respeita.
    //
    // OS LEGADOS FICAM DE FORA DESTA REGRA, e a distinção é real, não conveniência.
    //
    // `problema_reportado` não é métrica de produto: é canal de suporte. Ele carrega o identificador do exame
    // que falhou e o texto que a pessoa escreveu — sem os dois, a mensagem "algo deu errado" não leva a lugar
    // nenhum. Passá-lo pela mesma régua do VAL-001 quebraria o "reportar problema" no aplicativo, que foi
    // exatamente o que um teste existente acusou quando a validação entrou.
    //
    // RISCO QUE FICA, e que eu não resolvo aqui: o texto livre do suporte PODE conter dado de saúde, porque
    // a pessoa escreve o que quiser. Isso pede tratamento no fluxo de feedback — retenção, quem lê, por
    // quanto tempo — e não um filtro de chave que não enxerga o conteúdo. Está registrado como pendência.
    if (!ehEventoLegado(eventName)) {
      const problemas = problemasNoMetadata(metadata)
      if (problemas.length > 0) {
        return { error: new Error(`Metadado não permitido em "${eventName}": ${problemas.map(p => `${p.chave} (${p.porque})`).join('; ')}`) }
      }
    }

    const { error } = await client
      .from('usage_events')
      .insert({ user_id: session.user.id, event_name: eventName, metadata: metadata ?? null } as never)

    return { error: error ? asError(error) : null }
  } catch (e) {
    return { error: asError(e) }
  }
}

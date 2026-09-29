import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { Database } from './types'
import { authenticateRequest } from './apiAuth'
import type { NextRequest } from 'next/server'

/**
 * Resolve o cliente Supabase autenticado + o usuário a partir de **Cookie (Web)** OU **Bearer (aplicativo)**.
 *
 * ============================================================================================
 * ESTA FUNÇÃO DEIXOU DE TER LÓGICA PRÓPRIA (29/09/2026)
 * ============================================================================================
 * Existiam DUAS camadas de auth compartilhada fazendo o mesmo trabalho: esta e `authenticateRequest`, em
 * `apiAuth.ts`. Nasceram em momentos diferentes, para o mesmo problema, e ninguém percebeu porque as duas
 * funcionavam.
 *
 * O PREJUÍZO NÃO FOI TEÓRICO. Ao medir quantas rotas aceitavam Bearer, procurei por `authenticateRequest` e
 * rotulei de "só cookie" um punhado de rotas que usavam esta aqui — inclusive a leitura de laudo de
 * bioimpedância, que o aplicativo chama. Reportei à fundadora um número errado e uma conclusão errada.
 *
 * Duas implementações do mesmo conceito também divergiam no que importa: esta tentava Bearer primeiro,
 * aquela tentava cookie primeiro. Nenhuma das duas estava documentada como a certa.
 *
 * Agora há UMA (ADR-023), e ela tenta Bearer primeiro — a ordem segura, porque o cabeçalho é credencial
 * deliberada e o cookie é ambiente. Esta função continua existindo só pela FORMA do retorno, que dezenas de
 * rotas consomem: trocá-la em todas de uma vez seria um rewrite grande para nenhum ganho.
 *
 * PONTE ARQUITETURAL TRANSITÓRIA (ADR-020, fundadora 2026-07-31): habilita o aplicativo a reusar as rotas da
 * Web sem duplicar lógica. O modelo-ALVO (backlog R-010) move o processamento para uma camada compartilhada
 * consumida pelas duas pontas — eliminando o acoplamento à Web.
 */
export async function getAuthedSupabase(
  request: Request,
): Promise<{ supabase: SupabaseClient<Database>; user: User | null }> {
  const { user, client } = await authenticateRequest(request as NextRequest)
  // `client` é `null` só quando não há autenticação — e aí `user` também é. O elenco preserva o contrato
  // desta função, que sempre devolveu um cliente utilizável; sem sessão, as consultas dele são recusadas
  // pela RLS, que é o comportamento que as rotas já esperavam.
  return { supabase: (client ?? (await fallbackAnonimo())) as SupabaseClient<Database>, user }
}

/** Cliente sem sessão. Existe só para manter o tipo de retorno; a RLS recusa tudo o que ele pedir. */
async function fallbackAnonimo(): Promise<SupabaseClient<Database>> {
  const { createClient } = await import('./server')
  return (await createClient()) as unknown as SupabaseClient<Database>
}

// @sintera/api-client — Login por PROVEDOR EXTERNO (OIDC). Google hoje; Apple e Microsoft entram sem tocar
// nesta lógica, só acrescentando o id do provedor.
//
// IDENTIDADE, não autorização de dados de saúde. Acrescentar um provedor aqui NÃO muda a identidade interna:
// `auth.uid()` continua o mesmo, e as 46 colunas de `user_id` da plataforma seguem valendo. É essa propriedade
// que permite abrir novos provedores antes do IDENT-001, sem pré-comprometer a decisão de CPF/RNDS.
//
// POR QUE EM DUAS ETAPAS, e não um `signInWithOAuth` direto: no aplicativo não existe "redirecionar a página".
// A tela precisa da URL para abrir o navegador do sistema, e depois entrega de volta o endereço de retorno que
// chegou por deep link. Web e Mobile usam as MESMAS duas funções; muda só quem abre o navegador.
//
// O aplicativo NUNCA manipula a credencial da pessoa: a senha do Google é digitada no navegador do sistema,
// no domínio do Google. O que volta para cá é só o par de tokens de sessão.
import type { SupabaseClient, Provider } from '@supabase/supabase-js'
import { parseOAuthCallback, hasUsableSession } from '@sintera/core'
import { asError } from '../net/errors'

/** Provedores de IDENTIDADE aceitos. Lista FECHADA de propósito — o oposto do Modelo Aberto que rege o
 *  domínio clínico. Aqui, aceitar um provedor desconhecido seria aceitar quem afirma quem a pessoa é. */
export const IDENTITY_PROVIDERS = ['google'] as const
export type IdentityProvider = (typeof IDENTITY_PROVIDERS)[number]

/**
 * Etapa 1 — devolve a URL de autorização do provedor, SEM redirecionar.
 * `redirectTo` é para onde o provedor devolve: no aplicativo, o deep link (`sintera://auth`); na Web, a rota
 * de callback. Precisa estar na lista de URLs permitidas do Supabase, senão o provedor recusa o retorno.
 */
export async function startOAuthSignIn(
  client: SupabaseClient,
  provider: IdentityProvider,
  redirectTo: string,
): Promise<{ url: string | null; error: Error | null }> {
  try {
    if (!(IDENTITY_PROVIDERS as readonly string[]).includes(provider)) {
      return { url: null, error: new Error(`Provedor não aceito: ${provider}`) }
    }
    if (!redirectTo?.trim()) {
      return { url: null, error: new Error('Endereço de retorno ausente') }
    }
    const { data, error } = await client.auth.signInWithOAuth({
      provider: provider as Provider,
      options: { redirectTo, skipBrowserRedirect: true },
    })
    if (error) return { url: null, error: asError(error) }
    return { url: data?.url ?? null, error: data?.url ? null : new Error('Provedor não devolveu endereço de autorização') }
  } catch (e) {
    return { url: null, error: asError(e) }
  }
}

/**
 * Etapa 2 — recebe o endereço de retorno e estabelece a sessão.
 *
 * A leitura do retorno é pura e testada (`parseOAuthCallback`, no core). Aqui só há a gravação da sessão.
 * Recusa do provedor vira erro com a mensagem DELE — que é o que ajuda quem está tentando entrar; um
 * "falha ao entrar" genérico não diz se a pessoa cancelou, se o consentimento foi negado ou se o link expirou.
 */
export async function completeOAuthSignIn(
  client: SupabaseClient,
  callbackUrl: string | null | undefined,
): Promise<{ error: Error | null }> {
  try {
    const cb = parseOAuthCallback(callbackUrl)
    if (cb.error) return { error: new Error(cb.error) }
    if (!hasUsableSession(cb)) return { error: new Error('O provedor não devolveu uma sessão utilizável') }

    const { error } = await client.auth.setSession({
      access_token: cb.accessToken as string,
      refresh_token: cb.refreshToken as string,
    })
    return { error: error ? asError(error) : null }
  } catch (e) {
    return { error: asError(e) }
  }
}

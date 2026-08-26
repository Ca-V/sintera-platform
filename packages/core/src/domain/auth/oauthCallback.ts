// @sintera/core — leitura do RETORNO de um login por provedor externo (OIDC). Puro, sem IO.
//
// IDENTIDADE, não autorização de dados de saúde. São duas camadas separadas de propósito, e a guarda
// `tests/contracts/identidade-vs-autorizacao.ARCH.test.ts` existe para que continuem assim: entrar na SINTERA
// e autorizar leitura do próprio histórico são consentimentos de naturezas diferentes.
//
// POR QUE ESTA FUNÇÃO ESTÁ NO CORE: o Mobile recebe o retorno por deep link (`sintera://auth#...`) e a Web por
// rota de callback. A FORMA do retorno é a mesma nos dois, e é a parte que erra — fragmento vs query, provedor
// que recusou, URL truncada. Aqui é testável; dentro da tela, não seria.
//
// O provedor pode devolver os campos no FRAGMENTO (`#`, fluxo implícito) ou na QUERY (`?`). Lemos os dois:
// depender de um só quebraria silenciosamente numa mudança de configuração do Supabase.

/** O que veio no retorno. Nunca lança: entrada inválida vira "nada utilizável". */
export interface OAuthCallback {
  accessToken: string | null
  refreshToken: string | null
  /** Mensagem do provedor quando ele RECUSOU (pessoa cancelou, consentimento negado, link expirado). */
  error: string | null
}

const VAZIO: OAuthCallback = { accessToken: null, refreshToken: null, error: null }

/** Extrai os pares chave=valor de um trecho no formato de query string. */
function pares(trecho: string): URLSearchParams {
  return new URLSearchParams(trecho.replace(/^[#?]/, ''))
}

/**
 * Lê o retorno do provedor. Procura primeiro no fragmento (fluxo implícito, que é o configurado hoje) e
 * depois na query — sem privilegiar um formato a ponto de quebrar se a configuração mudar.
 *
 * Um retorno com erro NÃO devolve tokens, mesmo que venham juntos: se o provedor sinalizou recusa, tratá-la
 * como sucesso parcial seria criar sessão a partir de um consentimento que não houve.
 */
export function parseOAuthCallback(url: string | null | undefined): OAuthCallback {
  const bruto = (url ?? '').trim()
  if (!bruto) return VAZIO

  const iFrag = bruto.indexOf('#')
  const iQuery = bruto.indexOf('?')
  const trechos = [
    iFrag >= 0 ? bruto.slice(iFrag) : '',
    iQuery >= 0 ? bruto.slice(iQuery, iFrag >= 0 && iFrag > iQuery ? iFrag : undefined) : '',
  ].filter(Boolean)

  let acesso: string | null = null
  let atualizacao: string | null = null
  let erro: string | null = null

  for (const t of trechos) {
    let p: URLSearchParams
    try { p = pares(t) } catch { continue }
    acesso = acesso ?? (p.get('access_token') || null)
    atualizacao = atualizacao ?? (p.get('refresh_token') || null)
    // `error_description` é a mensagem legível; `error` é o código. Preferimos a mensagem.
    erro = erro ?? (p.get('error_description') || p.get('error') || null)
  }

  if (erro) return { accessToken: null, refreshToken: null, error: erro }
  return { accessToken: acesso, refreshToken: atualizacao, error: null }
}

/**
 * O retorno traz uma sessão utilizável? Exige os DOIS tokens: sem o de atualização a sessão morre na primeira
 * expiração e a pessoa é deslogada sem entender por quê.
 */
export function hasUsableSession(cb: OAuthCallback): boolean {
  return !!cb.accessToken && !!cb.refreshToken && !cb.error
}

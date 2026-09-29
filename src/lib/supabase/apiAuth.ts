// Autenticação de rota de API que atende AS DUAS PONTAS — Web e aplicativo.
//
// O DEFEITO QUE ISTO CORRIGE (homologação de 27/08): as rotas usavam `createClient()` do servidor, que lê a
// sessão do COOKIE. O aplicativo não tem cookie: ele manda `Authorization: Bearer <token>`. Resultado — toda
// chamada do Mobile às rotas da Web devolvia 401, sempre devolveu, e o sintoma aparecia como se a
// funcionalidade estivesse quebrada:
//   • Conexões no aplicativo: "Não foi possível carregar as conexões (401)";
//   • leitura assistida de documento: nada acontecia, sem mensagem — porque a leitura nunca chegou a rodar.
//
// Nenhuma das duas estava errada. A porta é que estava fechada.
//
// A ORDEM IMPORTA: tenta o cookie primeiro, porque na Web ele é o caminho normal e não custa nada. Só recorre
// ao cabeçalho quando não há sessão de cookie — que é exatamente o caso do aplicativo.
//
// O token é VALIDADO pelo próprio Supabase (`getUser` com o token no cabeçalho), não decodificado aqui.
// Confiar num JWT lido localmente sem validar seria aceitar qualquer texto com a forma certa.
import type { NextRequest } from 'next/server'
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'
import type { User } from '@supabase/supabase-js'
import { createClient as createCookieClient } from './server'

export interface ApiAuth {
  user: User | null
  /**
   * Cliente JÁ no contexto da pessoa autenticada — respeita RLS.
   * `null` quando não há autenticação. NUNCA é service-role: rota que precisa de escrita privilegiada
   * resolve a chave por conta própria, deliberadamente.
   */
  client: SupabaseClient | null
}

const SEM_AUTH: ApiAuth = { user: null, client: null }

/**
 * Token do cabeçalho `Authorization: Bearer <token>`, se houver.
 *
 * ACESSO DEFENSIVO a `headers`. Esta função declara que NUNCA lança, e uma requisição sem `headers` a fazia
 * estourar — trocando um 401 legítimo por um 500. A diferença importa: 401 diz "entre"; 500 diz "a plataforma
 * quebrou", e ainda expõe um rastro de pilha onde deveria haver uma recusa limpa.
 */
function bearer(req: NextRequest): string | null {
  const headers = (req as { headers?: { get?: (k: string) => string | null } } | undefined)?.headers
  if (typeof headers?.get !== 'function') return null
  const h = headers.get('authorization') ?? headers.get('Authorization')
  if (!h) return null
  const m = /^Bearer\s+(.+)$/i.exec(h.trim())
  return m ? m[1].trim() : null
}

/**
 * Autentica a requisição por COOKIE (Web) ou por BEARER (aplicativo).
 * Devolve o usuário e um cliente no contexto dele. Nunca lança.
 */
export async function authenticateRequest(req: NextRequest): Promise<ApiAuth> {
  // 1. BEARER PRIMEIRO. A ordem mudou em 29/09/2026, e o motivo é de segurança, não de gosto.
  //
  //    O cabeçalho `Authorization` é uma credencial DELIBERADA: quem o mandou escolheu aquela identidade
  //    para aquela chamada. O cookie é ambiente — viaja sozinho, e pode estar velho. Numa requisição que
  //    carregue os dois, deixar o cookie ganhar autenticaria como a identidade que a pessoa NÃO escolheu.
  //
  //    Na prática as duas pontas mandam só um: o navegador tem cookie e não Bearer, o aplicativo o oposto.
  //    Mas "na prática" foi exatamente o raciocínio que já me custou caro nesta semana, e a ordem segura não
  //    custa nada.
  const token = bearer(req)
  if (token) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (url && anon) {
      try {
        // Chave ANÔNIMA + token da pessoa: o cliente fica no contexto dela e o RLS continua valendo,
        // exatamente como na Web. Nada aqui eleva privilégio.
        const client = createSupabaseClient(url, anon, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { persistSession: false, autoRefreshToken: false },
        })
        // `getUser(token)` VALIDA o token no servidor do Supabase. Não decodificamos o JWT por conta própria.
        // O argumento é obrigatório: sem sessão persistida, `getUser()` sem token não validaria nada.
        const { data: { user }, error } = await client.auth.getUser(token)
        if (!error && user) return { user, client }
      } catch {
        // Token inválido não vira sessão de cookie por acidente: cair para o cookie aqui deixaria uma
        // credencial recusada abrir a porta pela identidade do navegador.
      }
      return SEM_AUTH
    }
  }

  // 2. Cookie — o caminho da Web.
  try {
    const cookieClient = await createCookieClient()
    const { data: { user } } = await cookieClient.auth.getUser()
    if (user) return { user, client: cookieClient }
  } catch {
    // Sem cookie utilizável.
  }

  return SEM_AUTH
}

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

/** Token do cabeçalho `Authorization: Bearer <token>`, se houver. */
function bearer(req: NextRequest): string | null {
  const h = req.headers.get('authorization') ?? req.headers.get('Authorization')
  if (!h) return null
  const m = /^Bearer\s+(.+)$/i.exec(h.trim())
  return m ? m[1].trim() : null
}

/**
 * Autentica a requisição por COOKIE (Web) ou por BEARER (aplicativo).
 * Devolve o usuário e um cliente no contexto dele. Nunca lança.
 */
export async function authenticateRequest(req: NextRequest): Promise<ApiAuth> {
  // 1. Cookie — o caminho da Web.
  try {
    const cookieClient = await createCookieClient()
    const { data: { user } } = await cookieClient.auth.getUser()
    if (user) return { user, client: cookieClient }
  } catch {
    // Sem cookie utilizável; segue para o cabeçalho.
  }

  // 2. Bearer — o caminho do aplicativo.
  const token = bearer(req)
  if (!token) return SEM_AUTH

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) return SEM_AUTH

  try {
    // Chave ANÔNIMA + token da pessoa: o cliente fica no contexto dela e o RLS continua valendo,
    // exatamente como na Web. Nada aqui eleva privilégio.
    const client = createSupabaseClient(url, anon, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    })
    // `getUser` VALIDA o token no servidor do Supabase. Não decodificamos o JWT por conta própria.
    const { data: { user }, error } = await client.auth.getUser()
    if (error || !user) return SEM_AUTH
    return { user, client }
  } catch {
    return SEM_AUTH
  }
}

import { createClient as createTokenClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import type { Database } from './types'
import { createClient as createCookieClient } from './server'

/**
 * Resolve o cliente Supabase autenticado + o usuário a partir de **Cookie (Web)** OU **Bearer (Mobile/API)** —
 * camada de auth COMPARTILHADA, **não acoplada ao contexto da Web**. Mantém UMA regra de negócio nas rotas de
 * API: o handler não sabe de onde veio o usuário, só recebe `{ supabase, user }` prontos.
 *
 * PONTE ARQUITETURAL TRANSITÓRIA (ADR-020, fundadora 2026-07-31): habilita o Mobile a reusar as rotas da Web na
 * Onda 1 sem duplicar lógica. O modelo-ALVO (pós-Onda-1, backlog R-010) move o processamento para uma camada
 * compartilhada (Edge Function/serviço comum) consumida por Web e Mobile — eliminando o acoplamento à Web.
 *
 * Nota técnica: no modo Bearer o cliente é STATELESS (sem sessão), então `getUser()` sem argumento não validaria
 * o token — por isso validamos com `getUser(token)` explicitamente aqui; as queries `.from()` usam o header
 * global (RLS aplica o usuário do token). No modo Cookie, `getUser()` lê a sessão dos cookies (comportamento atual).
 */
export async function getAuthedSupabase(
  request: Request,
): Promise<{ supabase: SupabaseClient<Database>; user: User | null }> {
  const authHeader = request.headers.get('authorization')
  if (authHeader && /^bearer /i.test(authHeader)) {
    const token = authHeader.slice(authHeader.indexOf(' ') + 1).trim()
    const supabase = createTokenClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false, autoRefreshToken: false },
      },
    )
    const { data } = await supabase.auth.getUser(token)
    return { supabase, user: data.user ?? null }
  }
  // Cookie (Web): comportamento atual inalterado (backward-compatible).
  const supabase = await createCookieClient()
  const { data } = await supabase.auth.getUser()
  return { supabase, user: data.user ?? null }
}

// Deploy de produção: camada de auth compartilhada (ADR-020). Ver RISK_REGISTER R-010.

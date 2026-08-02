import { createClient as createTokenClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'
import { createClient as createCookieClient } from './server'

/**
 * Cliente Supabase autenticado a partir de **Cookie (Web)** OU **Bearer (Mobile/API)** — camada de auth
 * COMPARTILHADA, **não acoplada ao contexto da Web**. Mantém UMA única regra de negócio nas rotas de API:
 * o handler não sabe de onde veio o usuário, só recebe um cliente autenticado.
 *
 * PONTE ARQUITETURAL TRANSITÓRIA (ADR-020, fundadora 2026-07-31): habilita o Mobile a reusar as rotas da Web
 * na Onda 1 sem duplicar lógica. O modelo-ALVO (pós-Onda-1, backlog arquitetural R-010) move o processamento
 * para uma **camada compartilhada** (Edge Function/serviço comum) consumida por Web e Mobile — eliminando o
 * acoplamento à aplicação Web. Enquanto isso não existe, esta camada de auth evita cristalizar o atalho.
 */
export async function getAuthedSupabase(request: Request): Promise<SupabaseClient<Database>> {
  const authHeader = request.headers.get('authorization')
  if (authHeader && /^bearer /i.test(authHeader)) {
    // Bearer (Mobile/API): cliente STATELESS com o JWT do usuário — getUser() valida e a RLS aplica esse usuário.
    return createTokenClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false, autoRefreshToken: false },
      },
    )
  }
  // Cookie (Web): comportamento atual inalterado (backward-compatible).
  return createCookieClient()
}

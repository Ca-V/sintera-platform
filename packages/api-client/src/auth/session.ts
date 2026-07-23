// @sintera/api-client — Sessão (domínio): leitura e observação. Recebe o cliente Supabase (interno ao pacote).
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Session, SessionListener } from './types'

/** Lê a sessão persistida (via storage injetado; sem rede). */
export async function getSession(client: SupabaseClient): Promise<Session | null> {
  const { data } = await client.auth.getSession()
  return data.session
}

/** Observa mudanças de sessão (SIGNED_IN / SIGNED_OUT / TOKEN_REFRESHED). Retorna a função de cancelamento. */
export function onAuthStateChange(client: SupabaseClient, listener: SessionListener): () => void {
  const { data } = client.auth.onAuthStateChange((_event, session) => listener(session))
  return () => data.subscription.unsubscribe()
}

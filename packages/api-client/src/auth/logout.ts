// @sintera/api-client — Operação de logout (domínio). Recebe o cliente Supabase (interno ao pacote).
import type { SupabaseClient } from '@supabase/supabase-js'

export async function signOut(client: SupabaseClient): Promise<{ error: Error | null }> {
  const { error } = await client.auth.signOut()
  return { error }
}

// @sintera/api-client — Operação de login (domínio). Recebe o cliente Supabase (interno ao pacote).
import type { SupabaseClient } from '@supabase/supabase-js'
import type { AuthResult } from './types'

export async function signIn(client: SupabaseClient, email: string, password: string): Promise<AuthResult> {
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  return { session: data.session, error }
}

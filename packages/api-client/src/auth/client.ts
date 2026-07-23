// @sintera/api-client — Fábrica ÚNICA do cliente Supabase de todo o ecossistema SINTERA.
// Web e Mobile NUNCA chamam createClient() diretamente — só createApiClient(). Toda config do Supabase vive aqui.
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { ApiClient, ApiClientConfig } from './types'
import { signIn } from './login'
import { signOut } from './logout'
import { getSession, onAuthStateChange } from './session'

/**
 * >>> ÚNICO ponto de `createClient()` em todo o ecossistema SINTERA. <<<
 * Recebe url/key (injetados por plataforma) e um StorageAdapter genérico; devolve a API de domínio (AuthApi).
 * O cliente Supabase permanece ENCAPSULADO (não é exposto) — impede chamadas diretas ao SDK fora deste pacote.
 */
export function createApiClient(config: ApiClientConfig): ApiClient {
  const supabase: SupabaseClient = createClient(config.url, config.key, {
    auth: {
      // Ponte: StorageAdapter genérico (get/set/remove) → interface de storage do supabase-js (getItem/setItem/removeItem).
      storage: {
        getItem: (key) => config.storage.get(key),
        setItem: (key, value) => config.storage.set(key, value),
        removeItem: (key) => config.storage.remove(key),
      },
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  })

  return {
    auth: {
      signIn: (email, password) => signIn(supabase, email, password),
      signOut: () => signOut(supabase),
      getSession: () => getSession(supabase),
      onAuthStateChange: (listener) => onAuthStateChange(supabase, listener),
    },
  }
}

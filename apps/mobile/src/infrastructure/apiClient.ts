// Mobile — FIAÇÃO (DI) do cliente compartilhado. Injeta url/key (env EXPO_PUBLIC_*) + o SecureStoreAdapter
// na fábrica ÚNICA do @sintera/api-client. Nenhum outro arquivo do app cria clientes nem chama o SDK Supabase.
import { createApiClient, type ApiClient } from '@sintera/api-client'
import { secureStoreAdapter } from './secureStoreAdapter'

const url = process.env.EXPO_PUBLIC_SUPABASE_URL
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

if (!url || !key) {
  throw new Error(
    'Auth: EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY ausentes. Preencha apps/mobile/.env.'
  )
}

export const apiClient: ApiClient = createApiClient({
  url,
  key,
  storage: secureStoreAdapter,
})

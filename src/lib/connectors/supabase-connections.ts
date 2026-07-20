// WEA-001 / HIP-001 — V2 Épico 2.1: implementação REAL (IO service-role) do ConnectionRepo.
// Única fronteira que lê/escreve as colunas de token de wearable_connections. Sempre com cliente service-role.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { ConnectionRepo, ConnectionRow, ConnectionStatus } from './connections'

interface DbRow {
  user_id: string
  provider: string
  access_token: string | null
  refresh_token: string | null
  expires_at: string | null
  scope: string | null
  status: ConnectionStatus
}

const toRow = (r: DbRow): ConnectionRow => ({
  userId: r.user_id, provider: r.provider,
  accessToken: r.access_token, refreshToken: r.refresh_token,
  expiresAt: r.expires_at, scope: r.scope, status: r.status,
})

export function createSupabaseConnectionRepo(supabase: SupabaseClient): ConnectionRepo {
  return {
    async read(userId, provider) {
      const { data, error } = await supabase
        .from('wearable_connections')
        .select('user_id, provider, access_token, refresh_token, expires_at, scope, status')
        .eq('user_id', userId)
        .eq('provider', provider)
        .maybeSingle()
      if (error) throw new Error(`connection.read: ${error.message}`)
      return data ? toRow(data as DbRow) : null
    },

    async upsert(row: ConnectionRow) {
      const { error } = await supabase.from('wearable_connections').upsert({
        user_id: row.userId,
        provider: row.provider,
        access_token: row.accessToken,
        refresh_token: row.refreshToken,
        expires_at: row.expiresAt,
        scope: row.scope,
        status: row.status,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,provider' })
      if (error) throw new Error(`connection.upsert: ${error.message}`)
    },

    async setStatus(userId, provider, status) {
      const { error } = await supabase
        .from('wearable_connections')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('provider', provider)
      if (error) throw new Error(`connection.setStatus: ${error.message}`)
    },
  }
}

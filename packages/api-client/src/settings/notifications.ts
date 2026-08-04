// @sintera/api-client — Central de Notificações (NOTIF-001): canal por categoria (notification_preferences).
// Infra ÚNICA e transversal (a taxonomia/canais vêm do @sintera/core). RLS: dono. Leitura LANÇA; escrita { error }.
import type { SupabaseClient } from '@supabase/supabase-js'
import type { NotificationChannel } from '@sintera/core'
import { withTimeout } from '../net/timeout'
import { asError } from '../net/errors'

export interface NotificationPrefRow { category: string; channel: NotificationChannel }

/** Preferências salvas (canal por categoria). `[]` se não houver (a UI aplica o default). LANÇA em falha. */
export async function listNotificationPrefs(client: SupabaseClient, signal?: AbortSignal): Promise<NotificationPrefRow[]> {
  const { signal: s, cleanup } = withTimeout(signal)
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) throw new Error('Não autenticado')
    const { data, error } = await client.from('notification_preferences').select('category, channel')
      .eq('user_id', session.user.id).abortSignal(s)
    if (error) throw asError(error)
    return (data as NotificationPrefRow[] | null) ?? []
  } finally {
    cleanup()
  }
}

/** Salva (upsert) o canal de cada categoria. `{ error }`, NÃO lança. */
export async function saveNotificationPrefs(client: SupabaseClient, prefs: NotificationPrefRow[]): Promise<{ error: Error | null }> {
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) return { error: new Error('Não autenticado') }
    const now = new Date().toISOString()
    const rows = prefs.map(p => ({ user_id: session.user.id, category: p.category, channel: p.channel, updated_at: now }))
    const { error } = await client.from('notification_preferences').upsert(rows as never, { onConflict: 'user_id,category' })
    return { error: error ? asError(error) : null }
  } catch (e) {
    return { error: asError(e) }
  }
}

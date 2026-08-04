// @sintera/api-client — registro de evento de uso (usage_events): telemetria de produto + "reportar problema".
// Espelha a rota /api/events da Web (insert { user_id, event_name, metadata }). RLS: insert do próprio usuário.
// Convenção de escrita: NÃO lança; retorna `{ error }`. Best-effort — telemetria nunca deve quebrar a UI.
import type { SupabaseClient } from '@supabase/supabase-js'
import { asError } from '../net/errors'

/** Registra um evento de uso do próprio usuário. `{ error: null }` em sucesso. NÃO lança. */
export async function logUsageEvent(
  client: SupabaseClient,
  eventName: string,
  metadata?: Record<string, unknown> | null,
): Promise<{ error: Error | null }> {
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) return { error: new Error('Não autenticado') }
    if (!eventName) return { error: new Error('event_name obrigatório') }

    const { error } = await client
      .from('usage_events')
      .insert({ user_id: session.user.id, event_name: eventName, metadata: metadata ?? null } as never)

    return { error: error ? asError(error) : null }
  } catch (e) {
    return { error: asError(e) }
  }
}

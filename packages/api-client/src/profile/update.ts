// @sintera/api-client — gravação do Perfil (domínio). Recebe o cliente Supabase (interno ao pacote).
// Contrato (MOBILE-019 §3): upsert dos campos EDITÁVEIS por WHITELIST estrita (name, phone) — a proteção por
// coluna vive AQUI (RLS é por linha, não por coluna). Retorna { error } — NUNCA lança. Last-write-wins.
import type { SupabaseClient } from '@supabase/supabase-js'
import { withTimeout } from '../net/timeout'
import type { ProfileEditable } from './types'
import { asError } from '../net/errors'

export async function updateProfile(
  client: SupabaseClient,
  patch: ProfileEditable,
  signal?: AbortSignal,
): Promise<{ error: Error | null }> {
  const { signal: s, cleanup } = withTimeout(signal)
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) return { error: new Error('Não autenticado') }

    // Payload montado de uma WHITELIST fixa — nunca repassa chaves arbitrárias (name/phone/age_range/goals).
    const payload: Record<string, unknown> = { id: session.user.id, updated_at: new Date().toISOString() }
    if ('name' in patch) payload.name = patch.name ?? null
    if ('phone' in patch) payload.phone = patch.phone ?? null
    if ('age_range' in patch) payload.age_range = patch.age_range ?? null
    if ('goals' in patch) payload.goals = patch.goals ?? null

    // @supabase/postgrest resolve o param de upsert para 'never' com TS estrito — cast controlado (como a rota Web).
    const { error } = await client.from('profiles').upsert(payload as never).abortSignal(s)
    return { error: error ? asError(error) : null }
  } catch (e) {
    // timeout/abort/rede caem aqui → convenção de escrita: devolve { error }, não lança.
    return { error: asError(e) }
  } finally {
    cleanup()
  }
}

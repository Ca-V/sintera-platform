// @sintera/api-client — Ciclo menstrual (menstrual_periods). Registro FACTUAL de datas de início; a estatística
// (média/previsão) é derivada no @sintera/core (cycleStats). RLS: dono. Leitura LANÇA; escrita retorna { error }.
import type { SupabaseClient } from '@supabase/supabase-js'
import { withTimeout } from '../net/timeout'
import { asError } from '../net/errors'

export interface PeriodDTO { id: string; started_on: string; notes: string | null }

/** Últimas datas de início (mais recentes primeiro, até 24). LANÇA em falha. */
export async function listPeriods(client: SupabaseClient, signal?: AbortSignal): Promise<PeriodDTO[]> {
  const { signal: s, cleanup } = withTimeout(signal)
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) throw new Error('Não autenticado')
    const { data, error } = await client.from('menstrual_periods').select('id, started_on, notes')
      .eq('user_id', session.user.id).order('started_on', { ascending: false }).limit(24).abortSignal(s)
    if (error) throw asError(error)
    return (data as PeriodDTO[] | null) ?? []
  } finally {
    cleanup()
  }
}

/** Registra uma data de início (idempotente por user+data). `{ error }`, NÃO lança. */
export async function addPeriod(client: SupabaseClient, startedOn: string): Promise<{ error: Error | null }> {
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) return { error: new Error('Não autenticado') }
    const d = startedOn || new Date().toISOString().slice(0, 10)
    const { error } = await client.from('menstrual_periods').upsert({ user_id: session.user.id, started_on: d } as never, { onConflict: 'user_id,started_on' })
    return { error: error ? asError(error) : null }
  } catch (e) {
    return { error: asError(e) }
  }
}

/** Remove um registro de início. `{ error }`, NÃO lança. */
export async function deletePeriod(client: SupabaseClient, id: string): Promise<{ error: Error | null }> {
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) return { error: new Error('Não autenticado') }
    const { error } = await client.from('menstrual_periods').delete().eq('id', id).eq('user_id', session.user.id)
    return { error: error ? asError(error) : null }
  } catch (e) {
    return { error: asError(e) }
  }
}

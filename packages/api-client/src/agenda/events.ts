// @sintera/api-client — domínio AGENDA / Evento Assistencial (health_events). Espelha o repositório da Web
// (src/lib/agenda/repository.ts): LÊ legado (agenda_events) + canônico (health_events), dedup (canônico vence),
// ordena pela ordem canônica do domínio; ESCREVE no canônico (upsert). Mapeadores/seletores/ordenação vêm do
// @sintera/core (fonte única com a Web). RLS: dono. Leitura LANÇA em falha; escrita retorna { error }.
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  agendaRowToHealthEvent, rowToHealthEvent, healthEventToRow, sortByWhen,
  type AgendaEventRow, type HealthEventRow, type HealthEvent,
} from '@sintera/core'
import { withTimeout } from '../net/timeout'
import { asError } from '../net/errors'

const AGENDA_COLUMNS = 'id, event_type, title, event_date, event_time, duration_min, notes, status, reminder_enabled, reminder_sent_at' as const

/** Rascunho de evento para persistir (mesmo contrato do serviço da Web). */
export type EventDraft = Partial<HealthEvent> & { type: string; title: string; date: string }

/** TODOS os eventos do usuário (legado+canônico, dedup, ordem canônica). LANÇA em falha. */
export async function listEvents(client: SupabaseClient, signal?: AbortSignal): Promise<HealthEvent[]> {
  const { signal: s, cleanup } = withTimeout(signal)
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) throw new Error('Não autenticado')
    const uid = session.user.id

    const [a, h] = await Promise.all([
      client.from('agenda_events').select(AGENDA_COLUMNS).eq('user_id', uid).abortSignal(s),
      client.from('health_events').select('*').eq('user_id', uid).eq('synthetic', false).abortSignal(s),
    ])
    if (a.error) throw asError(a.error)
    if (h.error) throw asError(h.error)

    const legacy = ((a.data ?? []) as AgendaEventRow[]).map(agendaRowToHealthEvent)
    const canonical = ((h.data ?? []) as HealthEventRow[]).map(rowToHealthEvent)
    const byId = new Map<string, HealthEvent>()
    for (const e of legacy) byId.set(e.id, e)
    for (const e of canonical) byId.set(e.id, e) // canônico vence
    return sortByWhen([...byId.values()])
  } finally {
    cleanup()
  }
}

/** Cria/atualiza um evento no canônico (upsert). Convenção de escrita: `{ error }`, NÃO lança. */
export async function saveEvent(client: SupabaseClient, draft: EventDraft): Promise<{ error: Error | null }> {
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) return { error: new Error('Não autenticado') }
    const { error } = await client.from('health_events').upsert(healthEventToRow(session.user.id, draft) as never)
    return { error: error ? asError(error) : null }
  } catch (e) {
    return { error: asError(e) }
  }
}

/** Exclui um evento canônico (por id, escopo do dono via RLS). `{ error }`, NÃO lança. */
export async function deleteEvent(client: SupabaseClient, id: string): Promise<{ error: Error | null }> {
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) return { error: new Error('Não autenticado') }
    const { error } = await client.from('health_events').delete().eq('id', id).eq('user_id', session.user.id)
    return { error: error ? asError(error) : null }
  } catch (e) {
    return { error: asError(e) }
  }
}

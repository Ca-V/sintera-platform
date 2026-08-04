// @sintera/api-client — sincroniza um LEMBRETE recorrente vinculado a um fato (hábito, recurso, medicamento…).
// Padrão único reutilizado por vários domínios: o lembrete É um Evento Assistencial (health_events) com um
// EventLink para o fato. Ligado → cria/atualiza (preserva âncora/id existentes); desligado → remove o existente.
// Reutiliza listEvents/saveEvent/deleteEvent + selectByLink/serializeRule (@sintera/core). `{ error }`, NÃO lança.
import type { SupabaseClient } from '@supabase/supabase-js'
import { selectByLink, serializeRule, type EventLink, type RecurrenceFrequency } from '@sintera/core'
import { listEvents, saveEvent, deleteEvent } from './events'

export interface LinkedReminderOptions {
  enabled: boolean
  frequency: RecurrenceFrequency
  title: string
  /** Data-âncora quando não há lembrete existente (default: hoje). */
  date?: string
  /** Tipo do evento (default 'outro'). */
  eventType?: string
  notes?: string | null
}

/** Cria/atualiza/remove o lembrete recorrente vinculado a `link` conforme `opts`. */
export async function syncLinkedReminder(
  client: SupabaseClient,
  link: EventLink,
  opts: LinkedReminderOptions,
): Promise<{ error: Error | null }> {
  try {
    const events = await listEvents(client)
    const existing = link.id ? selectByLink(events, link.type, link.id)[0] ?? null : null

    if (!opts.enabled) {
      return existing ? deleteEvent(client, existing.id) : { error: null }
    }

    const today = new Date().toISOString().slice(0, 10)
    return saveEvent(client, {
      ...(existing ?? {}),
      type: opts.eventType ?? 'outro',
      title: opts.title,
      date: existing?.date || opts.date || today, // preserva a âncora ao editar
      status: existing?.status ?? 'planejado',
      reminderEnabled: true,
      notes: opts.notes ?? existing?.notes ?? null,
      recurrenceRule: serializeRule({ frequency: opts.frequency, interval: 1, until: null, count: null }),
      links: [link],
    })
  } catch (e) {
    return { error: e instanceof Error ? e : new Error('Falha ao sincronizar o lembrete') }
  }
}

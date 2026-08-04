// @sintera/api-client — sincroniza uma DESPESA vinculada a um fato (recurso, medicamento/compra…). Padrão único:
// a despesa É um Evento Assistencial FINANCEIRO (health_events, directExpense) com um EventLink para o fato →
// entra em Gastos/Histórico sem duplicar. Valor>0 → cria/atualiza; valor nulo/0 → remove o existente. Reutiliza
// listEvents/saveEvent/deleteEvent + selectByLink (@sintera/core). `{ error }`, NÃO lança.
import type { SupabaseClient } from '@supabase/supabase-js'
import { selectByLink, type EventLink } from '@sintera/core'
import { listEvents, saveEvent, deleteEvent } from './events'

export interface LinkedExpenseOptions {
  amountCents: number | null
  docType?: string | null
  docUrl?: string | null
  title: string
  eventType?: string   // tipo do evento (default 'exame')
  date?: string        // data-âncora quando novo (default hoje)
}

/** Cria/atualiza/remove a despesa vinculada a `link` conforme `opts`. O evento fica 'realizado'+directExpense. */
export async function syncLinkedExpense(
  client: SupabaseClient,
  link: EventLink,
  opts: LinkedExpenseOptions,
): Promise<{ error: Error | null }> {
  try {
    const events = await listEvents(client)
    // A despesa é o evento vinculado COM valor (distingue-se do lembrete vinculado, que não tem valor).
    const existing = link.id ? selectByLink(events, link.type, link.id).find(e => (e.amountCents ?? 0) > 0) ?? null : null

    if (!opts.amountCents || opts.amountCents <= 0) {
      return existing ? deleteEvent(client, existing.id) : { error: null }
    }

    const now = new Date().toISOString()
    const today = now.slice(0, 10)
    return saveEvent(client, {
      ...(existing ?? {}),
      type: opts.eventType ?? 'exame',
      title: opts.title,
      date: existing?.date || opts.date || today,
      status: 'realizado',
      completedAt: existing?.completedAt || now,
      amountCents: opts.amountCents,
      directExpense: true,
      expenseDocType: opts.docType ?? null,
      attachmentUrl: opts.docUrl ?? null,
      links: [link],
    })
  } catch (e) {
    return { error: e instanceof Error ? e : new Error('Falha ao sincronizar a despesa') }
  }
}

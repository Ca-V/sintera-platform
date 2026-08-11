// Camada de REPOSITÓRIO (persistência) — esconde a ORIGEM FÍSICA e expõe APENAS
// HealthEvent, por CAPACIDADES (não por tabela). A UI nunca chama o repositório
// direto — ela usa a camada de SERVIÇO.
//
// Coexistência da consolidação: lê eventos legados de `agenda_events` + canônicos de
// `health_events`; ESCREVE no canônico `health_events`. Fase 3 migra os legados e
// passa a ler só `health_events`. Futuro: wearables/integrações/protocolos/conectores
// plugam aqui sem mudar serviço nem UI.

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  agendaRowToHealthEvent, rowToHealthEvent, healthEventToRow,
  selectUpcoming, selectHistorical, selectByLink, selectFinancial, sortByWhen,
  type AgendaEventRow, type HealthEventRow, type HealthEvent, type EventLinkKind,
} from './event'

export interface EventRepository {
  listUpcomingEvents(userId: string, refDate: string): Promise<HealthEvent[]>
  listHistoricalEvents(userId: string, refDate: string): Promise<HealthEvent[]>
  listEventsByExam(userId: string, examId: string): Promise<HealthEvent[]>
  listEventsByBiomarker(userId: string, biomarker: string): Promise<HealthEvent[]>
  listEventsByProtocol(userId: string, protocolId: string): Promise<HealthEvent[]>
  listFinancialEntries(userId: string): Promise<HealthEvent[]>
  save(userId: string, event: Partial<HealthEvent> & { type: string; title: string; date: string }): Promise<void>
  deleteEvent(userId: string, id: string): Promise<void>
  /** Cria/atualiza um evento-LEMBRETE (agenda_events legado) e devolve o id. */
  upsertReminder(userId: string, r: { id?: string | null; title: string; date: string; eventType?: string }): Promise<string>
}

// `sortByWhen` (ordem cronológica canônica) vive no DOMÍNIO (event.ts) — o
// repositório a CONSOME, não reimplementa (princípio congelado 27/06/2026).

/** Implementação de persistência sobre o Supabase. O domínio/serviço nunca conhece o banco. */
export function createSupabaseEventRepository(supabase: SupabaseClient): EventRepository {
  // Leitura única da jornada (coexistência: legados + canônicos), já como domínio.
  async function listAll(userId: string): Promise<HealthEvent[]> {
    const [a, h] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from('agenda_events') as any)
        .select('id, event_type, title, event_date, event_time, duration_min, notes, status, reminder_enabled, reminder_sent_at')
        .eq('user_id', userId),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from('health_events') as any)
        .select('*').eq('user_id', userId).eq('synthetic', false),
    ])
    const legacy = ((a.data ?? []) as AgendaEventRow[]).map(agendaRowToHealthEvent)
    const canonical = ((h.data ?? []) as HealthEventRow[]).map(rowToHealthEvent)
    // Coexistência: se o mesmo id existir nos dois (evento legado já mutado para o
    // canônico), o CANÔNICO vence — evita duplicata na lista.
    const byId = new Map<string, HealthEvent>()
    for (const e of legacy) byId.set(e.id, e)
    for (const e of canonical) byId.set(e.id, e)
    return sortByWhen([...byId.values()])
  }

  return {
    listUpcomingEvents:   async (u, ref) => selectUpcoming(await listAll(u), ref),
    listHistoricalEvents: async (u, ref) => selectHistorical(await listAll(u), ref),
    listEventsByExam:      async (u, id) => selectByLink(await listAll(u), 'exam' as EventLinkKind, id),
    listEventsByBiomarker: async (u, b)  => selectByLink(await listAll(u), 'biomarker' as EventLinkKind, b),
    listEventsByProtocol:  async (u, id) => selectByLink(await listAll(u), 'protocol' as EventLinkKind, id),
    listFinancialEntries:  async (u) => selectFinancial(await listAll(u)),
    save: async (userId, event) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('health_events') as any).upsert(healthEventToRow(userId, event))
      // NUNCA engolir falha de gravação — propaga para a UI avisar a usuária
      // (evita "salvei e não apareceu"). Ver AgendarModal: exibe a mensagem.
      if (error) throw new Error(error.message || 'Falha ao salvar o evento')
    },
    // Exclusão COEXISTÊNCIA-AWARE: o id pode viver no canônico (health_events) ou no
    // legado (agenda_events). Deletar dos dois (por id + user_id) é idempotente e cobre
    // ambos — o domínio esconde a coexistência do consumidor (habilita a Fase 3).
    deleteEvent: async (userId, id) => {
      const del = async (table: string) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase.from(table) as any).delete().eq('id', id).eq('user_id', userId)
        if (error) throw new Error(error.message || `Falha ao excluir o evento (${table})`)
      }
      await del('health_events')
      await del('agenda_events')
    },
    // Lembrete (conceito permanente) — encapsula a tabela legada agenda_events.
    upsertReminder: async (userId, r) => {
      const eventType = r.eventType ?? 'medicacao'
      if (r.id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase.from('agenda_events') as any)
          .update({ title: r.title, event_date: r.date, status: 'pending', reminder_enabled: true, reminder_sent_at: null })
          .eq('id', r.id).eq('user_id', userId)
        if (error) throw new Error(error.message || 'Falha ao atualizar o lembrete')
        return r.id
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('agenda_events') as any)
        .insert({ user_id: userId, event_type: eventType, title: r.title, event_date: r.date, status: 'pending', reminder_enabled: true })
        .select('id').single()
      if (error || !data) throw new Error(error?.message || 'Falha ao criar o lembrete')
      return (data as { id: string }).id
    },
  }
}

// Camada de REPOSITÓRIO dos eventos — esconde a ORIGEM FÍSICA dos dados e expõe
// APENAS o domínio (HealthEvent). A UI nunca toca o banco; consome o repositório.
//
// Hoje: coexistência da consolidação — lê `agenda_events` (legado) via adaptador.
// Depois (Fase 3): passa a ler `health_events`. Futuro: wearables, integrações,
// protocolos automáticos, importações e conectores plugam aqui — sem mudar a UI.

import type { SupabaseClient } from '@supabase/supabase-js'
import { agendaRowToHealthEvent, type AgendaEventRow, type HealthEvent } from './event'

export interface EventRepository {
  /** Todos os eventos da jornada da usuária, já como domínio. */
  listForUser(userId: string): Promise<HealthEvent[]>
}

/** Ordena por data e horário (ascendente) — ordenação técnica do domínio. */
export function sortByWhen(events: HealthEvent[]): HealthEvent[] {
  return [...events].sort((a, b) =>
    a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? '') || a.id.localeCompare(b.id))
}

/**
 * Implementação de COEXISTÊNCIA: lê `agenda_events` e expõe HealthEvent.
 * Não vaza estrutura física. Fase 3 troca a fonte para `health_events` sem mexer na UI.
 */
export function createEventRepository(supabase: SupabaseClient): EventRepository {
  return {
    async listForUser(userId: string): Promise<HealthEvent[]> {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('agenda_events') as any)
        .select('id, event_type, title, event_date, event_time, duration_min, notes, status, reminder_enabled, reminder_sent_at')
        .eq('user_id', userId)
      const rows = (data ?? []) as AgendaEventRow[]
      return sortByWhen(rows.map(agendaRowToHealthEvent))
    },
  }
}

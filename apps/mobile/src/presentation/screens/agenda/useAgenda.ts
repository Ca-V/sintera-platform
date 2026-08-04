// Hook da AGENDA (paridade Web). Carrega os eventos via `apiClient.agenda` (FRONTEIRA Inc.1) e projeta as
// listas do domínio (@sintera/core): pendências em atraso · próximos · histórico. Ações: salvar (upsert) e
// excluir. Regras (ordem/seleção/transições) vivem no core — o hook só orquestra rede + estado.
import { useCallback, useEffect, useRef, useState } from 'react'
import type { EventDraft } from '@sintera/api-client'
import {
  type HealthEvent, selectOverdue, selectUpcoming, selectHistorical, sortByWhen, isOverdue,
  completeRule, cancelRule,
} from '@sintera/core'
import { apiClient } from '../../../infrastructure/apiClient'

function today(): string { return new Date().toISOString().slice(0, 10) }

export interface AgendaLists {
  overdue: HealthEvent[]    // pendências em atraso (abertas e vencidas)
  upcoming: HealthEvent[]   // próximos (abertos, hoje/futuro), sem as pendências
  historical: HealthEvent[] // histórico (fechados)
}

export function useAgenda() {
  const [events, setEvents] = useState<HealthEvent[]>([])
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading')
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const alive = useRef(true)

  const load = useCallback((silent: boolean) => {
    const controller = new AbortController()
    if (silent) setRefreshing(true); else setPhase('loading')
    apiClient.agenda.listEvents(controller.signal)
      .then((evs) => { if (!alive.current) return; setEvents(evs); setPhase('ready'); setError(null) })
      .catch((e) => {
        if (!alive.current || controller.signal.aborted) return
        if (silent) return // mantém a lista em refresh falho
        setError(e instanceof Error ? e.message : 'Não foi possível carregar a agenda.'); setPhase('error')
      })
      .finally(() => { if (alive.current) setRefreshing(false) })
    return () => controller.abort()
  }, [])

  useEffect(() => { alive.current = true; const cancel = load(false); return () => { alive.current = false; cancel() } }, [load])

  const refresh = useCallback(() => load(true), [load])

  const save = useCallback(async (draft: EventDraft) => {
    const { error: err } = await apiClient.agenda.saveEvent(draft)
    if (!err) load(true)
    return { error: err }
  }, [load])

  const remove = useCallback(async (id: string) => {
    const { error: err } = await apiClient.agenda.deleteEvent(id)
    if (!err) load(true)
    return { error: err }
  }, [load])

  // Transições (paridade Web) via regras do domínio (core): Concluir → Histórico/Gastos; Cancelar.
  const complete = useCallback((ev: HealthEvent) => save(completeRule(ev, new Date().toISOString())), [save])
  const cancel = useCallback((ev: HealthEvent) => save(cancelRule(ev)), [save])

  const ref = today()
  const overdue = selectOverdue(events, ref)
  const overdueIds = new Set(overdue.map(e => e.id))
  const lists: AgendaLists = {
    overdue,
    upcoming: sortByWhen(selectUpcoming(events, ref).filter(e => !overdueIds.has(e.id) && !isOverdue(e, ref))),
    historical: sortByWhen(selectHistorical(events, ref)).reverse(), // histórico mais recente primeiro
  }

  return { phase, refreshing, error, events, lists, refresh, save, remove, complete, cancel, retry: () => load(false) }
}

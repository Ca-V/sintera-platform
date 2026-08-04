// Hook das DESPESAS (FB-008 — paridade Web /dashboard/gastos). Projeção sobre TODOS os fatos com valor:
// eventos financeiros (selectFinancial) + exames-com-valor — unidos pelo core (projectExpenses). Não cria
// registros próprios. Ações: remover (evento → delete; exame → limpa colunas de valor) e reabrir (evento).
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  type HealthEvent, selectFinancial, projectExpenses, expensesTotalCents, groupByPeriod,
} from '@sintera/core'
import { apiClient } from '../../../infrastructure/apiClient'

export function useDespesas() {
  const [items, setItems] = useState<HealthEvent[]>([])
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading')
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const alive = useRef(true)

  const load = useCallback((silent: boolean) => {
    if (silent) setRefreshing(true); else setPhase('loading')
    Promise.all([apiClient.agenda.listEvents(), apiClient.exams.listExamExpenses()])
      .then(([events, examRows]) => {
        if (!alive.current) return
        setItems(projectExpenses(selectFinancial(events), examRows))
        setPhase('ready'); setError(null)
      })
      .catch((e) => {
        if (!alive.current) return
        if (!silent) { setError(e instanceof Error ? e.message : 'Não foi possível carregar as despesas.'); setPhase('error') }
      })
      .finally(() => { if (alive.current) setRefreshing(false) })
  }, [])

  useEffect(() => { alive.current = true; load(false); return () => { alive.current = false } }, [load])

  const refresh = useCallback(() => load(true), [load])

  // Remover: evento → exclui; exame (id 'exam:<id>') → limpa as colunas de valor (mantém o exame).
  const remove = useCallback(async (item: HealthEvent) => {
    const isExam = item.id.startsWith('exam:')
    const res = isExam
      ? await apiClient.exams.updateExam(item.id.slice('exam:'.length), { expense_amount_cents: null, expense_doc_type: null, expense_doc_url: null })
      : await apiClient.agenda.deleteEvent(item.id)
    if (!res.error) load(true)
    return res
  }, [load])

  // Reabrir (correção): evento volta a 'planejado' e sai das Despesas (retorna à Agenda). Exames não se aplicam.
  const reopen = useCallback(async (item: HealthEvent) => {
    if (item.id.startsWith('exam:')) return { error: null }
    const { error } = await apiClient.agenda.saveEvent({ ...item, status: 'planejado', completedAt: null })
    if (!error) load(true)
    return { error }
  }, [load])

  const byYear = groupByPeriod(items, 'year', 'desc')
  const totalCents = expensesTotalCents(items)

  return { phase, refreshing, error, items, byYear, totalCents, refresh, remove, reopen, retry: () => load(false) }
}

// Hook da LISTA de exames (Inc.5). Encapsula o reducer de carga + `apiClient.exams.listExams` (FRONTEIRA
// Inc.1: nenhum Supabase direto). Read-only. `exams = []` = usuário sem exames (estado vazio, não erro).
import { useReducer, useEffect, useCallback } from 'react'
import type { ExamDTO } from '@sintera/api-client'
import { apiClient } from '../../../infrastructure/apiClient'
import { loadReducer, initialLoadState } from './loadMachine'

const LIST_ERROR = 'Não foi possível carregar seus exames. Tente novamente.'

function messageFor(e: unknown, fallback: string): string {
  return e instanceof Error && e.message ? e.message : fallback
}

export function useExamsList() {
  const [state, dispatch] = useReducer(loadReducer<ExamDTO[]>, initialLoadState<ExamDTO[]>())

  useEffect(() => {
    dispatch({ type: 'LOAD' })
  }, [])

  useEffect(() => {
    if (state.phase !== 'loading') return
    const controller = new AbortController()
    let alive = true
    apiClient.exams
      .listExams(undefined, controller.signal)
      .then((data) => {
        if (!alive) return
        dispatch({ type: 'SUCCESS', data })
      })
      .catch((e) => {
        if (!alive || controller.signal.aborted) return
        dispatch({ type: 'FAILURE', error: messageFor(e, LIST_ERROR) })
      })
    return () => {
      alive = false
      controller.abort()
    }
  }, [state.phase])

  const retry = useCallback(() => dispatch({ type: 'RETRY' }), [])

  return { phase: state.phase, exams: state.data, error: state.error, retry }
}

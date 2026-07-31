// Hook do DETALHE de um exame (Inc.5). Encapsula o reducer de carga + `apiClient.exams.getExam` (FRONTEIRA
// Inc.1). Read-only. `exam = null` na fase `ready` = exame inexistente/de outro usuário (RLS) → tela mostra
// "não encontrado".
import { useReducer, useEffect, useCallback } from 'react'
import type { ExamDTO } from '@sintera/api-client'
import { apiClient } from '../../../infrastructure/apiClient'
import { loadReducer, initialLoadState } from './loadMachine'

const DETAIL_ERROR = 'Não foi possível carregar o exame. Tente novamente.'

function messageFor(e: unknown, fallback: string): string {
  return e instanceof Error && e.message ? e.message : fallback
}

export function useExam(id: string) {
  const [state, dispatch] = useReducer(loadReducer<ExamDTO | null>, initialLoadState<ExamDTO | null>())

  // Recarrega quando o id muda (e na montagem).
  useEffect(() => {
    dispatch({ type: 'LOAD' })
  }, [id])

  useEffect(() => {
    if (state.phase !== 'loading') return
    const controller = new AbortController()
    let alive = true
    apiClient.exams
      .getExam(id, controller.signal)
      .then((data) => {
        if (!alive) return
        dispatch({ type: 'SUCCESS', data })
      })
      .catch((e) => {
        if (!alive || controller.signal.aborted) return
        dispatch({ type: 'FAILURE', error: messageFor(e, DETAIL_ERROR) })
      })
    return () => {
      alive = false
      controller.abort()
    }
  }, [state.phase, id])

  const retry = useCallback(() => dispatch({ type: 'RETRY' }), [])

  return { phase: state.phase, exam: state.data, error: state.error, retry }
}

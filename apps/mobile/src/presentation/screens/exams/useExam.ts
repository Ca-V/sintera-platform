// Hook do DETALHE de um exame (Inc.5/6). Encapsula o reducer de carga + `apiClient.exams` (FRONTEIRA Inc.1).
// `exam = null` na fase `ready` = inexistente/de outro usuário (RLS) → tela mostra "não encontrado".
//
// Inc.6: (a) POLLING enquanto o exame processa (status atualiza sozinho no detalhe, como na lista/Web);
// (b) REPROCESSAR (`reanalyze`) — recuperação de falha: re-dispara a extração (ponte /analyze) e marca
// 'processing' localmente (otimista) para o polling assumir. Genérico por ESTADO, não por tipo de exame.
import { useReducer, useEffect, useCallback, useRef } from 'react'
import type { ExamDTO } from '@sintera/api-client'
import { apiClient } from '../../../infrastructure/apiClient'
import { loadReducer, initialLoadState } from './loadMachine'
import { isExamProcessing } from './examStatus'

const DETAIL_ERROR = 'Não foi possível carregar o exame. Tente novamente.'
const MAX_POLLS = 20 // ~80 s de teto

function messageFor(e: unknown, fallback: string): string {
  return e instanceof Error && e.message ? e.message : fallback
}

export function useExam(id: string) {
  const [state, dispatch] = useReducer(loadReducer<ExamDTO | null>, initialLoadState<ExamDTO | null>())
  const hasData = useRef(false)
  hasData.current = state.data != null

  const load = useCallback((silent: boolean) => {
    const controller = new AbortController()
    if (!silent) dispatch({ type: 'LOAD' })
    apiClient.exams
      .getExam(id, controller.signal)
      .then((data) => dispatch(silent ? { type: 'SET', data } : { type: 'SUCCESS', data }))
      .catch((e) => {
        if (controller.signal.aborted) return
        if (silent && hasData.current) return // refresh falhou com dado em tela → mantém
        dispatch({ type: 'FAILURE', error: messageFor(e, DETAIL_ERROR) })
      })
    return () => controller.abort()
  }, [id])

  // Carga inicial + quando o id muda (com spinner).
  useEffect(() => load(false), [load])

  // Polling enquanto o exame está processando.
  const pollsRef = useRef(0)
  useEffect(() => {
    if (!isExamProcessing(state.data?.status)) {
      pollsRef.current = 0
      return
    }
    if (pollsRef.current >= MAX_POLLS) return
    const t = setTimeout(() => {
      pollsRef.current += 1
      load(true)
    }, 4000)
    return () => clearTimeout(t)
  }, [state.data, load])

  // Reprocessar (recuperação de falha). Otimista: marca 'processing' local → o polling busca o status real.
  const reanalyze = useCallback(() => {
    void apiClient.exams.analyzeExam(id)
    if (state.data) {
      pollsRef.current = 0
      dispatch({ type: 'SET', data: { ...state.data, status: 'processing' } })
    }
  }, [id, state.data])

  const retry = useCallback(() => load(false), [load])

  return { phase: state.phase, exam: state.data, error: state.error, retry, reanalyze }
}

// Hook do DETALHE de um exame (Inc.5/6). Reducer de carga + `apiClient.exams` (FRONTEIRA Inc.1). `exam = null` na
// fase `ready` = inexistente/de outro usuário (RLS) → tela mostra "não encontrado". Inc.6: POLLING enquanto
// processa (status atualiza sozinho) + REPROCESSAR (`reanalyze`, recuperação de falha) + EXCLUIR (`remove`,
// gated na UI — MOBILE-030).
import { useReducer, useEffect, useCallback, useRef } from 'react'
import type { ExamDTO } from '@sintera/api-client'
import { apiClient } from '../../../infrastructure/apiClient'
import { loadReducer, initialLoadState, loadErrorMessage } from './loadMachine'
import { isExamProcessing } from './examStatus'

const DETAIL_ERROR = 'Não foi possível carregar o exame. Tente novamente.'
const MAX_POLLS = 45 // ~3 min de teto — cobre extrações lentas (server-side; observado até ~53 s + overhead)

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
        dispatch({ type: 'FAILURE', error: loadErrorMessage(e, DETAIL_ERROR) })
      })
    return () => controller.abort()
  }, [id])

  // Carga inicial + quando o id muda (com spinner).
  useEffect(() => load(false), [load])

  // Polling enquanto o exame processa.
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

  // Reprocessar (recuperação de falha). Otimista: marca 'processing' local → o polling assume e busca o real.
  const reanalyze = useCallback(() => {
    void apiClient.exams.analyzeExam(id)
    if (state.data) dispatch({ type: 'SET', data: { ...state.data, status: 'processing' } })
  }, [id, state.data])

  // Exclusão pelo dono (a UI que aciona fica atrás de flag até a RLS existir — MOBILE-030).
  const remove = useCallback(() => apiClient.exams.deleteExam(id), [id])

  const retry = useCallback(() => load(false), [load])

  return { phase: state.phase, exam: state.data, error: state.error, retry, reanalyze, remove }
}

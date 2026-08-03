// Hook da LISTA de exames (Inc.5/6). Reducer de carga + `apiClient.exams.listExams` (FRONTEIRA Inc.1). Read-only.
// `exams = []` = sem exames (estado vazio, não erro). Re-busca ao FOCAR (spinner no 1º; refresh silencioso nos
// refocos, mantendo dados se o refresh falhar) e faz POLLING enquanto algum exame processa (status atualiza sozinho).
import { useReducer, useCallback, useRef, useEffect } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import type { ExamDTO } from '@sintera/api-client'
import { apiClient } from '../../../infrastructure/apiClient'
import { loadReducer, initialLoadState, loadErrorMessage } from './loadMachine'

const LIST_ERROR = 'Não foi possível carregar seus exames. Tente novamente.'
const MAX_POLLS = 20 // ~80 s de teto

export function useExamsList() {
  const [state, dispatch] = useReducer(loadReducer<ExamDTO[]>, initialLoadState<ExamDTO[]>())
  const hasData = useRef(false)
  hasData.current = state.data !== null

  // `silent`: refresh em segundo plano (SET, sem spinner). Caso contrário, carga com spinner (LOAD→SUCCESS).
  const load = useCallback((silent: boolean) => {
    const controller = new AbortController()
    if (!silent) dispatch({ type: 'LOAD' })
    apiClient.exams
      .listExams(undefined, controller.signal)
      .then((data) => dispatch(silent ? { type: 'SET', data } : { type: 'SUCCESS', data }))
      .catch((e) => {
        if (controller.signal.aborted) return
        if (silent && hasData.current) return // refresh falhou com lista em tela → mantém (não some)
        dispatch({ type: 'FAILURE', error: loadErrorMessage(e, LIST_ERROR) })
      })
    return () => controller.abort()
  }, [])

  // Ao FOCAR: sem dados → spinner; com dados → refresh silencioso. Cobre o 1º load e os refocos.
  useFocusEffect(useCallback(() => load(hasData.current), [load]))

  // Polling enquanto algum exame está processando.
  const pollsRef = useRef(0)
  useEffect(() => {
    const active = (state.data ?? []).some((e) => e.status === 'pending' || e.status === 'processing')
    if (!active) {
      pollsRef.current = 0
      return
    }
    if (pollsRef.current >= MAX_POLLS) return
    const id = setTimeout(() => {
      pollsRef.current += 1
      load(true)
    }, 4000)
    return () => clearTimeout(id)
  }, [state.data, load])

  const retry = useCallback(() => load(false), [load])

  return { phase: state.phase, exams: state.data, error: state.error, retry }
}

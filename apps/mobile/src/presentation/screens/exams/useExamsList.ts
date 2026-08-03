// Hook da LISTA de exames (Inc.5/6). Reducer de carga + `apiClient.exams.listExams` (FRONTEIRA Inc.1). Read-only.
// `exams = []` = sem exames (estado vazio, não erro). Re-busca ao FOCAR (spinner no 1º; refresh silencioso nos
// refocos, mantendo dados se o refresh falhar) e faz POLLING enquanto algum exame processa. As peças de carga/
// polling/erro são compartilhadas (loadMachine · usePollWhile) — sem duplicação com o hook de detalhe.
import { useReducer, useCallback, useRef } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import type { ExamDTO } from '@sintera/api-client'
import { apiClient } from '../../../infrastructure/apiClient'
import { loadReducer, initialLoadState, loadErrorMessage } from './loadMachine'
import { usePollWhile } from './usePollWhile'
import { isExamProcessing } from './examStatus'

const LIST_ERROR = 'Não foi possível carregar seus exames. Tente novamente.'

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

  // Atualiza sozinho enquanto algum exame está processando.
  const poll = useCallback(() => load(true), [load])
  usePollWhile((state.data ?? []).some((e) => isExamProcessing(e.status)), poll, state.data)

  const retry = useCallback(() => load(false), [load])

  return { phase: state.phase, exams: state.data, error: state.error, retry }
}

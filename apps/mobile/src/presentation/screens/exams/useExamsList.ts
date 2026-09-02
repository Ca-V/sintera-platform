// Hook da LISTA de exames (Inc.5/6). Reducer de carga + `apiClient.exams.listExams` (FRONTEIRA Inc.1). Read-only.
// `exams = []` = sem exames (estado vazio, não erro). Re-busca ao FOCAR (spinner no 1º; refresh silencioso nos
// refocos, mantendo dados se o refresh falhar), POLLING enquanto algum exame processa, e PUXAR-PARA-ATUALIZAR
// (refresh manual confiável — a extração é server-side e pode levar dezenas de segundos).
import { useReducer, useCallback, useRef, useEffect, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import type { ExamDTO } from '@sintera/api-client'
import { apiClient } from '../../../infrastructure/apiClient'
import { loadReducer, initialLoadState, loadErrorMessage } from './loadMachine'
import { isExamProcessing } from './examStatus'

const LIST_ERROR = 'Não foi possível carregar seus exames. Tente novamente.'
const MAX_POLLS = 45 // ~3 min de teto — cobre extrações lentas (observado: até ~53 s + overhead)

export function useExamsList() {
  const [state, dispatch] = useReducer(loadReducer<ExamDTO[]>, initialLoadState<ExamDTO[]>())
  const [refreshing, setRefreshing] = useState(false)
  const hasData = useRef(false)
  // A ATRIBUIÇÃO ACONTECE APÓS O COMMIT, não durante a renderização.
  // Escrever num ref no corpo do componente é gravação em memória compartilhada durante uma renderização que
  // o React pode descartar — o efeito da escrita fica, o resultado da renderização não. Aqui o valor só é lido
  // dentro de callbacks e efeitos, todos posteriores ao commit, então mover a atribuição não muda comportamento
  // nenhum e tira a fragilidade.
  useEffect(() => { hasData.current = state.data !== null })

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

  // Puxar-para-atualizar: refresh manual (indicador próprio; mantém a lista se falhar).
  const refresh = useCallback(async () => {
    setRefreshing(true)
    try {
      const data = await apiClient.exams.listExams()
      dispatch({ type: 'SET', data })
    } catch {
      /* mantém a lista atual */
    } finally {
      setRefreshing(false)
    }
  }, [])

  // Polling enquanto algum exame está processando.
  const pollsRef = useRef(0)
  useEffect(() => {
    const active = (state.data ?? []).some((e) => isExamProcessing(e.status))
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

  return { phase: state.phase, exams: state.data, error: state.error, retry, refresh, refreshing }
}

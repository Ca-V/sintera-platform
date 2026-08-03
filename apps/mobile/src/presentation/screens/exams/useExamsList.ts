// Hook da LISTA de exames (Inc.5). Encapsula o reducer de carga + `apiClient.exams.listExams` (FRONTEIRA
// Inc.1: nenhum Supabase direto). Read-only. `exams = []` = usuário sem exames (estado vazio, não erro).
//
// Inc.6: RE-BUSCA ao FOCAR a tela (após upload, troca de aba, voltar do detalhe) para a lista ficar sempre
// fresca. O 1º foco (sem dados) carrega com spinner; refocos fazem refresh SILENCIOSO (evento SET) — e se o
// refresh falhar com dados já em tela, MANTÉM os dados (não "some" a lista). Corrige o some/reaparece observado.
//
// POLLING (Inc.6): enquanto houver exame em `pending`/`processing` (a extração roda no servidor após o upload),
// re-busca em segundo plano a cada 4 s para o status atualizar sozinho (pending→processing→processed), como a
// Web. Para ao estabilizar; teto de segurança para não pollar indefinidamente se algo ficar preso.
import { useReducer, useCallback, useRef, useEffect } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import type { ExamDTO } from '@sintera/api-client'
import { apiClient } from '../../../infrastructure/apiClient'
import { loadReducer, initialLoadState } from './loadMachine'

const LIST_ERROR = 'Não foi possível carregar seus exames. Tente novamente.'

function messageFor(e: unknown, fallback: string): string {
  return e instanceof Error && e.message ? e.message : fallback
}

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
        if (silent && hasData.current) return // refresh falhou mas já há lista → mantém (não some)
        dispatch({ type: 'FAILURE', error: messageFor(e, LIST_ERROR) })
      })
    return () => controller.abort()
  }, [])

  // Ao FOCAR: sem dados → carga com spinner; com dados → refresh silencioso. Cobre o 1º load e os refocos.
  useFocusEffect(useCallback(() => load(hasData.current), [load]))

  // Polling enquanto algum exame está em processamento (atualiza o status sozinho, sem piscar).
  const pollsRef = useRef(0)
  const MAX_POLLS = 20 // ~80 s de teto; evita polling infinito se o servidor deixar preso em 'processing'
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

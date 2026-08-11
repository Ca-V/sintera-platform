// Hook do DETALHE de um exame (Inc.5/6 + paridade). Reducer de carga + `apiClient.exams` (FRONTEIRA Inc.1).
// `exam = null` na fase `ready` = inexistente/de outro usuário (RLS) → tela mostra "não encontrado".
// Carrega, junto do exame, os RESULTADOS estruturados (biomarcadores) e clínicos (UCDA) — paridade com a Web.
// POLLING enquanto processa; auto-análise de pendente; REPROCESSAR (analyze) com feedback; EXCLUIR; EDITAR campos.
import { useReducer, useEffect, useCallback, useRef, useState } from 'react'
import type { ExamDetailDTO, BiomarkerDTO } from '@sintera/api-client'
import { clinicalResultsToUcda, type UcdaRepresentation, sortBiomarkers } from '@sintera/core'
import { apiClient } from '../../../infrastructure/apiClient'
import { loadReducer, initialLoadState, loadErrorMessage } from './loadMachine'
import { isExamProcessing, examProcessingState } from './examStatus'

const DETAIL_ERROR = 'Não foi possível carregar o exame. Tente novamente.'
const MAX_POLLS = 45 // ~3 min de teto — cobre extrações lentas (server-side; observado até ~53 s + overhead)

/** Estado da reanálise ("Extrair novamente"), com paridade à Web: em progresso · aviso "certificado" · erro. */
export interface AnalyzeState {
  running: boolean
  notice: string | null // representação já certificada → reextrair não altera nada (aviso neutro)
  error: string | null
}

export function useExam(id: string) {
  const [state, dispatch] = useReducer(loadReducer<ExamDetailDTO | null>, initialLoadState<ExamDetailDTO | null>())
  const hasData = useRef(false)
  hasData.current = state.data != null

  // Resultados do exame (carregados junto; recarregados a cada refresh silencioso do polling).
  const [biomarkers, setBiomarkers] = useState<BiomarkerDTO[]>([])
  const [clinical, setClinical] = useState<UcdaRepresentation | null>(null)
  const [analyze, setAnalyze] = useState<AnalyzeState>({ running: false, notice: null, error: null })

  const loadResults = useCallback((signal?: AbortSignal) => {
    void apiClient.exams.getExamBiomarkers(id, signal).then(bs => setBiomarkers(sortBiomarkers(bs))).catch(() => {})
    void apiClient.exams.getExamClinicalResults(id, signal).then(rows => setClinical(clinicalResultsToUcda(rows))).catch(() => {})
  }, [id])

  const load = useCallback((silent: boolean) => {
    const controller = new AbortController()
    if (!silent) dispatch({ type: 'LOAD' })
    apiClient.exams
      .getExam(id, controller.signal)
      .then((data) => {
        dispatch(silent ? { type: 'SET', data } : { type: 'SUCCESS', data })
        if (data) loadResults(controller.signal)
      })
      .catch((e) => {
        if (controller.signal.aborted) return
        if (silent && hasData.current) return // refresh falhou com dado em tela → mantém
        dispatch({ type: 'FAILURE', error: loadErrorMessage(e, DETAIL_ERROR) })
      })
    return () => controller.abort()
  }, [id, loadResults])

  // Carga inicial + quando o id muda (com spinner).
  useEffect(() => load(false), [load])

  // Polling enquanto o exame processa (atualiza exame + resultados sozinho).
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

  // Auto-processar exame PENDENTE ao abrir (paridade Web) — recupera órfãos cujo disparo não ocorreu.
  const autoRef = useRef(false)
  useEffect(() => {
    if (state.data && examProcessingState(state.data.status) === 'pending' && !autoRef.current) {
      autoRef.current = true
      void apiClient.exams.analyzeExam(id)
      dispatch({ type: 'SET', data: { ...state.data, status: 'processing' } })
    }
  }, [state.data, id])

  // Reprocessar ("Extrair novamente") — paridade Web: feedback em progresso, aviso "certificado", erro.
  // Otimista: marca 'processing' local → o polling assume e rebusca exame + resultados.
  const reanalyze = useCallback(async () => {
    setAnalyze({ running: true, notice: null, error: null })
    const { error } = await apiClient.exams.analyzeExam(id)
    if (error) {
      setAnalyze({ running: false, notice: null, error: error.message || 'Falha ao reprocessar. Tente novamente.' })
      load(true)
      return
    }
    setAnalyze({ running: false, notice: null, error: null })
    if (state.data) dispatch({ type: 'SET', data: { ...state.data, status: 'processing' } })
  }, [id, state.data, load])

  // Exclusão pelo dono.
  const remove = useCallback(() => apiClient.exams.deleteExam(id), [id])

  // Editar campos do exame (renomear/data/financeiro/vínculo) — otimista + rebusca.
  const updateFields = useCallback(async (patch: Parameters<typeof apiClient.exams.updateExam>[1]) => {
    const { error } = await apiClient.exams.updateExam(id, patch)
    if (!error && state.data) dispatch({ type: 'SET', data: { ...state.data, ...patch } as ExamDetailDTO })
    return { error }
  }, [id, state.data])

  // Reportar problema (usage_events) — best-effort.
  const reportProblem = useCallback((descricao: string) =>
    apiClient.events.logEvent('problema_reportado', { exam_id: id, descricao, categoria: 'erro_extracao' }),
  [id])

  const retry = useCallback(() => load(false), [load])

  return {
    phase: state.phase, exam: state.data, error: state.error,
    biomarkers, clinical, analyze,
    retry, reanalyze, remove, updateFields, reportProblem,
  }
}

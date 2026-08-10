// Hook do UPLOAD de exame (Inc.6) — invólucro FINO: liga o reducer puro (`uploadMachine`) à orquestração pura
// (`uploadController`), injetando as PORTAS reais (picker nativo + `apiClient.exams` + telemetria). FRONTEIRA
// Inc.1: nenhum Supabase direto — tudo via `apiClient`. Toda a lógica já é testada nos módulos puros.
import { useReducer, useCallback, useEffect, useRef, useState } from 'react'
import { DEFAULT_UPLOAD_CONSTRAINTS, type PickedImage } from '@sintera/api-client'
import { noopObservability } from '@sintera/core'
import { apiClient } from '../../../infrastructure/apiClient'
import { documentPicker } from '../../../infrastructure/documentPickerAdapter'
import { imagesToPdf } from '../../../infrastructure/imagesToPdf'
import { uploadReducer, initialUploadState } from './uploadMachine'
import { startUpload, startUploadWithFile, resumeUpload, nameWithoutExt, type UploadDeps } from './uploadController'

// Portas reais (singletons). Telemetria = no-op por ora (impl real entra atrás da mesma porta @sintera/core).
const deps: UploadDeps = {
  picker: documentPicker,
  write: apiClient.exams,
  constraints: DEFAULT_UPLOAD_CONSTRAINTS,
  telemetry: noopObservability.telemetry,
}

export function useExamUpload() {
  const [state, dispatch] = useReducer(uploadReducer, initialUploadState)
  const analyzedRef = useRef(false)

  // Ao concluir (createExam ok), dispara a extração — PONTE TRANSITÓRIA (ADR-020): reusa a rota /analyze da Web.
  // Fire-and-forget: não bloqueia o "Concluído"; o status (pending→processing→processed) aparece no refresh da
  // lista. Falha na análise NÃO reverte o upload (o documento já está salvo e visível).
  useEffect(() => {
    if (state.phase === 'done' && state.examId && !analyzedRef.current) {
      analyzedRef.current = true
      void apiClient.exams.analyzeExam(state.examId)
    }
  }, [state.phase, state.examId])

  const pick = useCallback((source: 'document' | 'camera') => {
    void startUpload(source, {}, deps, dispatch)
  }, [])

  const retry = useCallback(() => {
    // Retoma a etapa pendente (o controller decide reenviar ou recriar); `type` re-derivado do arquivo mantido.
    const file = state.file
      ? { uri: state.file.uri, mimeType: state.file.mimeType ?? 'application/octet-stream', sizeBytes: state.file.sizeBytes }
      : null
    const type = state.file ? nameWithoutExt(state.file.name) : ''
    void resumeUpload({ file, upload: state.upload }, { type }, deps, dispatch)
  }, [state.file, state.upload])

  const reset = useCallback(() => dispatch({ type: 'RESET' }), [])

  // ── Bundle multipágina (paridade Web): monta um documento a partir de VÁRIAS imagens → 1 PDF → upload único. ──
  const [pages, setPages] = useState<PickedImage[]>([])
  const [combining, setCombining] = useState(false)

  const addFromGallery = useCallback(async () => {
    const imgs = await documentPicker.pickImages()
    if (imgs?.length) setPages(prev => [...prev, ...imgs])
  }, [])
  const addFromCamera = useCallback(async () => {
    const img = await documentPicker.captureImagePage()
    if (img) setPages(prev => [...prev, img])
  }, [])
  const removePage = useCallback((i: number) => setPages(prev => prev.filter((_, j) => j !== i)), [])
  const movePage = useCallback((i: number, dir: -1 | 1) => setPages(prev => {
    const j = i + dir
    if (j < 0 || j >= prev.length) return prev
    const n = [...prev]; [n[i], n[j]] = [n[j], n[i]]; return n
  }), [])
  const resetBundle = useCallback(() => setPages([]), [])

  // Conclui o documento: 1 página → envia a própria imagem; >1 → combina em PDF (expo-print) e envia como 1 arquivo.
  const submitBundle = useCallback(async () => {
    if (!pages.length || combining) return
    setCombining(true)
    try {
      const uri = await imagesToPdf(pages.map(p => ({ base64: p.base64, mime: p.mime })))
      const count = pages.length
      setPages([])
      await startUploadWithFile(
        { uri, name: `Documento (${count} página${count !== 1 ? 's' : ''}).pdf`, sizeBytes: 0, mimeType: 'application/pdf' },
        {}, deps, dispatch,
      )
    } catch (e) {
      dispatch({ type: 'FAILURE', error: e instanceof Error ? e.message : 'Não foi possível montar o documento.' })
    } finally {
      setCombining(false)
    }
  }, [pages, combining])

  const bundle = { pages, combining, addFromGallery, addFromCamera, removePage, movePage, resetBundle, submitBundle }

  return { state, pick, retry, reset, bundle }
}

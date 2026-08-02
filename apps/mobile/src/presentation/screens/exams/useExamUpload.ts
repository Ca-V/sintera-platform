// Hook do UPLOAD de exame (Inc.6) — invólucro FINO: liga o reducer puro (`uploadMachine`) à orquestração pura
// (`uploadController`), injetando as PORTAS reais (picker nativo + `apiClient.exams` + telemetria). FRONTEIRA
// Inc.1: nenhum Supabase direto — tudo via `apiClient`. Toda a lógica já é testada nos módulos puros.
import { useReducer, useCallback, useEffect, useRef } from 'react'
import { DEFAULT_UPLOAD_CONSTRAINTS } from '@sintera/api-client'
import { noopObservability } from '@sintera/core'
import { apiClient } from '../../../infrastructure/apiClient'
import { documentPicker } from '../../../infrastructure/documentPickerAdapter'
import { uploadReducer, initialUploadState } from './uploadMachine'
import { startUpload, resumeUpload, nameWithoutExt, type UploadDeps } from './uploadController'

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

  return { state, pick, retry, reset }
}

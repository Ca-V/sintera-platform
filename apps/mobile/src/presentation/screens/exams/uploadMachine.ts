// Máquina do fluxo de UPLOAD de exame (Inc.6) — LÓGICA PURA (sem React/RN/rede/nativo). Modela os estados que a
// fundadora nomeou (31/07): Selecionando → Enviando → Processando → Concluído · Erro → Tentar novamente.
// Mapeia o fluxo em 2 etapas do contrato (uploadExam → createExam). Os efeitos (picker, upload, createExam)
// ficam no hook; aqui só a transição determinística. Análoga a loadMachine (leitura), mas para escrita.
//
// PREPARAÇÃO (docs/MOBILE-027): definida sob a exceção de antecipação (pura + 100% testável). A implementação
// funcional (hook/adaptador nativo/tela) só entra após o aceite do Inc.5.

import type { PickedFile, UploadResult } from '@sintera/api-client'

//  idle → selecting → uploading → processing → done          (RESET volta a idle)
//                        ↘ error ↙ (FAILURE)   RETRY retoma a etapa mais avançada com progresso
export type UploadPhase = 'idle' | 'selecting' | 'uploading' | 'processing' | 'done' | 'error'

export interface UploadState {
  phase: UploadPhase
  file: PickedFile | null       // arquivo escolhido (após PICKED)
  upload: UploadResult | null   // resultado do Storage (após UPLOADED)
  examId: string | null         // id do exame criado (após CREATED)
  error: string | null          // mensagem acionável quando `error`
}

export type UploadEvent =
  | { type: 'PICK' }
  | { type: 'PICKED'; file: PickedFile }
  | { type: 'CANCEL' } // usuário fechou o picker sem escolher
  | { type: 'UPLOADED'; result: UploadResult }
  | { type: 'CREATED'; id: string }
  | { type: 'FAILURE'; error: string }
  | { type: 'RETRY' }
  | { type: 'RESET' }

export const initialUploadState: UploadState = {
  phase: 'idle',
  file: null,
  upload: null,
  examId: null,
  error: null,
}

/** Retoma da etapa mais avançada que já concluiu (evita repetir trabalho): upload feito → recria; arquivo
 *  escolhido → reenvia; nada → volta a escolher. */
function resumePhase(s: UploadState): UploadState {
  if (s.upload) return { ...s, phase: 'processing', error: null }
  if (s.file) return { ...s, phase: 'uploading', error: null }
  return { ...initialUploadState, phase: 'selecting' }
}

/** Reducer puro e determinístico. Eventos inválidos para a fase são ignorados (retorna o mesmo estado). */
export function uploadReducer(state: UploadState, event: UploadEvent): UploadState {
  if (event.type === 'RESET') return initialUploadState

  switch (state.phase) {
    case 'idle':
      if (event.type === 'PICK') return { ...initialUploadState, phase: 'selecting' }
      return state
    case 'selecting':
      if (event.type === 'PICKED') return { ...state, phase: 'uploading', file: event.file, error: null }
      if (event.type === 'CANCEL') return initialUploadState
      if (event.type === 'FAILURE') return { ...state, phase: 'error', error: event.error }
      return state
    case 'uploading':
      if (event.type === 'UPLOADED') return { ...state, phase: 'processing', upload: event.result, error: null }
      if (event.type === 'FAILURE') return { ...state, phase: 'error', error: event.error }
      return state
    case 'processing':
      if (event.type === 'CREATED') return { ...state, phase: 'done', examId: event.id, error: null }
      if (event.type === 'FAILURE') return { ...state, phase: 'error', error: event.error }
      return state
    case 'error':
      if (event.type === 'RETRY') return resumePhase(state)
      return state
    case 'done':
      return state
    default:
      return state
  }
}

// Orquestração PURA do fluxo de upload (Inc.6) — o "miolo" do hook, sem React/RN/nativo/Storage. Opera sobre
// PORTAS INJETADAS (picker + escrita), então é 100% testável com fakes. O adaptador nativo do picker e o
// uploadExam/createExam concretos (Supabase Storage) são injetados NA INTEGRAÇÃO (pós-aceite do Inc.5); aqui
// só a sequência determinística: pick → validate → upload → create, com retomada em falha.
//
// Padrão da casa: lógica pura separada do React (como loadMachine/uploadMachine). O hook `useExamUpload`
// (a construir junto da tela, pós-aceite) será um invólucro fino que injeta as portas reais e o dispatch.

import { validateUpload, type DocumentPickerPort, type ExamsWriteApi, type UploadConstraints, type UploadResult } from '@sintera/api-client'
import type { CreateExamInput } from '@sintera/api-client'
import type { UploadEvent } from './uploadMachine'

/** Portas de que o fluxo depende. Injetadas por quem monta o hook (nunca conhecidas aqui pelo nome da lib). */
export interface UploadDeps {
  picker: DocumentPickerPort
  write: Pick<ExamsWriteApi, 'uploadExam' | 'createExam'>
  constraints: UploadConstraints
}

/** Metadados de exibição informados pelo usuário (form). Todos opcionais; a referência ao arquivo vem do upload. */
export type UploadMeta = Pick<CreateExamInput, 'display_title' | 'exam_date' | 'document_type' | 'issuer'>

type Dispatch = (event: UploadEvent) => void

/** Monta o input de createExam a partir do resultado do upload + metadados do form (puro). */
export function toCreateInput(result: UploadResult, meta: UploadMeta = {}): CreateExamInput {
  return {
    storagePath: result.storagePath,
    url: result.url,
    mimeType: result.mimeType,
    sizeBytes: result.sizeBytes,
    display_title: meta.display_title ?? null,
    exam_date: meta.exam_date ?? null,
    document_type: meta.document_type ?? null,
    issuer: meta.issuer ?? null,
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'Falha inesperada. Tente novamente.'
}

/** Etapa 2 (createExam). Emite CREATED ou FAILURE. */
async function doCreate(result: UploadResult, meta: UploadMeta, deps: UploadDeps, dispatch: Dispatch, signal?: AbortSignal): Promise<void> {
  try {
    const cr = await deps.write.createExam(toCreateInput(result, meta), signal)
    if (cr.error || !cr.data) return dispatch({ type: 'FAILURE', error: messageOf(cr.error) })
    dispatch({ type: 'CREATED', id: cr.data.id })
  } catch (e) {
    dispatch({ type: 'FAILURE', error: messageOf(e) })
  }
}

/** Etapa 1 (uploadExam) seguida da etapa 2. Emite UPLOADED e delega o create. */
async function doUploadThenCreate(file: { uri: string; mimeType: string; sizeBytes: number }, meta: UploadMeta, deps: UploadDeps, dispatch: Dispatch, signal?: AbortSignal): Promise<void> {
  try {
    const up = await deps.write.uploadExam(file, signal)
    if (up.error || !up.data) return dispatch({ type: 'FAILURE', error: messageOf(up.error) })
    dispatch({ type: 'UPLOADED', result: up.data })
    await doCreate(up.data, meta, deps, dispatch, signal)
  } catch (e) {
    dispatch({ type: 'FAILURE', error: messageOf(e) })
  }
}

/** Início do fluxo: seleciona (documento ou câmera) → valida → envia → cria. Cancelamento não é erro. */
export async function startUpload(source: 'document' | 'camera', meta: UploadMeta, deps: UploadDeps, dispatch: Dispatch, signal?: AbortSignal): Promise<void> {
  dispatch({ type: 'PICK' })
  let file
  try {
    file = source === 'camera' ? await deps.picker.captureImage() : await deps.picker.pickDocument()
  } catch (e) {
    return dispatch({ type: 'FAILURE', error: messageOf(e) })
  }
  if (!file) return dispatch({ type: 'CANCEL' })

  const v = validateUpload(file, deps.constraints)
  if (!v.ok) return dispatch({ type: 'FAILURE', error: v.message })

  dispatch({ type: 'PICKED', file })
  await doUploadThenCreate({ uri: file.uri, mimeType: file.mimeType as string, sizeBytes: file.sizeBytes }, meta, deps, dispatch, signal)
}

/** Retomada após falha: refaz APENAS a etapa pendente (upload já feito não repete). Espelha o resumePhase do
 *  reducer. `file`/`upload` vêm do estado corrente. */
export async function resumeUpload(
  progress: { file: { uri: string; mimeType: string; sizeBytes: number } | null; upload: UploadResult | null },
  meta: UploadMeta,
  deps: UploadDeps,
  dispatch: Dispatch,
  signal?: AbortSignal,
): Promise<void> {
  dispatch({ type: 'RETRY' })
  if (progress.upload) return doCreate(progress.upload, meta, deps, dispatch, signal)
  if (progress.file) return doUploadThenCreate(progress.file, meta, deps, dispatch, signal)
  // sem progresso: RETRY leva a 'selecting'; o usuário aciona startUpload novamente (não há o que refazer aqui).
}

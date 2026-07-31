// Orquestração PURA do fluxo de upload (Inc.6) — o "miolo" do hook, sem React/RN/nativo/Storage. Opera sobre
// PORTAS INJETADAS (picker + escrita), então é 100% testável com fakes. O adaptador nativo do picker e o
// uploadExam/createExam concretos (Supabase Storage) são injetados NA INTEGRAÇÃO (pós-aceite do Inc.5); aqui
// só a sequência determinística: pick → validate → upload → create, com retomada em falha.
//
// PARIDADE: o `type` do exame vem do NOME do arquivo sem extensão — mesma regra do processador Web
// (`src/lib/capture/processors/exam.ts`: `type: file.name.replace(/\.[^.]+$/, '')`). Campos ricos (título,
// emissor, família) são DERIVADOS pela extração depois — nunca informados aqui (REG-001).
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

/** Ajustes opcionais do usuário. `type` sobrepõe o rótulo derivado do nome do arquivo; `exam_date` é opcional. */
export type UploadMeta = { type?: string; exam_date?: string | null }

/** Campos factuais que a criação precisa (derivados, não interpretados). */
type CreateFields = { type: string; exam_date?: string | null }

type Dispatch = (event: UploadEvent) => void

/** Nome do arquivo sem extensão — paridade com a Web (`file.name.replace(/\.[^.]+$/, '')`). */
export function nameWithoutExt(name: string): string {
  return name.replace(/\.[^.]+$/, '')
}

/** Monta o input de createExam a partir do resultado do upload + campos factuais (puro). */
export function toCreateInput(result: UploadResult, fields: CreateFields): CreateExamInput {
  return { file_url: result.url, type: fields.type, exam_date: fields.exam_date ?? null }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'Falha inesperada. Tente novamente.'
}

/** Etapa 2 (createExam). Emite CREATED ou FAILURE. */
async function doCreate(result: UploadResult, fields: CreateFields, deps: UploadDeps, dispatch: Dispatch, signal?: AbortSignal): Promise<void> {
  try {
    const cr = await deps.write.createExam(toCreateInput(result, fields), signal)
    if (cr.error || !cr.data) return dispatch({ type: 'FAILURE', error: messageOf(cr.error) })
    dispatch({ type: 'CREATED', id: cr.data.id })
  } catch (e) {
    dispatch({ type: 'FAILURE', error: messageOf(e) })
  }
}

/** Etapa 1 (uploadExam) seguida da etapa 2. Emite UPLOADED e delega o create. */
async function doUploadThenCreate(file: { uri: string; mimeType: string; sizeBytes: number }, fields: CreateFields, deps: UploadDeps, dispatch: Dispatch, signal?: AbortSignal): Promise<void> {
  try {
    const up = await deps.write.uploadExam(file, signal)
    if (up.error || !up.data) return dispatch({ type: 'FAILURE', error: messageOf(up.error) })
    dispatch({ type: 'UPLOADED', result: up.data })
    await doCreate(up.data, fields, deps, dispatch, signal)
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
  const fields: CreateFields = { type: meta.type ?? nameWithoutExt(file.name), exam_date: meta.exam_date ?? null }
  await doUploadThenCreate({ uri: file.uri, mimeType: file.mimeType as string, sizeBytes: file.sizeBytes }, fields, deps, dispatch, signal)
}

/** Retomada após falha: refaz APENAS a etapa pendente (upload já feito não repete). Espelha o resumePhase do
 *  reducer. `file`/`upload` e os `fields` factuais vêm do estado corrente (mantidos pelo hook). */
export async function resumeUpload(
  progress: { file: { uri: string; mimeType: string; sizeBytes: number } | null; upload: UploadResult | null },
  fields: CreateFields,
  deps: UploadDeps,
  dispatch: Dispatch,
  signal?: AbortSignal,
): Promise<void> {
  dispatch({ type: 'RETRY' })
  if (progress.upload) return doCreate(progress.upload, fields, deps, dispatch, signal)
  if (progress.file) return doUploadThenCreate(progress.file, fields, deps, dispatch, signal)
  // sem progresso: RETRY leva a 'selecting'; o usuário aciona startUpload novamente (não há o que refazer aqui).
}

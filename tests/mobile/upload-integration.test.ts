// Teste de INTEGRAÇÃO do fluxo de Upload (Inc.6) — valida a ORQUESTRAÇÃO INTEIRA com mocks, sem Android/Storage:
//   DocumentPicker → validateUpload → uploadExam → createExam → telemetria → ESTADO FINAL.
// Diferente dos unitários: o `dispatch` aplica o REDUCER REAL, então checamos o UploadState resultante (não só a
// sequência de eventos). É o tipo de teste que pega problemas de fiação entre as camadas.
import { describe, it, expect, vi } from 'vitest'
import { startUpload, type UploadDeps } from '../../apps/mobile/src/presentation/screens/exams/uploadController'
import { uploadReducer, initialUploadState, type UploadState } from '../../apps/mobile/src/presentation/screens/exams/uploadMachine'
import { DEFAULT_UPLOAD_CONSTRAINTS } from '../../packages/api-client/src/exams/write'
import type { PickedFile } from '../../packages/api-client/src/device/documentPicker'

const PDF: PickedFile = { uri: 'file:///doc/laudo.pdf', name: 'laudo.pdf', sizeBytes: 4096, mimeType: 'application/pdf' }
const RESULT = { storagePath: 'user-1/abc.pdf', url: 'https://signed/abc', mimeType: 'application/pdf', sizeBytes: 4096 }

// Harness com reducer REAL: dispatch muta o estado via uploadReducer; coleta telemetria.
function harness() {
  let state: UploadState = initialUploadState
  const events: Array<Record<string, unknown>> = []
  return {
    getState: () => state,
    events,
    dispatch: (e: Parameters<typeof uploadReducer>[1]) => { state = uploadReducer(state, e) },
    telemetry: { event: (name: string, props?: Record<string, unknown>) => events.push({ name, ...props }) },
  }
}

function deps(over: Partial<{ pick: PickedFile | null; upload: unknown; create: unknown }>, telemetry: UploadDeps['telemetry']): UploadDeps {
  return {
    picker: {
      pickDocument: vi.fn().mockResolvedValue('pick' in over ? over.pick : PDF),
      captureImage: vi.fn().mockResolvedValue('pick' in over ? over.pick : PDF),
    },
    write: {
      uploadExam: vi.fn().mockResolvedValue(over.upload ?? { data: RESULT, error: null }),
      createExam: vi.fn().mockResolvedValue(over.create ?? { data: { id: 'exam-42' }, error: null }),
    },
    constraints: DEFAULT_UPLOAD_CONSTRAINTS,
    telemetry,
  }
}

describe('Upload Inc.6 — integração ponta a ponta (mocks + reducer real)', () => {
  it('sucesso: estado final = done com examId; telemetria started→succeeded', async () => {
    const h = harness()
    await startUpload('document', {}, deps({}, h.telemetry), h.dispatch)
    const s = h.getState()
    expect(s.phase).toBe('done')
    expect(s.examId).toBe('exam-42')
    expect(s.upload).toEqual(RESULT)
    expect(s.error).toBeNull()
    expect(h.events.map((e) => e.outcome)).toEqual(['started', 'succeeded'])
  })

  it('falha no upload: estado final = error com mensagem; createExam NÃO chamado', async () => {
    const h = harness()
    const d = deps({ upload: { data: null, error: new Error('storage indisponível') } }, h.telemetry)
    await startUpload('document', {}, d, h.dispatch)
    const s = h.getState()
    expect(s.phase).toBe('error')
    expect(s.error).toBe('storage indisponível')
    expect(d.write.createExam).not.toHaveBeenCalled()
    expect(h.events.at(-1)).toMatchObject({ outcome: 'failed', step: 'upload' })
  })

  it('arquivo inválido: nem uploadExam é chamado; estado final = error', async () => {
    const h = harness()
    const d = deps({ pick: { ...PDF, name: 'v.exe', mimeType: 'application/octet-stream' } }, h.telemetry)
    await startUpload('document', {}, d, h.dispatch)
    expect(h.getState().phase).toBe('error')
    expect(d.write.uploadExam).not.toHaveBeenCalled()
    expect(h.events.at(-1)).toMatchObject({ outcome: 'rejected', reason: 'extension' })
  })

  it('cancelamento: estado final volta a idle; nada é enviado', async () => {
    const h = harness()
    const d = deps({ pick: null }, h.telemetry)
    await startUpload('document', {}, d, h.dispatch)
    expect(h.getState().phase).toBe('idle')
    expect(d.write.uploadExam).not.toHaveBeenCalled()
    expect(h.events.map((e) => e.outcome)).toEqual(['started', 'cancelled'])
  })
})

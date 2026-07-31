// Controller PURO do fluxo de upload (Inc.6) — orquestração sobre portas injetadas (picker + write). Verifica a
// SEQUÊNCIA de eventos emitida em cada caminho, com fakes (sem React/nativo/Storage). Espelha o padrão da casa
// de testar a lógica do hook sem renderHook.
import { describe, it, expect, vi } from 'vitest'
import { startUpload, resumeUpload, toCreateInput, type UploadDeps } from '../../apps/mobile/src/presentation/screens/exams/uploadController'
import { DEFAULT_UPLOAD_CONSTRAINTS } from '../../packages/api-client/src/exams/write'
import type { PickedFile } from '../../packages/api-client/src/device/documentPicker'

const validFile: PickedFile = { uri: 'file://x', name: 'laudo.pdf', sizeBytes: 2048, mimeType: 'application/pdf' }
const uploadResult = { storagePath: 'exams/gen-id', url: 'https://x/gen-id', mimeType: 'application/pdf', sizeBytes: 2048 }

function deps(over: Partial<{ pick: PickedFile | null; pickThrows: boolean; upload: unknown; create: unknown }> = {}): UploadDeps {
  return {
    picker: {
      pickDocument: over.pickThrows
        ? vi.fn().mockRejectedValue(new Error('device'))
        : vi.fn().mockResolvedValue('pick' in over ? over.pick : validFile),
      captureImage: vi.fn().mockResolvedValue('pick' in over ? over.pick : validFile),
    },
    write: {
      uploadExam: vi.fn().mockResolvedValue(over.upload ?? { data: uploadResult, error: null }),
      createExam: vi.fn().mockResolvedValue(over.create ?? { data: { id: 'exam-1' }, error: null }),
    },
    constraints: DEFAULT_UPLOAD_CONSTRAINTS,
  }
}

const types = (calls: { type: string }[]) => calls.map((c) => c.type)

describe('uploadController — orquestração pura do Inc.6', () => {
  it('toCreateInput deriva o input de createExam do resultado do upload', () => {
    expect(toCreateInput(uploadResult, { display_title: 'Hemograma' })).toMatchObject({
      storagePath: 'exams/gen-id', url: 'https://x/gen-id', display_title: 'Hemograma', exam_date: null,
    })
  })

  it('caminho feliz: PICK → PICKED → UPLOADED → CREATED', async () => {
    const d = vi.fn()
    await startUpload('document', {}, deps(), d)
    expect(types(d.mock.calls.map((c) => c[0]))).toEqual(['PICK', 'PICKED', 'UPLOADED', 'CREATED'])
  })

  it('câmera usa captureImage', async () => {
    const dp = deps()
    await startUpload('camera', {}, dp, vi.fn())
    expect(dp.picker.captureImage).toHaveBeenCalled()
    expect(dp.picker.pickDocument).not.toHaveBeenCalled()
  })

  it('cancelamento no picker: PICK → CANCEL (sem erro)', async () => {
    const d = vi.fn()
    await startUpload('document', {}, deps({ pick: null }), d)
    expect(types(d.mock.calls.map((c) => c[0]))).toEqual(['PICK', 'CANCEL'])
  })

  it('arquivo inválido não sobe: PICK → FAILURE (não chama uploadExam)', async () => {
    const d = vi.fn()
    const dp = deps({ pick: { ...validFile, name: 'x.exe', mimeType: 'application/octet-stream' } })
    await startUpload('document', {}, dp, d)
    expect(types(d.mock.calls.map((c) => c[0]))).toEqual(['PICK', 'FAILURE'])
    expect(dp.write.uploadExam).not.toHaveBeenCalled()
  })

  it('falha do picker (device) vira FAILURE', async () => {
    const d = vi.fn()
    await startUpload('document', {}, deps({ pickThrows: true }), d)
    expect(types(d.mock.calls.map((c) => c[0]))).toEqual(['PICK', 'FAILURE'])
  })

  it('erro no upload interrompe antes do create: PICK → PICKED → FAILURE', async () => {
    const d = vi.fn()
    const dp = deps({ upload: { data: null, error: new Error('storage 500') } })
    await startUpload('document', {}, dp, d)
    expect(types(d.mock.calls.map((c) => c[0]))).toEqual(['PICK', 'PICKED', 'FAILURE'])
    expect(dp.write.createExam).not.toHaveBeenCalled()
  })

  it('erro no createExam após upload: PICK → PICKED → UPLOADED → FAILURE', async () => {
    const d = vi.fn()
    await startUpload('document', {}, deps({ create: { data: null, error: new Error('db') } }), d)
    expect(types(d.mock.calls.map((c) => c[0]))).toEqual(['PICK', 'PICKED', 'UPLOADED', 'FAILURE'])
  })

  it('resume com upload já feito: RETRY → CREATED (NÃO repete uploadExam)', async () => {
    const d = vi.fn()
    const dp = deps()
    await resumeUpload({ file: null, upload: uploadResult }, {}, dp, d)
    expect(types(d.mock.calls.map((c) => c[0]))).toEqual(['RETRY', 'CREATED'])
    expect(dp.write.uploadExam).not.toHaveBeenCalled()
  })

  it('resume com arquivo (upload falhara): RETRY → UPLOADED → CREATED', async () => {
    const d = vi.fn()
    await resumeUpload({ file: { uri: 'file://x', mimeType: 'application/pdf', sizeBytes: 2048 }, upload: null }, {}, deps(), d)
    expect(types(d.mock.calls.map((c) => c[0]))).toEqual(['RETRY', 'UPLOADED', 'CREATED'])
  })
})

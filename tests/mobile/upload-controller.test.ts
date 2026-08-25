// Controller PURO do fluxo de upload (Inc.6) — orquestração sobre portas injetadas (picker + write). Verifica a
// SEQUÊNCIA de eventos emitida em cada caminho, com fakes (sem React/nativo/Storage). Espelha o padrão da casa
// de testar a lógica do hook sem renderHook.
import { describe, it, expect, vi } from 'vitest'
import { startUpload, resumeUpload, toCreateInput, nameWithoutExt, type UploadDeps } from '../../apps/mobile/src/presentation/screens/exams/uploadController'
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
      // ANEXO-001 — seleção de VÁRIOS arquivos; o port passou a exigir.
      pickDocuments: vi.fn().mockResolvedValue(null),
      pickImages: vi.fn().mockResolvedValue(null),
      captureImagePage: vi.fn().mockResolvedValue(null),
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
  it('toCreateInput monta o input ALINHADO à Web (file_url + type + exam_date; document_type null p/ resultado)', () => {
    expect(toCreateInput(uploadResult, { type: 'laudo' })).toEqual({
      file_url: 'https://x/gen-id', type: 'laudo', exam_date: null, document_type: null,
    })
  })
  it('toCreateInput carrega document_type quando DECLARADO (Pedido de exame → medical_order)', () => {
    expect(toCreateInput(uploadResult, { type: 'pedido', document_type: 'medical_order' }).document_type).toBe('medical_order')
  })

  it('nameWithoutExt espelha a regra da Web (nome sem extensão)', () => {
    expect(nameWithoutExt('laudo.pdf')).toBe('laudo')
    expect(nameWithoutExt('exame.final.jpg')).toBe('exame.final')
  })

  it('caminho feliz: PICK → PICKED → UPLOADED → CREATED', async () => {
    const d = vi.fn()
    await startUpload('document', {}, deps(), d)
    expect(types(d.mock.calls.map((c) => c[0]))).toEqual(['PICK', 'PICKED', 'UPLOADED', 'CREATED'])
  })

  it('paridade: createExam recebe type derivado do nome do arquivo (sem extensão)', async () => {
    const dp = deps() // arquivo 'laudo.pdf'
    await startUpload('document', {}, dp, vi.fn())
    expect(dp.write.createExam).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'laudo', file_url: uploadResult.url }),
      undefined,
    )
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
    await resumeUpload({ file: null, upload: uploadResult }, { type: 'laudo' }, dp, d)
    expect(types(d.mock.calls.map((c) => c[0]))).toEqual(['RETRY', 'CREATED'])
    expect(dp.write.uploadExam).not.toHaveBeenCalled()
  })

  it('resume com arquivo (upload falhara): RETRY → UPLOADED → CREATED', async () => {
    const d = vi.fn()
    await resumeUpload({ file: { uri: 'file://x', mimeType: 'application/pdf', sizeBytes: 2048 }, upload: null }, { type: 'laudo' }, deps(), d)
    expect(types(d.mock.calls.map((c) => c[0]))).toEqual(['RETRY', 'UPLOADED', 'CREATED'])
  })

  describe('telemetria (porta @sintera/core, sem PII)', () => {
    // Coletor fake — captura os eventos emitidos.
    function withTelemetry(over: Parameters<typeof deps>[0] = {}) {
      const events: Array<{ name: string; props?: Record<string, unknown> }> = []
      const d = deps(over)
      d.telemetry = { event: (name, props) => events.push({ name, props }) }
      return { deps: d, events }
    }

    it('caminho feliz emite exam_upload started → succeeded', async () => {
      const { deps: dp, events } = withTelemetry()
      await startUpload('document', {}, dp, vi.fn())
      expect(events.map((e) => e.props?.outcome)).toEqual(['started', 'succeeded'])
      expect(events[0].name).toBe('exam_upload')
    })

    it('cancelamento emite outcome cancelled', async () => {
      const { deps: dp, events } = withTelemetry({ pick: null })
      await startUpload('document', {}, dp, vi.fn())
      expect(events.map((e) => e.props?.outcome)).toEqual(['started', 'cancelled'])
    })

    it('arquivo inválido emite rejected com reason (código, sem nome do arquivo)', async () => {
      const { deps: dp, events } = withTelemetry({ pick: { uri: 'f', name: 'x.exe', sizeBytes: 10, mimeType: 'application/octet-stream' } })
      await startUpload('document', {}, dp, vi.fn())
      expect(events[1]).toMatchObject({ props: { outcome: 'rejected', reason: 'extension' } })
      // garante ausência de PII: nenhuma prop carrega o nome do arquivo
      expect(JSON.stringify(events)).not.toContain('x.exe')
    })

    it('falha no upload emite failed com step=upload', async () => {
      const { deps: dp, events } = withTelemetry({ upload: { data: null, error: new Error('500') } })
      await startUpload('document', {}, dp, vi.fn())
      expect(events.at(-1)).toMatchObject({ props: { outcome: 'failed', step: 'upload' } })
    })

    it('telemetria que lança NÃO quebra o fluxo', async () => {
      const dp = deps()
      dp.telemetry = { event: () => { throw new Error('sink caiu') } }
      const d = vi.fn()
      await expect(startUpload('document', {}, dp, d)).resolves.toBeUndefined()
      expect(types(d.mock.calls.map((c) => c[0]))).toEqual(['PICK', 'PICKED', 'UPLOADED', 'CREATED'])
    })
  })
})

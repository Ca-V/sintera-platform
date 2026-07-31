// Reducer do fluxo de UPLOAD (Inc.6) — puro/determinístico, testável sem emulador. Cobre o caminho feliz
// (selecting→uploading→processing→done), cancelamento, falhas em cada etapa e o RETRY que retoma a etapa
// mais avançada com progresso (não repete upload já concluído).
import { describe, it, expect } from 'vitest'
import {
  uploadReducer,
  initialUploadState,
  type UploadState,
} from '../../apps/mobile/src/presentation/screens/exams/uploadMachine'

const file = { uri: 'file://x', name: 'laudo.pdf', sizeBytes: 1024, mimeType: 'application/pdf' }
const result = { storagePath: 'exams/abc123', url: 'https://x/abc123', mimeType: 'application/pdf', sizeBytes: 1024 }

function run(events: Parameters<typeof uploadReducer>[1][], from: UploadState = initialUploadState): UploadState {
  return events.reduce(uploadReducer, from)
}

describe('uploadReducer (fluxo de upload do Inc.6)', () => {
  it('caminho feliz: idle→selecting→uploading→processing→done', () => {
    const s = run([{ type: 'PICK' }, { type: 'PICKED', file }, { type: 'UPLOADED', result }, { type: 'CREATED', id: 'e1' }])
    expect(s.phase).toBe('done')
    expect(s.examId).toBe('e1')
    expect(s.upload).toEqual(result)
    expect(s.error).toBeNull()
  })

  it('CANCEL no picker volta a idle', () => {
    const s = run([{ type: 'PICK' }, { type: 'CANCEL' }])
    expect(s).toEqual(initialUploadState)
  })

  it('falha no upload → error; RETRY retoma o ENVIO (mantém o arquivo, não re-seleciona)', () => {
    const s = run([{ type: 'PICK' }, { type: 'PICKED', file }, { type: 'FAILURE', error: 'rede' }])
    expect(s.phase).toBe('error')
    expect(s.error).toBe('rede')
    const retry = uploadReducer(s, { type: 'RETRY' })
    expect(retry.phase).toBe('uploading')
    expect(retry.file).toEqual(file)
  })

  it('falha no createExam → error; RETRY retoma o PROCESSAMENTO (upload já feito não repete)', () => {
    const s = run([
      { type: 'PICK' }, { type: 'PICKED', file }, { type: 'UPLOADED', result }, { type: 'FAILURE', error: 'db' },
    ])
    expect(s.phase).toBe('error')
    const retry = uploadReducer(s, { type: 'RETRY' })
    expect(retry.phase).toBe('processing')
    expect(retry.upload).toEqual(result)
  })

  it('RESET volta a idle de qualquer fase', () => {
    const done = run([{ type: 'PICK' }, { type: 'PICKED', file }, { type: 'UPLOADED', result }, { type: 'CREATED', id: 'e1' }])
    expect(uploadReducer(done, { type: 'RESET' })).toEqual(initialUploadState)
  })

  it('ignora eventos inválidos para a fase (retorna o mesmo estado)', () => {
    const selecting = uploadReducer(initialUploadState, { type: 'PICK' })
    expect(uploadReducer(selecting, { type: 'CREATED', id: 'x' })).toBe(selecting)
  })
})

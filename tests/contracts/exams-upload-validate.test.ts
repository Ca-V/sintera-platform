// Contrato compartilhado — validação PURA de upload (api-client). Cobre os requisitos não-funcionais da
// fundadora (31/07): extensão · tamanho · MIME · arquivo vazio. Determinístico, sem device/rede.
import { describe, it, expect } from 'vitest'
import { validateUpload } from '../../packages/api-client/src/exams/validateUpload'
import { DEFAULT_UPLOAD_CONSTRAINTS } from '../../packages/api-client/src/exams/write'
import type { PickedFile } from '../../packages/api-client/src/device/documentPicker'

const ok: PickedFile = { uri: 'file://x', name: 'laudo.pdf', sizeBytes: 1024, mimeType: 'application/pdf' }

describe('validateUpload (requisitos não-funcionais do Inc.6)', () => {
  it('aceita PDF válido dentro do limite', () => {
    expect(validateUpload(ok, DEFAULT_UPLOAD_CONSTRAINTS)).toEqual({ ok: true })
  })

  it('rejeita arquivo vazio', () => {
    const r = validateUpload({ ...ok, sizeBytes: 0 }, DEFAULT_UPLOAD_CONSTRAINTS)
    expect(r).toMatchObject({ ok: false, reason: 'empty' })
  })

  it('rejeita extensão não permitida', () => {
    const r = validateUpload({ ...ok, name: 'malware.exe', mimeType: 'application/octet-stream' }, DEFAULT_UPLOAD_CONSTRAINTS)
    expect(r).toMatchObject({ ok: false, reason: 'extension' })
  })

  it('rejeita arquivo acima do tamanho máximo', () => {
    const r = validateUpload({ ...ok, sizeBytes: DEFAULT_UPLOAD_CONSTRAINTS.maxBytes + 1 }, DEFAULT_UPLOAD_CONSTRAINTS)
    expect(r).toMatchObject({ ok: false, reason: 'size' })
  })

  it('rejeita MIME ausente ou não suportado', () => {
    expect(validateUpload({ ...ok, mimeType: null }, DEFAULT_UPLOAD_CONSTRAINTS)).toMatchObject({ ok: false, reason: 'mime' })
    expect(validateUpload({ ...ok, name: 'x.pdf', mimeType: 'text/html' }, DEFAULT_UPLOAD_CONSTRAINTS)).toMatchObject({ ok: false, reason: 'mime' })
  })

  it('aceita imagem de laudo (jpeg) válida', () => {
    expect(validateUpload({ ...ok, name: 'exame.jpg', mimeType: 'image/jpeg' }, DEFAULT_UPLOAD_CONSTRAINTS)).toEqual({ ok: true })
  })
})

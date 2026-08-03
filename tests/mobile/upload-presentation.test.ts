// Apresentação pura do fluxo de upload (Inc.6) — o mapa fase→texto reflete os estados de UX definidos pela
// fundadora, e os predicados de progresso/sucesso são consistentes com o reducer.
import { describe, it, expect } from 'vitest'
import { uploadPhaseLabel, isUploadBusy } from '../../apps/mobile/src/presentation/screens/exams/uploadPresentation'
import type { UploadPhase } from '../../apps/mobile/src/presentation/screens/exams/uploadMachine'

describe('uploadPresentation (estados de UX do Inc.6)', () => {
  it('mapeia cada fase para o rótulo definido pela fundadora', () => {
    expect(uploadPhaseLabel('idle')).toBe('')
    expect(uploadPhaseLabel('selecting')).toBe('Selecionando…')
    expect(uploadPhaseLabel('uploading')).toBe('Enviando…')
    expect(uploadPhaseLabel('processing')).toBe('Processando…')
    expect(uploadPhaseLabel('done')).toBe('Concluído')
    expect(uploadPhaseLabel('error')).toBe('Erro')
  })

  it('isUploadBusy só nas fases em andamento', () => {
    const busy: UploadPhase[] = ['selecting', 'uploading', 'processing']
    const idleOrTerminal: UploadPhase[] = ['idle', 'done', 'error']
    for (const p of busy) expect(isUploadBusy(p)).toBe(true)
    for (const p of idleOrTerminal) expect(isUploadBusy(p)).toBe(false)
  })
})

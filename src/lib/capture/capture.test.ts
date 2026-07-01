import { describe, it, expect } from 'vitest'
import { CAPTURE_PROCESSORS, processorFor, processorsAccepting } from './registry'
import { classifyByFilename } from './classifier/classify'
import { classifyCaptureError, captureForwarded } from './result'
import { medicationProcessor } from './processors/medication'

describe('registry de processadores', () => {
  it('não tem kinds duplicados', () => {
    const kinds = CAPTURE_PROCESSORS.map(p => p.kind)
    expect(new Set(kinds).size).toBe(kinds.length)
  })
  it('todo processador tem target, label e ao menos um MIME', () => {
    for (const p of CAPTURE_PROCESSORS) {
      expect(p.target).toMatch(/^\//)
      expect(p.label.length).toBeGreaterThan(0)
      expect(p.accepts.length).toBeGreaterThan(0)
    }
  })
  it('processorFor resolve um tipo e devolve null para unknown', () => {
    expect(processorFor('medication_label')?.target).toBe('/dashboard/medicamentos')
    expect(processorFor('unknown')).toBeNull()
  })
  it('processorsAccepting filtra por MIME', () => {
    expect(processorsAccepting('application/pdf').every(p => p.accepts.includes('application/pdf'))).toBe(true)
    // receita de medicamento é só imagem → não aceita PDF
    expect(processorsAccepting('application/pdf').some(p => p.kind === 'medication_label')).toBe(false)
  })
})

describe('classifier — heurística por nome de arquivo', () => {
  it('reconhece receita de óculos', () => {
    expect(classifyByFilename('receita_oculos_grau.pdf').kind).toBe('eyeglass_prescription')
  })
  it('reconhece medicamento', () => {
    expect(classifyByFilename('bula_losartana.jpg').kind).toBe('medication_label')
  })
  it('reconhece exame ômico', () => {
    expect(classifyByFilename('painel_genomico.pdf').kind).toBe('omics')
  })
  it('reconhece exame', () => {
    expect(classifyByFilename('hemograma_completo.pdf').kind).toBe('exam')
  })
  it('sem sinal → unknown (UI pergunta à usuária)', () => {
    expect(classifyByFilename('IMG_2026_0001.jpg').kind).toBe('unknown')
  })
})

describe('resultado/erro unificado (contrato único)', () => {
  it('normaliza mensagens cruas de pipeline num motivo único', () => {
    expect(classifyCaptureError('PDF protegido por senha')).toBe('protected')
    expect(classifyCaptureError('arquivo muito grande (limite)')).toBe('incompatible')
    expect(classifyCaptureError('timeout na rede')).toBe('temporary')
    expect(classifyCaptureError('PDF escaneado sem texto')).toBe('unreadable')
    expect(classifyCaptureError('algo totalmente inesperado xyz')).toBe('unknown')
  })
  it('captureForwarded devolve CaptureResult unificado com destino', () => {
    const r = captureForwarded(medicationProcessor)
    expect(r.status).toBe('forwarded')
    expect(r.kind).toBe('medication_label')
    expect(r.nextHref).toBe('/dashboard/medicamentos')
    expect(r.nextActionLabel).toBe('Continuar')
  })
})

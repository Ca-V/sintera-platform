import { describe, it, expect } from 'vitest'
import { CAPTURE_PROCESSORS, processorFor, processorsAccepting } from './registry'
import { classifyCheap } from './classifier/classify'
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
  it('processorsAccepting devolve os destinos compatíveis com o MIME', () => {
    // Só devolve processadores que aceitam o formato pedido.
    expect(processorsAccepting('application/pdf').every(p => p.accepts.includes('application/pdf'))).toBe(true)
    // CAP-001 Princípio 1: a lista de destinos NÃO varia pelo tipo de arquivo —
    // todos os processadores aceitam PDF/JPG/PNG; a compatibilidade é validada no
    // envio, não escondendo destinos. Logo, para qualquer formato suportado a
    // lista é a mesma (nenhum destino é ocultado).
    for (const mime of ['application/pdf', 'image/jpeg', 'image/png']) {
      expect(processorsAccepting(mime).map(p => p.kind).sort())
        .toEqual(CAPTURE_PROCESSORS.map(p => p.kind).sort())
    }
  })
})

describe('classifier — camada barata do ContentClassifier (classifyCheap)', () => {
  it('reconhece receita de óculos', () => {
    expect(classifyCheap('application/pdf', 'receita_oculos_grau.pdf').kind).toBe('eyeglass_prescription')
  })
  it('reconhece medicamento', () => {
    expect(classifyCheap('image/jpeg', 'bula_losartana.jpg').kind).toBe('medication_label')
  })
  it('reconhece exame ômico', () => {
    expect(classifyCheap('application/pdf', 'painel_genomico.pdf').kind).toBe('omics')
  })
  it('reconhece exame', () => {
    expect(classifyCheap('application/pdf', 'hemograma_completo.pdf').kind).toBe('exam')
  })
  it('sem sinal → unknown (UI pergunta à usuária)', () => {
    expect(classifyCheap('image/jpeg', 'IMG_2026_0001.jpg').kind).toBe('unknown')
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

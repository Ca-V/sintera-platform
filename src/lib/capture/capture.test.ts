import { describe, it, expect, vi } from 'vitest'
import { CAPTURE_PROCESSORS, processorFor, processorsAccepting } from './registry'
import { classifyCheap } from './classifier/classify'
import { classifyCaptureError, captureForwarded, captureResultTone } from './result'
import { medicationProcessor } from './processors/medication'
import { eyeglassProcessor } from './processors/eyeglass'
import { examProcessor } from './processors/exam'

// Isola o scan de medicamento (rede/IA): a persistência do processador NÃO depende do scan — mesmo
// sem itens ele apenas encaminha (não salva o arquivo). Determinístico.
vi.mock('../medications/scanImage', () => ({
  scanMedicationImage: vi.fn(async () => ({ ok: false, items: [] })),
  PENDING_MED_SCAN_KEY: 'pending-med-scan',
}))

const fakeFile = (name: string, type: string) => ({ name, type, size: 8 }) as unknown as File

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

// Obs 6b — INVARIANTE: nunca apresentar confirmação de sucesso se o objeto aceito não foi
// EFETIVAMENTE persistido. Cobre os 4 cenários exigidos: (1) suportado+persistido; (2) sem
// item/processamento; (3) erro de processamento; (4) cancelamento (via tom, não-sucesso).
describe('Obs 6b — falsa confirmação: encaminhado (não persistido) nunca é sucesso', () => {
  it('captureResultTone: forwarded → "pending" (NUNCA "success"); success → "success"; error → "error"', () => {
    expect(captureResultTone('forwarded')).toBe('pending')
    expect(captureResultTone('success')).toBe('success')
    expect(captureResultTone('error')).toBe('error')
  })

  it('captureForwarded é honesto: status forwarded, informa que ainda não foi salvo, não afirma sucesso', () => {
    const r = captureForwarded(medicationProcessor)
    expect(captureResultTone(r.status)).not.toBe('success')
    expect(r.message.toLowerCase()).toMatch(/ainda não foi salvo/)
    // Não pode simular cadastro concluído/salvo com sucesso.
    expect(`${r.title} ${r.message}`.toLowerCase()).not.toMatch(/salvo com sucesso|documento salvo|cadastro concluído/)
  })

  it('(2) processadores que NÃO persistem (recurso de saúde, medicamento sem itens) → forwarded, nunca success', async () => {
    const ctx = { supabase: {} as never, userId: 'u1' }
    const eye = await eyeglassProcessor.process(fakeFile('a.pdf', 'application/pdf'), ctx)
    expect(eye.status).toBe('forwarded')
    expect(captureResultTone(eye.status)).not.toBe('success')

    const med = await medicationProcessor.process(fakeFile('b.jpg', 'image/jpeg'), ctx)
    expect(med.status).toBe('forwarded')
    expect(captureResultTone(med.status)).not.toBe('success')
  })

  it('(1) exame só afirma success APÓS persistir; (3) qualquer falha de persistência → error', async () => {
    const file = fakeFile('hemograma.pdf', 'application/pdf')
    const storageOk = {
      upload: async () => ({ error: null }),
      createSignedUrl: async () => ({ data: { signedUrl: 'https://x/s?t=1' }, error: null }),
    }
    // sucesso: upload + signed URL + insert OK → success com entityId
    const okClient = { storage: { from: () => storageOk }, from: () => ({ insert: async () => ({ error: null }) }) } as never
    const ok = await examProcessor.process(file, { supabase: okClient, userId: 'u1' })
    expect(ok.status).toBe('success')
    expect(ok.entityId).toBeTruthy()

    // falha no upload → error (não gera signed URL, não afirma sucesso)
    const failUpload = { storage: { from: () => ({ ...storageOk, upload: async () => ({ error: new Error('storage cheio') }) }) }, from: () => ({ insert: async () => ({ error: null }) }) } as never
    expect((await examProcessor.process(file, { supabase: failUpload, userId: 'u1' })).status).toBe('error')

    // arquivo subiu mas o REGISTRO não persistiu (insert falhou) → error, jamais success
    const failInsert = { storage: { from: () => storageOk }, from: () => ({ insert: async () => ({ error: new Error('rls') }) }) } as never
    expect((await examProcessor.process(file, { supabase: failInsert, userId: 'u1' })).status).toBe('error')
  })
})

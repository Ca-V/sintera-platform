// INVARIANTE DE DOMÍNIO (H-09 · camada 2) — GÊNERO documental vence MODALIDADE clínica.
// Quando a DUE reconhece o documento como PEDIDO (medical_order/insurance_guide), o tipo documental
// persistido é o GÊNERO de ordem — NUNCA a modalidade de imagem — mesmo que a classificação estrutural
// por conteúdo diga 'imaging'. Regressão original: pedido de Doppler (ab5b5816) — a DUE lia
// document_type='medical_order', mas o registro era gravado como document_type='imaging'/status='processed'
// → aparecia em Exames como exame realizado, em vez de ir para "Pedidos de exames".

import { describe, it, expect } from 'vitest'
import { resolveImageDocumentType } from '@/lib/capture/undetermined'
import { isOrderDocumentType } from '@/lib/exams/classification'

describe('Invariante gênero×modalidade — pedido reconhecido pela DUE roteia como PEDIDO', () => {
  it('DUE=medical_order + estrutura="imaging" → medical_order (NUNCA imaging)', () => {
    const t = resolveImageDocumentType('medical_order', 'imaging')
    expect(t).toBe('medical_order')
    expect(t).not.toBe('imaging')
    expect(isOrderDocumentType(t)).toBe(true)
  })

  it('DUE=insurance_guide + estrutura="imaging" → insurance_guide (roteia para Pedidos)', () => {
    const t = resolveImageDocumentType('insurance_guide', 'imaging')
    expect(t).toBe('insurance_guide')
    expect(isOrderDocumentType(t)).toBe(true)
  })

  it('modalidade de imagem preservada (legado): DUE=imaging/ophthalmology → mantém a modalidade', () => {
    expect(resolveImageDocumentType('imaging', 'laboratory')).toBe('imaging')
    expect(resolveImageDocumentType('ophthalmology', 'laboratory')).toBe('ophthalmology')
  })

  it('sem gênero especial (DUE null/desconhecido) → mantém o tipo estrutural (legado inalterado)', () => {
    expect(resolveImageDocumentType(null, 'laboratory')).toBe('laboratory')
    expect(resolveImageDocumentType(undefined, 'imaging')).toBe('imaging')
    expect(resolveImageDocumentType('laboratory', 'laboratory')).toBe('laboratory')
  })
})

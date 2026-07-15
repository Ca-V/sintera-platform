// FUNC · Classificação Exame × Pedido/Solicitação (F4).

import { describe, it, expect } from 'vitest'
import { isOrderDocumentType } from '@/lib/exams/classification'

describe('isOrderDocumentType', () => {
  it('pedido médico e guia de convênio → pedido', () => {
    expect(isOrderDocumentType('medical_order')).toBe(true)
    expect(isOrderDocumentType('insurance_guide')).toBe(true)
    expect(isOrderDocumentType(' medical_order ')).toBe(true)
  })
  it('resultados e demais tipos → NÃO pedido', () => {
    for (const t of ['laboratory', 'imaging', 'omics', 'medical_report', null, undefined, ''])
      expect(isOrderDocumentType(t)).toBe(false)
  })
})

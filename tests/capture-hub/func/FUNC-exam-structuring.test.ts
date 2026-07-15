// FUNC · Política binária de estruturação (F6 / E3) — só 2 estados; NUNCA "parcial".

import { describe, it, expect } from 'vitest'
import { binaryStructuringState, binaryStructuringLabel, STRUCTURING_LABEL } from '@/lib/exams/structuring'

describe('política binária de estruturação', () => {
  it('só "document_only" vira "Documento disponível"', () => {
    expect(binaryStructuringState('document_only')).toBe('document_only')
    expect(binaryStructuringLabel('document_only')).toBe('Documento disponível')
  })

  it('"partial" cai em "Resultados estruturados" (NUNCA parcial)', () => {
    expect(binaryStructuringState('partial')).toBe('structured')
    expect(binaryStructuringLabel('partial')).toBe('Resultados estruturados')
  })

  it('structured / nulo / desconhecido → "Resultados estruturados"', () => {
    for (const c of ['structured', null, undefined, 'qualquer_coisa'] as const) {
      expect(binaryStructuringState(c)).toBe('structured')
    }
  })

  it('nenhum rótulo binário contém a palavra "parcial"', () => {
    for (const label of Object.values(STRUCTURING_LABEL)) {
      expect(label.toLowerCase()).not.toContain('parcial')
    }
    for (const c of ['partial', 'structured', 'document_only', null]) {
      expect(binaryStructuringLabel(c).toLowerCase()).not.toContain('parcial')
    }
  })
})

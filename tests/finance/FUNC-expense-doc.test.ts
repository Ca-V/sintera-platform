// FUNC · FIN-001 — tipos de documento fiscal (NF/recibo/comprovante). PURO.
import { describe, it, expect } from 'vitest'
import { EXPENSE_DOC_TYPES, expenseDocLabel, isFiscalDocument } from '@/lib/finance/expense'

describe('FIN-001 · documento fiscal da despesa', () => {
  it('expenseDocLabel resolve os tipos e degrada para null', () => {
    expect(expenseDocLabel('nota_fiscal')).toBe('Nota fiscal')
    expect(expenseDocLabel('recibo')).toBe('Recibo')
    expect(expenseDocLabel('comprovante')).toBe('Comprovante de pagamento')
    expect(expenseDocLabel('desconhecido')).toBeNull()
    expect(expenseDocLabel('')).toBeNull()
    expect(expenseDocLabel(null)).toBeNull()
  })
  it('isFiscalDocument marca NF e recibo (relevantes p/ IR/reembolso), não comprovante/outro', () => {
    expect(isFiscalDocument('nota_fiscal')).toBe(true)
    expect(isFiscalDocument('recibo')).toBe(true)
    expect(isFiscalDocument('comprovante')).toBe(false)
    expect(isFiscalDocument('outro')).toBe(false)
    expect(isFiscalDocument(null)).toBe(false)
  })
  it('todo DEF tem rótulo resolvível (fonte única)', () => {
    for (const d of EXPENSE_DOC_TYPES) expect(expenseDocLabel(d.id)).toBe(d.label)
  })
})

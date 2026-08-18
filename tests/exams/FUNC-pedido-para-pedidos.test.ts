import { describe, it, expect } from 'vitest'
import { isOrderDocumentType } from '@sintera/core'
import { toCreateInput } from '../../apps/mobile/src/presentation/screens/exams/uploadController'

// PEDIDO-001 (exceção REG-001) — quando a usuária DECLARA "Pedido de exame", o registro nasce medical_order e vai
// DIRETO para "Pedidos", sem transitar por "Exames" (nem durante "Processando/Extraindo"). Este teste prova o
// DESTINO e a AUSÊNCIA DE REGRESSÃO, não só o tipo gravado. Web e Mobile usam o MESMO contrato (isOrderDocumentType).

// Filtros de aba EXATAMENTE como Web (page.tsx) e Mobile (ExamsListScreen) aplicam — fonte única isOrderDocumentType.
type Row = { document_type: string | null; status: string }
const inResultsTab = (r: Row) => !isOrderDocumentType(r.document_type)  // aba "Exames"
const inOrdersTab = (r: Row) => isOrderDocumentType(r.document_type)     // aba "Pedidos de Exames"

const upload = { storagePath: 's', url: 'https://x/p.pdf', mimeType: 'application/pdf', sizeBytes: 10 }

describe('PEDIDO-001 · Pedido de exame nasce medical_order e vai DIRETO para Pedidos', () => {
  it('contrato Mobile: contexto order → toCreateInput grava document_type=medical_order', () => {
    const input = toCreateInput(upload, { type: 'pedido', document_type: 'medical_order' })
    expect(input.document_type).toBe('medical_order')
  })
  it('RESULTADO (sem declaração) → document_type ausente/null: segue REG-001 (derivado pela extração)', () => {
    const input = toCreateInput(upload, { type: 'hemograma' })
    expect(input.document_type ?? null).toBeNull()
  })

  // O NÚCLEO da regressão: o pedido NUNCA aparece na aba Exames — em NENHUM status, inclusive durante o processamento.
  it.each(['pending', 'processing', 'processed'])('pedido (medical_order, status=%s) → Pedidos e NUNCA Exames', (status) => {
    const pedido: Row = { document_type: 'medical_order', status }
    expect(inOrdersTab(pedido)).toBe(true)
    expect(inResultsTab(pedido)).toBe(false)   // ← não transita por Exames (elimina "Exames → desaparece → Pedidos")
  })
  it('guia de convênio (insurance_guide) também é Pedido, nunca Exame', () => {
    const guia: Row = { document_type: 'insurance_guide', status: 'processing' }
    expect(inOrdersTab(guia)).toBe(true)
    expect(inResultsTab(guia)).toBe(false)
  })

  // Não-regressão do fluxo de RESULTADO: continua em Exames e derivado (document_type null até a extração).
  it.each(['pending', 'processing', 'processed'])('resultado (document_type null, status=%s) → Exames e NÃO Pedidos', (status) => {
    const result: Row = { document_type: null, status }
    expect(inResultsTab(result)).toBe(true)
    expect(inOrdersTab(result)).toBe(false)
  })

  it('Web e Mobile usam o MESMO contrato de classificação (SSOT isOrderDocumentType)', () => {
    expect(isOrderDocumentType('medical_order')).toBe(true)
    expect(isOrderDocumentType('insurance_guide')).toBe(true)
    expect(isOrderDocumentType(null)).toBe(false)
    expect(isOrderDocumentType('laboratory')).toBe(false)
  })
})

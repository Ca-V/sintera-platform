import { describe, it, expect } from 'vitest'
import { deriveOrderTitle } from '@/lib/clinical-pipeline/laterality'
import { isOrderDocumentType } from '@sintera/core'

// PEDIDO-002 — TÍTULO do pedido derivado dos PROCEDIMENTOS solicitados (não do filename) + separação semântica
// medical_order → Pedido / exam → Resultado (o MESMO predicado usado na lista E no detalhe).

describe('PEDIDO-002 · deriveOrderTitle — título dos procedimentos, nunca filename', () => {
  it('caso testado: Doppler venoso Esquerdo + Direito → consolida "— bilateral"', () => {
    const title = deriveOrderTitle([
      'Doppler colorido venoso de membro inferior - unilateral | Esquerdo (40901483)',
      'Doppler colorido venoso de membro inferior - unilateral | Direito (40901483)',
    ])
    expect(title).toBe('Doppler colorido venoso de membro inferior — bilateral')
  })
  it('um lado só → aquele lado (não inventa bilateral)', () => {
    expect(deriveOrderTitle(['Doppler venoso de membro inferior | Esquerdo'])).toBe('Doppler venoso de membro inferior — esquerdo')
  })
  it('procedimentos DIFERENTES → unidos por " · " (nunca fundidos em bilateral)', () => {
    const title = deriveOrderTitle(['Hemograma completo', 'Glicemia de jejum'])
    expect(title).toBe('Hemograma completo · Glicemia de jejum')
  })
  it('sem procedimento utilizável → null (o chamador NÃO deve cair no filename)', () => {
    expect(deriveOrderTitle([])).toBeNull()
    expect(deriveOrderTitle([null, undefined, '  '])).toBeNull()
  })
  it('nunca usa o nome do arquivo: "pedido" não vira título quando há procedimentos', () => {
    // o filename "pedido" não entra aqui — a fonte é a lista de procedimentos extraídos
    const title = deriveOrderTitle(['Ultrassonografia de parede abdominal'])
    expect(title).toBe('Ultrassonografia de parede abdominal')
    expect(title).not.toBe('pedido')
  })
})

describe('PEDIDO-002 · separação de renderer (mesmo predicado da lista e do detalhe)', () => {
  // Regra usada por ambos os detalhes (mobile ExamDetailScreen, web [id]/page): isOrderDoc decide Pedido × Resultado.
  const detailIsOrder = (dt: string | null | undefined) => isOrderDocumentType(dt)
  it('medical_order → detalhe de Pedido (sem "Resultados estruturados"/clinical_results)', () => {
    expect(detailIsOrder('medical_order')).toBe(true)
    expect(detailIsOrder('insurance_guide')).toBe(true)
  })
  it('exam/result → detalhe de Resultado (renderiza resultados estruturados)', () => {
    expect(detailIsOrder(null)).toBe(false)
    expect(detailIsOrder('laboratory')).toBe(false)
    expect(detailIsOrder('imaging')).toBe(false)
  })
})

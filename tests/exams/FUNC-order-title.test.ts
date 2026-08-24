import { describe, it, expect } from 'vitest'
import { deriveOrderTitle, deriveOrderDisplayTitle, isOrderDocumentType } from '@sintera/core'

// PEDIDO-002 (fechamento Ciclo 1) — TÍTULO do pedido derivado dos PROCEDIMENTOS solicitados (nunca o filename),
// através de UMA função do core (deriveOrderDisplayTitle) usada por lista E detalhe, Web E Mobile. Separação
// semântica medical_order → Pedido (ServiceRequest) / exam → Resultado. Este arquivo É o teste de regressão exigido.

describe('PEDIDO-002 · deriveOrderTitle — núcleo clínico (consolidação de lateralidade, sem prefixo)', () => {
  it('Doppler venoso Esquerdo + Direito → consolida "— bilateral"', () => {
    const title = deriveOrderTitle([
      'Doppler colorido venoso de membro inferior - unilateral | Esquerdo (40901483)',
      'Doppler colorido venoso de membro inferior - unilateral | Direito (40901483)',
    ])
    expect(title).toBe('Doppler colorido venoso de membro inferior — bilateral')
  })
  it('um lado só → aquele lado (não inventa bilateral)', () => {
    expect(deriveOrderTitle(['Doppler venoso de membro inferior | Esquerdo'])).toBe('Doppler venoso de membro inferior — esquerdo')
  })
  it('procedimentos DIFERENTES → compostos por " · " (não inventa denominação única)', () => {
    expect(deriveOrderTitle(['Hemograma completo', 'Glicemia de jejum'])).toBe('Hemograma completo · Glicemia de jejum')
  })
  it('sem procedimento utilizável → null (o chamador NÃO deve cair no filename)', () => {
    expect(deriveOrderTitle([])).toBeNull()
    expect(deriveOrderTitle([null, undefined, '  '])).toBeNull()
  })
})

describe('PEDIDO-002 · deriveOrderDisplayTitle — FUNÇÃO ÚNICA de exibição (lista+detalhe, Web+Mobile)', () => {
  // Documento concreto da homologação — critério de aceite SEM interpretação.
  it('CRITÉRIO DE ACEITE: Doppler esquerdo + direito → "Pedido de Doppler colorido venoso de membro inferior — bilateral"', () => {
    const title = deriveOrderDisplayTitle([
      'Doppler colorido venoso de membro inferior - unilateral | Esquerdo (40901483)',
      'Doppler colorido venoso de membro inferior - unilateral | Direito (40901483)',
    ])
    expect(title).toBe('Pedido de Doppler colorido venoso de membro inferior — bilateral')
  })
  it('nome próprio (Doppler) PRESERVA a maiúscula após "Pedido de"', () => {
    expect(deriveOrderDisplayTitle(['Doppler venoso de membro inferior | Esquerdo']))
      .toBe('Pedido de Doppler venoso de membro inferior — esquerdo')
  })
  it('palavra comum é minusculizada: "Ultrassonografia…" → "Pedido de ultrassonografia…"', () => {
    expect(deriveOrderDisplayTitle(['Ultrassonografia de parede abdominal']))
      .toBe('Pedido de ultrassonografia de parede abdominal')
  })
  it('sigla em maiúsculas (RM/USG/TC) é preservada após "Pedido de"', () => {
    expect(deriveOrderDisplayTitle(['RM de crânio'])).toBe('Pedido de RM de crânio')
    expect(deriveOrderDisplayTitle(['USG de abdome total'])).toBe('Pedido de USG de abdome total')
  })
  it('sem procedimentos → null (o chamador usa fallback CONTROLADO, jamais o filename)', () => {
    expect(deriveOrderDisplayTitle([])).toBeNull()
    expect(deriveOrderDisplayTitle([null, undefined, ''])).toBeNull()
  })
})

describe('PEDIDO-002 · REGRESSÃO — filename "pedido.pdf" NUNCA produz "pedido" havendo procedimentos', () => {
  // Precedência real usada por lista e detalhe: procedimento estruturado → título semântico → fallback controlado.
  // O filename NUNCA entra na cadeia (por isso não é sequer parâmetro de deriveOrderDisplayTitle).
  const displayTitle = (procedures: (string | null)[], controlledFallback: string) =>
    deriveOrderDisplayTitle(procedures) ?? controlledFallback

  it('havendo procedimentos, o título vem deles — filename "pedido"/"pedido.pdf" é irrelevante', () => {
    const procs = [
      'Doppler colorido venoso de membro inferior - unilateral | Esquerdo',
      'Doppler colorido venoso de membro inferior - unilateral | Direito',
    ]
    const title = displayTitle(procs, 'pedido.pdf')
    expect(title).toBe('Pedido de Doppler colorido venoso de membro inferior — bilateral')
    // prova explícita: o resultado não é o filename bruto nem "pedido"
    expect(title).not.toBe('pedido')
    expect(title).not.toBe('Pedido')
    expect(title).not.toBe('pedido.pdf')
  })
  it('sem procedimentos, cai no fallback CONTROLADO — nunca o filename cru', () => {
    expect(displayTitle([], 'Pedido de exame')).toBe('Pedido de exame')
  })
})

describe('PEDIDO-002 · separação semântica Pedido × Resultado (mesmo predicado em lista e detalhe)', () => {
  // Pedido (ServiceRequest) e Resultado (DiagnosticReport/Observation) são entidades distintas — não pode regredir.
  const detailIsOrder = (dt: string | null | undefined) => isOrderDocumentType(dt)
  it('medical_order/insurance_guide → detalhe de PEDIDO (sem "Resultados estruturados")', () => {
    expect(detailIsOrder('medical_order')).toBe(true)
    expect(detailIsOrder('insurance_guide')).toBe(true)
  })
  it('exam/result → detalhe de RESULTADO (renderiza resultados estruturados)', () => {
    expect(detailIsOrder(null)).toBe(false)
    expect(detailIsOrder('laboratory')).toBe(false)
    expect(detailIsOrder('imaging')).toBe(false)
  })
})

describe('PEDIDO-002 · rótulo de exclusão semântico (Web+Mobile)', () => {
  const deleteLabel = (dt: string | null | undefined) => (isOrderDocumentType(dt) ? 'Excluir pedido' : 'Excluir exame')
  it('medical_order → "Excluir pedido"; exam/result → "Excluir exame"', () => {
    expect(deleteLabel('medical_order')).toBe('Excluir pedido')
    expect(deleteLabel('insurance_guide')).toBe('Excluir pedido')
    expect(deleteLabel(null)).toBe('Excluir exame')
    expect(deleteLabel('laboratory')).toBe('Excluir exame')
  })
})

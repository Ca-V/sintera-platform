// FUNC — CONTRATO DO CARTÃO DE DOCUMENTO. A mesma anatomia em toda categoria.
//
// Pedido da fundadora (25/08): mesmo padrão de ações em todos os documentos, ajustando só a nomenclatura por
// categoria; editar e excluir OBRIGATÓRIAS. Medição do mesmo dia: nenhuma tela do Mobile permitia editar.
import { describe, it, expect } from 'vitest'
import {
  documentCardActions, hasRequiredActions, DOCUMENT_BASE_ACTIONS,
  type DocumentCategory,
} from '@sintera/core'

const TODAS: DocumentCategory[] = ['exame', 'pedido', 'receita', 'atestado', 'relatorio', 'encaminhamento', 'outro']

describe('contrato do cartão', () => {
  it('TODA categoria tem ver, editar e excluir — sem exceção', () => {
    for (const c of TODAS) {
      expect(hasRequiredActions(documentCardActions(c)), `categoria "${c}" sem ação obrigatória`).toBe(true)
    }
  })

  it('a redação das obrigatórias é a MESMA em toda categoria', () => {
    for (const c of TODAS) {
      const rotulos = documentCardActions(c).filter(a => a.kind !== 'lifecycle').map(a => a.label)
      expect(rotulos).toEqual(['Ver documento', 'Editar', 'Excluir'])
    }
  })

  it('excluir SEMPRE confirma — é irreversível', () => {
    for (const c of TODAS) {
      const excluir = documentCardActions(c).find(a => a.kind === 'delete')!
      expect(excluir.confirms, `categoria "${c}" exclui sem confirmar`).toBe(true)
    }
  })

  it('só o PEDIDO tem ciclo — é a origem do fluxo assistencial (Q1)', () => {
    expect(documentCardActions('pedido').filter(a => a.kind === 'lifecycle').map(a => a.label))
      .toEqual(['Marcar como realizado', 'Agendar'])
    for (const c of TODAS.filter(x => x !== 'pedido')) {
      expect(documentCardActions(c).some(a => a.kind === 'lifecycle'), `"${c}" não deveria ter ciclo`).toBe(false)
    }
  })

  it('o ciclo vem PRIMEIRO — é o que a pessoa costuma querer fazer', () => {
    expect(documentCardActions('pedido')[0].kind).toBe('lifecycle')
  })

  it('as obrigatórias são exatamente três', () => {
    expect(DOCUMENT_BASE_ACTIONS.map(a => a.kind)).toEqual(['view', 'edit', 'delete'])
  })

  it('um conjunto sem editar é rejeitado pela guarda', () => {
    // É a condição real que existia no Mobile: ver + excluir, sem editar.
    expect(hasRequiredActions(DOCUMENT_BASE_ACTIONS.filter(a => a.kind !== 'edit'))).toBe(false)
  })
})

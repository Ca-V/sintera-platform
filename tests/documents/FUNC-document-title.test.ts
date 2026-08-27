// FUNC · nome do documento como a pessoa o reconhece (item C do backlog de paridade).
//
// Pedido da fundadora (25/08): o card não pode dizer só "Receita" quando a plataforma SABE do que ela é — o
// vínculo com o medicamento já existe no banco, e escondê-lo obriga a abrir o documento para descobrir de qual
// remédio é aquela receita.
//
// Espelha o padrão que Exames e Pedidos já seguiam ("Pedido de hemograma"), inclusive reusando a MESMA regra
// de capitalização — duas implementações dela produziriam "de doppler" numa tela e "de Doppler" na outra.
import { describe, it, expect } from 'vitest'
import { deriveDocumentTitle } from '@sintera/core'

describe('nome do documento', () => {
  it('receita nomeia o alvo', () => {
    expect(deriveDocumentTitle('receita', ['Paracetamol'])).toBe('Receita de paracetamol')
  })

  it('encaminhamento usa PARA, não DE', () => {
    // A mesma preposição nos dois sairia errada em um deles.
    expect(deriveDocumentTitle('encaminhamento', ['Cardiologia'])).toBe('Encaminhamento para cardiologia')
  })

  it('relatório também nomeia', () => {
    expect(deriveDocumentTitle('relatorio', ['Fisioterapia'])).toBe('Relatório de fisioterapia')
  })

  it('O LIMITE REGULATÓRIO: atestado NUNCA ganha complemento, mesmo com alvo', () => {
    // "Atestado de gripe" seria afirmar conteúdo clínico, que a plataforma não produz (RDC 657).
    expect(deriveDocumentTitle('atestado', ['Gripe'])).toBe('Atestado')
    expect(deriveDocumentTitle('atestado', [])).toBe('Atestado')
  })

  it('sem alvo conhecido, devolve o rótulo puro — nunca inventa complemento', () => {
    expect(deriveDocumentTitle('receita')).toBe('Receita')
    expect(deriveDocumentTitle('receita', [])).toBe('Receita')
    expect(deriveDocumentTitle('encaminhamento', [null, undefined, '  '])).toBe('Encaminhamento')
  })

  it('vários alvos: nomeia o primeiro e conta os demais', () => {
    // Nomear todos alongaria o card sem ajudar a distinguir; a informação continua acessível ao abrir.
    expect(deriveDocumentTitle('receita', ['Paracetamol', 'Vitamina D'])).toBe('Receita de paracetamol +1')
    expect(deriveDocumentTitle('receita', ['Paracetamol', 'Vitamina D', 'Ômega 3'])).toBe('Receita de paracetamol +2')
  })

  it('a capitalização é a MESMA de Pedidos: sigla e nome próprio preservam a maiúscula', () => {
    expect(deriveDocumentTitle('relatorio', ['Doppler'])).toBe('Relatório de Doppler')
    expect(deriveDocumentTitle('encaminhamento', ['RM de crânio'])).toBe('Encaminhamento para RM de crânio')
  })

  it('"outro" não ganha complemento', () => {
    expect(deriveDocumentTitle('outro', ['Qualquer coisa'])).toBe('Outro documento')
  })

  it('espaços em volta do nome não vazam para o título', () => {
    expect(deriveDocumentTitle('receita', ['  Paracetamol  '])).toBe('Receita de paracetamol')
  })
})

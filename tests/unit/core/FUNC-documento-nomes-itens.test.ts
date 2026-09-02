// CATRACA — o que a receita prescreve, e quem assinou o documento.
//
// TRÊS ACHADOS DA HOMOLOGAÇÃO (28 a 30/08) convergem aqui:
//   8  — "não aparece o nome do medicamento, que é o item mais importante"
//   10 — "ao invés de aparecer o nome do médico, apareceu o nome da clínica"
//   11 — a receita precisa levar ao que ela prescreve
//
// A causa comum era uma só: um campo (`issuer`) para dois fatos, e nenhum campo para os itens. A leitura
// transcrevia e a plataforma descartava. A migração 151 abriu os campos; estes testes travam as REGRAS.
import { describe, it, expect } from 'vitest'
import {
  documentPrimaryName, documentSecondaryName, documentSubtitle,
  prescribedSummary, parsePrescribedItems, prescribedItemsToText,
  buildPatientDocumentInsert,
} from '@sintera/core'

describe('quem aparece na frente do documento', () => {
  it('o PROFISSIONAL vem antes da instituição — é ele quem assina e quem responde', () => {
    const doc = { professional_name: 'Victor Cunha Diniz', institution_name: 'Vox Dei Hospital Dia' }
    expect(documentPrimaryName(doc)).toBe('Victor Cunha Diniz')
    expect(documentSecondaryName(doc)).toBe('Vox Dei Hospital Dia')
  })

  it('só a instituição: ela aparece, e não some por não haver médico', () => {
    const doc = { professional_name: null, institution_name: 'Vox Dei Hospital Dia' }
    expect(documentPrimaryName(doc)).toBe('Vox Dei Hospital Dia')
    // Já foi mostrada como principal — repeti-la a seguir seria dizer o mesmo nome duas vezes.
    expect(documentSecondaryName(doc)).toBeNull()
  })

  it('DOCUMENTO ANTIGO continua legível pelo campo antigo — a migração não pode apagá-lo da tela', () => {
    // Os 4 documentos que existiam antes da migração 151 têm só `issuer`.
    expect(documentPrimaryName({ issuer: 'Dr(a). Victor Cunha Diniz' })).toBe('Dr(a). Victor Cunha Diniz')
  })

  it('sem nome nenhum, devolve null — nunca uma string vazia disfarçada', () => {
    expect(documentPrimaryName({ professional_name: '  ', institution_name: null, issuer: '' })).toBeNull()
  })
})

describe('o subtítulo do cartão', () => {
  it('O QUE FOI PRESCRITO VEM PRIMEIRO — é o que evita abrir o arquivo para saber do que se trata', () => {
    const sub = documentSubtitle({
      prescribed_items: ['Losartana 50mg'],
      professional_name: 'Victor Cunha Diniz',
      doc_date: '2025-09-25',
    })
    expect(sub.indexOf('Losartana 50mg')).toBe(0)
    expect(sub).toContain('Victor Cunha Diniz')
    expect(sub).toContain('25/09/2025')
  })

  it('sem itens, o cartão continua identificando o documento pelo nome e pela data', () => {
    const sub = documentSubtitle({ professional_name: 'Victor Cunha Diniz', doc_date: '2025-09-25' })
    expect(sub).toBe('Victor Cunha Diniz · 25/09/2025')
  })

  it('sem nada, diz quando foi guardado em vez de ficar em branco', () => {
    expect(documentSubtitle({ created_at: '2026-08-30T10:00:00Z' })).toContain('Adicionado em')
  })
})

describe('itens prescritos', () => {
  it('o resumo do cartão mostra dois e conta o resto — cartão que vira parágrafo deixa de ser lido', () => {
    expect(prescribedSummary(['A', 'B'])).toBe('A · B')
    expect(prescribedSummary(['A', 'B', 'C', 'D'])).toBe('A · B +2')
  })

  it('lista vazia não vira texto vazio: vira ausência', () => {
    expect(prescribedSummary([])).toBeNull()
    expect(prescribedSummary(null)).toBeNull()
    expect(prescribedSummary(['   '])).toBeNull()
  })

  it('uma linha por item, e linha em branco não vira item', () => {
    expect(parsePrescribedItems('Losartana 50mg\n\n  Vitamina D 2000UI  \n')).toEqual([
      'Losartana 50mg', 'Vitamina D 2000UI',
    ])
  })

  it('texto vazio vira null, NUNCA [] — vazio afirmaria que a receita não prescreve nada', () => {
    expect(parsePrescribedItems('')).toBeNull()
    expect(parsePrescribedItems('   \n  ')).toBeNull()
    expect(parsePrescribedItems(null)).toBeNull()
  })

  it('ida e volta preserva os itens', () => {
    const itens = ['Losartana 50mg', 'Vitamina D 2000UI']
    expect(parsePrescribedItems(prescribedItemsToText(itens))).toEqual(itens)
  })
})

describe('a linha que vai ao banco', () => {
  it('grava os três campos novos', () => {
    const row = buildPatientDocumentInsert('u1', {
      file_url: 'x', subtype: 'receita',
      prescribed_items: ['Losartana 50mg'],
      professional_name: 'Victor Cunha Diniz',
      institution_name: 'Vox Dei Hospital Dia',
    })
    expect(row.prescribed_items).toEqual(['Losartana 50mg'])
    expect(row.professional_name).toBe('Victor Cunha Diniz')
    expect(row.institution_name).toBe('Vox Dei Hospital Dia')
  })

  it('ausência permanece ausência: null, nunca [] nem string vazia', () => {
    const row = buildPatientDocumentInsert('u1', {
      file_url: 'x', subtype: 'receita', prescribed_items: [], professional_name: '  ',
    })
    expect(row.prescribed_items).toBeNull()
    expect(row.professional_name).toBeNull()
    expect(row.institution_name).toBeNull()
  })
})

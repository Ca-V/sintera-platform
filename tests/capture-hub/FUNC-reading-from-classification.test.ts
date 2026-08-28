// FUNC · a ponte entre o que o classificador devolve e o que a regra de divergência consome.
//
// POR QUE ESTA PONTE EXISTE: o classificador responde com UMA palavra curta e livre em `subtype`
// ("receita", "atestado", "hemograma"). A regra de divergência trabalha com os subtipos do domínio
// Documentos. Sem tradução, `documentDivergence` recebia texto livre e nunca casava — a regra estava certa e
// nunca disparava.
//
// Vive no core porque Web e Mobile precisam traduzir IGUAL. Traduções separadas divergiriam na primeira
// palavra nova que o classificador inventasse.
import { describe, it, expect } from 'vitest'
import { readingFromClassification, documentDivergence, documentSubtypeLabel } from '@sintera/core'

const alta = { kind: 'clinical_document' as const, confidence: 'high' as const }

describe('palavra do classificador → subtipo do domínio', () => {
  it('traduz as palavras conhecidas', () => {
    expect(readingFromClassification({ ...alta, subtype: 'receita' })?.subtype).toBe('receita')
    expect(readingFromClassification({ ...alta, subtype: 'atestado' })?.subtype).toBe('atestado')
    expect(readingFromClassification({ ...alta, subtype: 'encaminhamento' })?.subtype).toBe('encaminhamento')
  })

  it('O CASO DO ACENTO: "Relatório" com maiúscula e acento é reconhecido', () => {
    // O classificador escreve em português natural; a tabela é normalizada. Se esta normalização quebrar,
    // a divergência para de acusar relatório — em silêncio.
    expect(readingFromClassification({ ...alta, subtype: 'Relatório' })?.subtype).toBe('relatorio')
    expect(readingFromClassification({ ...alta, subtype: '  RELATORIO ' })?.subtype).toBe('relatorio')
  })

  it('aceita sinônimos que o classificador pode usar', () => {
    expect(readingFromClassification({ ...alta, subtype: 'prescrição' })?.subtype).toBe('receita')
    expect(readingFromClassification({ ...alta, subtype: 'declaração' })?.subtype).toBe('atestado')
  })

  it('palavra DESCONHECIDA vira ausência, nunca palpite', () => {
    // "hemograma" e "bula" não são subtipos documentais. Atribuir um subtipo errado é pior que nenhum:
    // a divergência então se resolve pelo `kind`, que é o sinal certo para esses casos.
    for (const p of ['hemograma', 'bula', 'ultrassom', 'coisa nova']) {
      expect(readingFromClassification({ ...alta, subtype: p })?.subtype, p).toBeNull()
    }
  })

  it('preserva os fatos documentais e a confiança', () => {
    const r = readingFromClassification({ ...alta, issuer: 'Dra. Ana', docDate: '2026-08-25' })
    expect(r).toMatchObject({ issuer: 'Dra. Ana', docDate: '2026-08-25', confidence: 'high' })
  })

  it('entrada ausente devolve null — leitura que falha degrada, não bloqueia', () => {
    expect(readingFromClassification(null)).toBeNull()
    expect(readingFromClassification(undefined)).toBeNull()
  })
})

describe('a cadeia completa: classificação → leitura → aviso', () => {
  // É o caso concreto da homologação de 25/08: marcar "Receita" e anexar outra coisa.
  it('marcou Receita e anexou um LAUDO — avisa e aponta o destino', () => {
    const leitura = readingFromClassification({ kind: 'exam', confidence: 'high', subtype: 'hemograma' })
    const v = documentDivergence('receita', leitura, documentSubtypeLabel)
    expect(v.diverges).toBe(true)
    expect(v.message).toContain('laudo de exame')
    expect(v.suggestedKind).toBe('exam')
  })

  it('marcou Receita e anexou um PEDIDO de exame — avisa', () => {
    const leitura = readingFromClassification({ kind: 'medical_order', confidence: 'high', subtype: 'pedido' })
    const v = documentDivergence('receita', leitura, documentSubtypeLabel)
    expect(v.diverges).toBe(true)
    expect(v.message).toContain('pedido de exame')
  })

  it('marcou Receita e anexou um ATESTADO — divergência de SUBTIPO, dentro do mesmo domínio', () => {
    const leitura = readingFromClassification({ ...alta, subtype: 'atestado' })
    const v = documentDivergence('receita', leitura, documentSubtypeLabel)
    expect(v.diverges).toBe(true)
    // Minúscula no meio da frase: "…mas este documento parece um atestado."
    expect(v.message).toContain('um atestado')
    expect(v.suggestedKind).toBe('clinical_document')
  })

  it('marcou Receita e anexou uma RECEITA — não avisa nada', () => {
    const leitura = readingFromClassification({ ...alta, subtype: 'receita' })
    expect(documentDivergence('receita', leitura, documentSubtypeLabel).diverges).toBe(false)
  })

  it('confiança BAIXA não avisa, mesmo divergindo', () => {
    // Palpite fraco que contradiz a pessoa treina a ignorar o aviso.
    const leitura = readingFromClassification({ kind: 'exam', confidence: 'low' })
    expect(documentDivergence('receita', leitura, documentSubtypeLabel).diverges).toBe(false)
  })
})

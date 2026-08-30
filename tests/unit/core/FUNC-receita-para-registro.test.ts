// CATRACA — a receita direciona para o que ela prescreve.
//
// "Se é uma receita de medicamento, que vá para medicamento; se é de suplemento, que vá para suplemento; se é
// de algum dispositivo, que seja salva também como dispositivo." (fundadora, 30/08)
//
// A fronteira que estes testes protegem: a plataforma PROPÕE e a pessoa confirma. Classificar por categoria de
// produto é do mesmo tipo do fato "este documento é uma receita" — não é dizer para que serve, nem avaliar a
// dose. E o palpite se anuncia: um destino não reconhecido chega marcado para conferência.
import { describe, it, expect } from 'vitest'
import {
  itensParaRegistrar, destinoIndicado, convitePrescricao, AVISO_PRESCRICAO,
} from '@sintera/core'

describe('para onde cada item prescrito vai', () => {
  it('medicamento é o destino padrão — o caso majoritário de uma receita', () => {
    const [i] = itensParaRegistrar(['Losartana 50mg'])
    expect(i.destino).toBe('medicamento')
  })

  it('vitamina e mineral vão para SUPLEMENTO', () => {
    expect(destinoIndicado('Vitamina D 2000UI')).toBe('suplemento')
    expect(destinoIndicado('Magnésio quelato')).toBe('suplemento')
    expect(destinoIndicado('Ômega 3 1000mg')).toBe('suplemento')
  })

  it('aparelho e órtese vão para DISPOSITIVO', () => {
    expect(destinoIndicado('Palmilha ortopédica')).toBe('dispositivo')
    expect(destinoIndicado('Meia de compressão 20-30mmHg')).toBe('dispositivo')
    expect(destinoIndicado('Glicosímetro')).toBe('dispositivo')
  })

  it('acento e caixa não atrapalham — o texto vem de leitura óptica', () => {
    expect(destinoIndicado('MAGNESIO')).toBe('suplemento')
    expect(destinoIndicado('Magnésio')).toBe('suplemento')
  })

  it('casa por PALAVRA INTEIRA, nunca por pedaço', () => {
    // "ferro" é sinal de suplemento; "Ferrograd" não é a palavra "ferro" — classificar por pedaço de palavra
    // erraria com confiança, que é a pior combinação possível.
    expect(destinoIndicado('Ferro quelato 30mg')).toBe('suplemento')
    expect(destinoIndicado('Ferrograd 325mg')).toBeNull()
  })

  it('O PALPITE SE ANUNCIA: o que não foi reconhecido chega marcado', () => {
    const [reconhecido] = itensParaRegistrar(['Vitamina D 2000UI'])
    const [palpite] = itensParaRegistrar(['Losartana 50mg'])
    expect(reconhecido.reconhecido).toBe(true)
    expect(palpite.reconhecido).toBe(false)
    // Mas o palpite ainda propõe um destino — a pessoa confirma com um toque, não escolhe do zero.
    expect(palpite.destino).toBe('medicamento')
  })
})

describe('a lista que a pessoa confirma', () => {
  it('o texto vai INTEIRO e sem alteração — é transcrição', () => {
    const [i] = itensParaRegistrar(['  Losartana 50mg  '])
    expect(i.texto).toBe('Losartana 50mg')
  })

  it('preserva a ordem do papel: é assim que ela confere, de cima para baixo', () => {
    const itens = itensParaRegistrar(['Losartana 50mg', 'Vitamina D 2000UI', 'Palmilha'])
    expect(itens.map(i => i.destino)).toEqual(['medicamento', 'suplemento', 'dispositivo'])
  })

  it('mantém repetidos — a receita pode repetir um nome com posologias diferentes', () => {
    expect(itensParaRegistrar(['Dipirona 500mg', 'Dipirona 500mg'])).toHaveLength(2)
  })

  it('linha vazia não vira item', () => {
    expect(itensParaRegistrar(['Losartana 50mg', '  ', ''])).toHaveLength(1)
    expect(itensParaRegistrar(null)).toEqual([])
  })
})

describe('o que a pessoa lê antes de confirmar', () => {
  it('o convite conta os itens, no singular e no plural', () => {
    expect(convitePrescricao(1)).toContain('1 item')
    expect(convitePrescricao(3)).toContain('3 itens')
    expect(convitePrescricao(0)).toBe('')
  })

  it('a ressalva diz DE ONDE VEIO e a quem cabe conferir', () => {
    expect(AVISO_PRESCRICAO).toContain('Transcrito')
    expect(AVISO_PRESCRICAO).toContain('Confira')
    expect(AVISO_PRESCRICAO).toContain('não interpreta')
  })
})

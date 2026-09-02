// CATRACA — "COMO VOCÊ ESTÁ HOJE?" SOBRE UM DADO DE 2023.
//
// A OBSERVAÇÃO DA FUNDADORA (homologação de 31/08/2026): "está escrito estado atual. Na verdade, não é a
// melhor expressão aqui, porque os dados são dados de uma bioimpedância de dois mil e vinte e três."
//
// Ela apontou o aplicativo. A Web era pior: dizia "Como você está hoje?" — afirmando HOJE sobre um número de
// três anos atrás, num painel que vai ao médico.
//
// A correção NÃO é esconder o dado antigo. A plataforma organiza e preserva; não decide que um exame de 2023
// deixou de valer (ADR-000 / RDC 657). A correção é parar de chamá-lo de atual e dizer de quando ele é.
import { describe, it, expect } from 'vitest'
import { atualidadeDoResumo, DIAS_PARA_NOMEAR_INTERVALO } from '@sintera/core'

const HOJE = new Date('2026-09-01T12:00:00Z')

// O caso dela: peso recente, gordura corporal de uma bioimpedância de 2023.
const oCasoDela = [
  { metric: 'peso', date: '2026-08-23' },
  { metric: 'gordura_corporal', date: '2023-07-12' },
  { metric: 'massa_muscular', date: '2023-07-12' },
]

describe('o cabeçalho não pode afirmar o que a lista não entrega', () => {
  it('NUNCA diz "hoje" nem "atual"', () => {
    const r = atualidadeDoResumo(oCasoDela, HOJE)
    const tudo = `${r.titulo} ${r.explicacao} ${r.intervalo ?? ''}`
    expect(tudo.toLowerCase()).not.toContain('hoje')
    expect(tudo.toLowerCase()).not.toContain('estado atual')
  })

  it('diz o que a lista É: a última medição de CADA indicador', () => {
    const r = atualidadeDoResumo(oCasoDela, HOJE)
    expect(r.titulo).toBe('Última medição de cada indicador')
    expect(r.explicacao).toContain('datas podem ser diferentes')
  })

  it('O CASO DELA: o intervalo é NOMEADO, com indicador e data nas duas pontas', () => {
    const r = atualidadeDoResumo(oCasoDela, HOJE)
    expect(r.intervalo).toContain('23/08/2026')
    expect(r.intervalo).toContain('12/07/2023')
    expect(r.temDadoAntigo).toBe(true)
  })

  it('tudo do mesmo período: NÃO inventa um intervalo — a frase seria ruído', () => {
    const r = atualidadeDoResumo([
      { metric: 'peso', date: '2026-08-23' },
      { metric: 'gordura_corporal', date: '2026-08-20' },
    ], HOJE)
    expect(r.intervalo).toBeNull()
    expect(r.temDadoAntigo).toBe(false)
  })

  it('um indicador só não tem intervalo', () => {
    expect(atualidadeDoResumo([{ metric: 'peso', date: '2026-08-23' }], HOJE).intervalo).toBeNull()
  })

  it('o limiar do intervalo vem daqui — as duas pontas decidem igual', () => {
    expect(DIAS_PARA_NOMEAR_INTERVALO).toBe(180)
    const dentro = atualidadeDoResumo([
      { metric: 'peso', date: '2026-08-23' },
      { metric: 'gordura_corporal', date: '2026-05-01' }, // ~114 dias
    ], HOJE)
    expect(dentro.intervalo).toBeNull()
  })

  it('sem data, e sem indicador nenhum, a frase ainda é honesta', () => {
    for (const lista of [[], [{ metric: 'peso' }], [{ metric: 'peso', date: null }]]) {
      const r = atualidadeDoResumo(lista, HOJE)
      expect(r.titulo).toBe('Última medição de cada indicador')
      expect(r.intervalo).toBeNull()
    }
  })

  it('NÃO ESCONDE O DADO ANTIGO — apenas o sinaliza', () => {
    // Sinalizar é da plataforma; decidir que um exame perdeu validade seria interpretação clínica.
    const r = atualidadeDoResumo(oCasoDela, HOJE)
    expect(r.temDadoAntigo).toBe(true)
    expect(`${r.titulo} ${r.explicacao}`).not.toMatch(/desatualizado|inválido|não vale|refaça|vencido/i)
  })

  it('a ordem de entrada não muda o resultado', () => {
    const a = atualidadeDoResumo(oCasoDela, HOJE)
    const b = atualidadeDoResumo([...oCasoDela].reverse(), HOJE)
    expect(a.intervalo).toBe(b.intervalo)
  })
})

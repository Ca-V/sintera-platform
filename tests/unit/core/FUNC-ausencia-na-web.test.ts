// CATRACA — SEÇÃO VAZIA TEM DE DIZER POR QUE ESTÁ VAZIA.
//
// PEDIDO DA FUNDADORA (01/09/2026): "caso algum dado não apareça na web que na página respectiva apareça uma
// mensagem informando, informando também o porque."
//
// É o mesmo princípio que já custou caro três vezes nesta plataforma: Conexões em branco no navegador (ela
// concluiu que não havia integração), "nada novo desde a última vez" respondendo por cinco situações, e dez
// exames "processados" sem uma palavra pesquisável dentro. Ausência sem explicação faz a pessoa preencher a
// lacuna com a pior hipótese: "perdi meu dado".
import { describe, it, expect } from 'vitest'
import { ausenciaExplicada, type SecaoDeDados } from '@sintera/core'

const SECOES: SecaoDeDados[] = ['sinais', 'passos', 'atividade', 'composicao']

describe('a seção vazia se explica', () => {
  it('NUNCA SINCRONIZOU: diz que a autorização é no celular, e por quê', () => {
    const a = ausenciaExplicada('passos', { houveSincronizacao: false })
    expect(a.motivos.join(' ')).toContain('celular')
    // A limitação é do Google e da Apple, não nossa — e dizer isso evita que ela procure um botão que não existe.
    expect(a.motivos.join(' ')).toMatch(/Google e Apple/)
    expect(a.oQueFazer).toContain('manualmente')
  })

  it('JÁ SINCRONIZOU e a seção segue vazia: NÃO manda conectar de novo', () => {
    // Quem já sincronizou e lesse "conecte um aparelho" concluiria, errado, que perdeu o que tinha.
    const a = ausenciaExplicada('passos', { houveSincronizacao: true })
    expect(a.titulo).toContain('já recebe dados')
    expect(a.motivos.join(' ')).not.toMatch(/conecte|autorização é feita no aplicativo/i)
    expect(a.motivos.join(' ')).toContain('por tipo de dado')
  })

  it('os dois estados produzem textos DIFERENTES — é essa distinção que a tela precisa carregar', () => {
    for (const s of SECOES) {
      const nunca = ausenciaExplicada(s, { houveSincronizacao: false })
      const depois = ausenciaExplicada(s, { houveSincronizacao: true })
      expect(nunca.titulo, s).not.toBe(depois.titulo)
    }
  })

  it('cada seção diz O QUE chega nela — genérico não ajuda ninguém a conferir', () => {
    expect(ausenciaExplicada('sinais', { houveSincronizacao: false }).motivos.join(' ')).toContain('glicemia')
    expect(ausenciaExplicada('passos', { houveSincronizacao: false }).motivos.join(' ')).toContain('passos')
    expect(ausenciaExplicada('atividade', { houveSincronizacao: false }).motivos.join(' ')).toContain('Strava')
    expect(ausenciaExplicada('composicao', { houveSincronizacao: false }).motivos.join(' ')).toContain('balanças')
  })

  it('toda seção, nos dois estados, entrega título, motivos e o que fazer — nada fica pela metade', () => {
    for (const s of SECOES) {
      for (const houveSincronizacao of [true, false]) {
        const a = ausenciaExplicada(s, { houveSincronizacao })
        expect(a.titulo.length, s).toBeGreaterThan(10)
        expect(a.motivos.length, s).toBeGreaterThanOrEqual(3)
        expect(a.oQueFazer.length, s).toBeGreaterThan(10)
      }
    }
  })

  it('NÃO PROMETE BOTÃO QUE NÃO EXISTE no navegador', () => {
    // Conectar Health Connect/Apple Saúde pelo navegador não é possível. Sugerir isso aqui manda a pessoa
    // procurar por semanas um controle que nenhuma tela tem.
    for (const s of SECOES) {
      const a = ausenciaExplicada(s, { houveSincronizacao: false })
      const tudo = `${a.titulo} ${a.motivos.join(' ')} ${a.oQueFazer}`
      expect(tudo, s).not.toMatch(/clique em conectar|conecte aqui|botão conectar/i)
    }
  })
})

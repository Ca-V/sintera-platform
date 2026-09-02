// CATRACA — quanto para trás a plataforma busca, e por quê.
//
// A PERGUNTA DA FUNDADORA (30/08), ao ver a primeira importação real: "por que foram carregadas doze
// atividades? Seria carregar só o que veio depois de habilitar, ou todas as atividades feitas até hoje?"
//
// A resposta virou regra, e a regra vale para TODA fonte — Health Connect, Apple Saúde e o que vier:
// NA PRIMEIRA VEZ, TUDO QUE A FONTE PERMITIR; depois, só o que é novo.
//
// Sem estes testes, a decisão viveria só num comentário — e a próxima pessoa a mexer na janela mudaria o
// alcance da plataforma sem saber que estava mudando.
import { describe, it, expect } from 'vitest'
import {
  janelaImportacao, janelaImportacaoSegundoPlano, alcanceLabel,
  DIAS_PRIMEIRA_SINCRONIZACAO, DIAS_SEM_HISTORICO, HORAS_SOBREPOSICAO,
} from '@sintera/core'

const AGORA = new Date('2026-08-30T12:00:00.000Z')
const dias = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / 86_400_000)

describe('a primeira sincronização', () => {
  it('VARRE O HISTÓRICO — não começa do zero no dia da instalação', () => {
    const j = janelaImportacao(AGORA)
    expect(j.primeira).toBe(true)
    expect(dias(j.desde, j.ate)).toBe(DIAS_PRIMEIRA_SINCRONIZACAO)
  })

  it('busca anos, não semanas: continuidade é o motivo da plataforma existir', () => {
    expect(DIAS_PRIMEIRA_SINCRONIZACAO).toBeGreaterThan(365)
  })

  it('marca d\'água ilegível conta como primeira vez, e não como "nada a buscar"', () => {
    expect(janelaImportacao(AGORA, new Date('data-torta')).primeira).toBe(true)
  })
})

describe('as seguintes', () => {
  it('retomam da última vez, com sobreposição', () => {
    const ultima = new Date('2026-08-30T10:00:00.000Z')
    const j = janelaImportacao(AGORA, ultima)
    expect(j.primeira).toBe(false)
    expect(j.desde.getTime()).toBe(ultima.getTime() - HORAS_SOBREPOSICAO * 3_600_000)
  })

  it('A SOBREPOSIÇÃO NÃO É DESPERDÍCIO: sem ela, o dado que chega atrasado some para sempre', () => {
    // A atividade termina às 9h e a fonte só a grava às 9h20. Retomar exatamente das 9h a perderia.
    expect(HORAS_SOBREPOSICAO).toBeGreaterThan(0)
  })

  it('relógio para trás não gera intervalo invertido — a fonte recusaria a leitura inteira', () => {
    const futuro = new Date('2026-09-30T12:00:00.000Z')
    const j = janelaImportacao(AGORA, futuro)
    expect(j.desde.getTime()).toBeLessThan(j.ate.getTime())
    expect(dias(j.desde, j.ate)).toBe(DIAS_SEM_HISTORICO)
  })
})

describe('o segundo plano é a exceção, e é declarada', () => {
  it('na primeira vez busca uma janela CURTA — varrer anos numa tarefa de fundo seria morta no meio', () => {
    const j = janelaImportacaoSegundoPlano(AGORA)
    expect(j.primeira).toBe(true)
    expect(dias(j.desde, j.ate)).toBe(DIAS_SEM_HISTORICO)
    expect(dias(j.desde, j.ate)).toBeLessThan(DIAS_PRIMEIRA_SINCRONIZACAO)
  })

  it('nas seguintes é IDÊNTICO à regra geral — a exceção vale só para a varredura inicial', () => {
    const ultima = new Date('2026-08-30T10:00:00.000Z')
    expect(janelaImportacaoSegundoPlano(AGORA, ultima)).toEqual(janelaImportacao(AGORA, ultima))
  })
})

describe('o que a pessoa lê sobre o alcance', () => {
  it('com histórico liberado, diz que buscou tudo e por que algo pode faltar', () => {
    const t = alcanceLabel(DIAS_PRIMEIRA_SINCRONIZACAO, true, true)
    expect(t).toContain('todo o histórico')
    expect(t).toContain('a fonte não guardava')
  })

  it('SEM histórico, diz o limite E o que fazer — limite sem saída é frase inútil', () => {
    const t = alcanceLabel(28, false, true)
    expect(t).toContain('28 dias')
    expect(t).toContain('Autorizando o histórico')
  })

  it('nas seguintes, diz que buscou só o novo', () => {
    expect(alcanceLabel(1, true, false)).toContain('desde a última vez')
  })
})

// FUNC · CARE-003 §2.2 e §4 — o vínculo e quem manda nele.
//
// A CATRACA DESTE ARQUIVO é uma frase só: nenhum vínculo vira ATIVO por ação do profissional. Aceitar é criar
// o acesso, e criar o acesso é privativo de quem é dono dele. Tudo o mais aqui é consequência disso.
//
// A segunda catraca: `convidado` não concede NADA. Antes do aceite o profissional não vê o nome da pessoa,
// não sabe se ela tem conta e não sabe se o convite foi aberto — saber transformaria a recusa em
// constrangimento e o silêncio em cobrança.

import { describe, it, expect } from 'vitest'
import {
  transicaoPermitida, motivoTransicaoInvalida, podeIniciarConvite, conviteExigeDeclaracao,
  profissionalEnxerga, concedeAcesso, normalizarEscopo, ESCOPO_PADRAO, ESCOPO_SENSIVEL,
  type StatusVinculo, type Vinculo,
} from '@sintera/core'

const TODOS: StatusVinculo[] = ['convidado', 'ativo', 'recusado', 'revogado', 'encerrado']
const vinculo = (p: Partial<Vinculo> = {}): Vinculo =>
  ({ status: 'ativo', iniciadoPor: 'paciente', escopo: ESCOPO_PADRAO, ...p })

describe('CARE-003 · CATRACA — só o paciente ativa', () => {
  it('o paciente aceita um convite', () => {
    expect(transicaoPermitida('convidado', 'ativo', 'paciente')).toBe(true)
  })

  it('o profissional NUNCA ativa, venha de onde vier', () => {
    for (const de of TODOS) {
      expect(transicaoPermitida(de, 'ativo', 'profissional'), `${de} -> ativo pelo profissional`).toBe(false)
    }
  })

  it('e a recusa explica a regra, não só nega', () => {
    expect(motivoTransicaoInvalida('convidado', 'ativo', 'profissional'))
      .toMatch(/só a pessoa dona dos dados pode aceitar/i)
  })

  it('revogar é do paciente; o profissional encerra, que é outra coisa', () => {
    expect(transicaoPermitida('ativo', 'revogado', 'paciente')).toBe(true)
    expect(transicaoPermitida('ativo', 'revogado', 'profissional')).toBe(false)
    expect(transicaoPermitida('ativo', 'encerrado', 'profissional')).toBe(true)
  })
})

describe('CARE-003 · estados finais', () => {
  it.each(['recusado', 'revogado', 'encerrado'] as const)('%s é definitivo para os dois lados', (de) => {
    for (const para of TODOS) {
      for (const por of ['paciente', 'profissional'] as const) {
        expect(transicaoPermitida(de, para, por), `${de} -> ${para} por ${por}`).toBe(false)
      }
    }
    expect(motivoTransicaoInvalida(de, 'ativo', 'paciente')).toMatch(/definitivo/i)
  })

  it('um vínculo revogado não volta — reconectar é um vínculo novo', () => {
    expect(transicaoPermitida('revogado', 'ativo', 'paciente')).toBe(false)
  })
})

describe('CARE-003 §4.1 · quem pode iniciar o convite', () => {
  it('o paciente sempre pode, sem depender de plano nem de nada', () => {
    expect(podeIniciarConvite('paciente')).toBe(true)
    expect(podeIniciarConvite('paciente', { planoPermite: false, verificado: false })).toBe(true)
  })

  it('o profissional precisa das DUAS: plano que concede e registro verificado', () => {
    expect(podeIniciarConvite('profissional', { planoPermite: true, verificado: true })).toBe(true)
    expect(podeIniciarConvite('profissional', { planoPermite: true, verificado: false })).toBe(false)
    expect(podeIniciarConvite('profissional', { planoPermite: false, verificado: true })).toBe(false)
  })

  it('na fase de lançamento nenhum plano concede — logo só o paciente convida, sem código próprio', () => {
    expect(podeIniciarConvite('profissional', { planoPermite: false, verificado: true })).toBe(false)
    expect(podeIniciarConvite('profissional')).toBe(false)
  })

  it('convite do profissional exige declaração de relação assistencial; o do paciente não', () => {
    expect(conviteExigeDeclaracao('profissional')).toBe(true)
    expect(conviteExigeDeclaracao('paciente')).toBe(false)
  })
})

describe('CARE-003 · CATRACA — vínculo não-ativo lê ZERO', () => {
  it.each(['convidado', 'recusado', 'revogado', 'encerrado'] as const)('%s não concede acesso nenhum', (status) => {
    const v = vinculo({ status })
    expect(concedeAcesso(v)).toBe(false)
    for (const modulo of ESCOPO_PADRAO) {
      expect(profissionalEnxerga(v, modulo), `${status} enxergando ${modulo}`).toBe(false)
    }
  })

  it('só ativo concede', () => {
    expect(concedeAcesso(vinculo({ status: 'ativo' }))).toBe(true)
  })

  it('ativo não basta: o módulo precisa estar no escopo', () => {
    const v = vinculo({ escopo: ['exames'] })
    expect(profissionalEnxerga(v, 'exames')).toBe(true)
    expect(profissionalEnxerga(v, 'medidas'), 'fora do escopo não é visível nem com vínculo ativo').toBe(false)
  })
})

describe('CARE-003 §3.2 · escopo padrão', () => {
  it('o padrão é o mínimo que torna o vínculo útil', () => {
    expect([...ESCOPO_PADRAO].sort()).toEqual(['documentos', 'exames', 'historico-saude', 'medidas'])
  })

  it('nenhum dado sensível entra por padrão — tem de ser gesto deliberado da pessoa', () => {
    for (const sensivel of ESCOPO_SENSIVEL) {
      expect(ESCOPO_PADRAO, `${sensivel} não pode nascer no escopo`).not.toContain(sensivel)
    }
  })

  it('escopo se normaliza sem duplicata e sem vazio, e não restringe quais módulos (lista aberta)', () => {
    expect(normalizarEscopo(['exames', 'exames', ' medidas ', '', '  '])).toEqual(['exames', 'medidas'])
    expect(normalizarEscopo(['modulo-que-ainda-nao-existe'])).toEqual(['modulo-que-ainda-nao-existe'])
  })
})

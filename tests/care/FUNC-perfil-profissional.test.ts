// FUNC · CARE-003 §2.1 e §5 — a conta profissional e o que ela pode fazer.
//
// A CATRACA DESTE ARQUIVO: nenhum perfil age antes de o registro no conselho estar verificado. É o que impede
// que alguém não habilitado envie a um usuário um documento que ele vai ler como clínico — risco que não
// depende de má-fé, basta um cadastro na categoria errada.
//
// E a segunda regra, tão importante quanto: um perfil que não pode agir SEMPRE diz por quê. Perfil que não
// funciona e não explica é a armadilha da configuração ausente de novo — nada acontece, e nada explica.

import { describe, it, expect } from 'vitest'
import {
  conselhoDe, exigeConselho, nomeDaProfissao, normalizarRegistro, normalizarUf,
  pendenciasDoCadastro, estaVerificado, podeEnviarDocumento, podeConvidarPacientes, motivoDeNaoAgir,
  type PerfilProfissional, type Profissao,
} from '@sintera/core'

const base: PerfilProfissional = {
  nomeProfissional: 'Ana Souza',
  profissao: 'nutricionista',
  conselho: 'CRN',
  registroNumero: '3-12345',
  registroUf: 'SP',
  statusVerificacao: 'verificado',
}
const com = (p: Partial<PerfilProfissional>): PerfilProfissional => ({ ...base, ...p })

describe('CARE-003 · conselho por profissão', () => {
  it('cada profissão regulamentada aponta para o seu conselho', () => {
    expect(conselhoDe('medico')).toBe('CRM')
    expect(conselhoDe('nutricionista')).toBe('CRN')
    expect(conselhoDe('fisioterapeuta')).toBe('CREFITO')
    expect(conselhoDe('educador_fisico')).toBe('CREF')
  })

  it('`outro` não tem conselho obrigatório — a lista real é maior que a nossa', () => {
    expect(conselhoDe('outro')).toBeNull()
    expect(exigeConselho('outro')).toBe(false)
  })

  it('toda profissão tem nome legível — nenhuma aparece como identificador cru', () => {
    const todas: Profissao[] = ['medico', 'nutricionista', 'educador_fisico', 'fisioterapeuta', 'outro']
    for (const p of todas) {
      expect(nomeDaProfissao(p).length, `${p} sem nome`).toBeGreaterThan(3)
      expect(nomeDaProfissao(p)).not.toMatch(/_/)
    }
  })
})

describe('CARE-003 · normalização do registro (compara, NUNCA valida formato)', () => {
  it('tira separadores e sobe para maiúsculas', () => {
    expect(normalizarRegistro('3-12.345')).toBe('312345')
    expect(normalizarRegistro(' crm 45678 ')).toBe('CRM45678')
  })

  it('aceita letra no registro — o CREF distingue graduado de provisionado', () => {
    expect(normalizarRegistro('012345-G/SP')).toBe('012345GSP')
  })

  it('aceita formato que não reconhecemos — recusar profissional legítimo é o pior resultado', () => {
    expect(normalizarRegistro('XY-99/ZZ-00')).toBe('XY99ZZ00')
  })

  it('vazio e só-separadores viram null', () => {
    expect(normalizarRegistro('')).toBeNull()
    expect(normalizarRegistro('---')).toBeNull()
    expect(normalizarRegistro(null)).toBeNull()
  })

  it('UF só pela forma: duas letras', () => {
    expect(normalizarUf('sp')).toBe('SP')
    expect(normalizarUf('S.P.')).toBe('SP')
    expect(normalizarUf('SPX')).toBeNull()
    expect(normalizarUf(undefined)).toBeNull()
  })
})

describe('CARE-003 · pendências do cadastro', () => {
  it('cadastro completo de profissão regulamentada não tem pendência', () => {
    expect(pendenciasDoCadastro(base)).toEqual([])
  })

  it('profissão regulamentada sem registro acusa o que falta, item a item', () => {
    const p = com({ conselho: null, registroNumero: null, registroUf: null })
    expect(pendenciasDoCadastro(p)).toEqual(['conselho', 'número de registro', 'estado do registro'])
  })

  it('profissão sem conselho obrigatório não exige registro', () => {
    expect(pendenciasDoCadastro(com({ profissao: 'outro', conselho: null, registroNumero: null, registroUf: null })))
      .toEqual([])
  })

  it('nome em branco é pendência mesmo sem conselho', () => {
    expect(pendenciasDoCadastro(com({ profissao: 'outro', nomeProfissional: '   ' }))).toContain('nome profissional')
  })
})

describe('CARE-003 §5 · CATRACA — só perfil verificado age', () => {
  it('verificado envia documento', () => {
    expect(podeEnviarDocumento(base)).toBe(true)
  })

  it.each(['pendente', 'recusado', 'suspenso'] as const)('%s NÃO envia documento', (status) => {
    expect(podeEnviarDocumento(com({ statusVerificacao: status }))).toBe(false)
  })

  it('profissão sem conselho não envia documento, por mais completo que esteja o cadastro', () => {
    const semConselho = com({ profissao: 'outro', conselho: null, registroNumero: null, registroUf: null, statusVerificacao: 'pendente' })
    expect(pendenciasDoCadastro(semConselho), 'cadastro está completo').toEqual([])
    expect(podeEnviarDocumento(semConselho), 'completo não é verificado').toBe(false)
  })

  it('convidar paciente exige verificação E permissão do plano — as duas', () => {
    expect(podeConvidarPacientes(base, true)).toBe(true)
    expect(podeConvidarPacientes(base, false), 'verificado sem plano não convida').toBe(false)
    expect(podeConvidarPacientes(com({ statusVerificacao: 'pendente' }), true), 'plano não supre verificação').toBe(false)
  })

  it('na fase de lançamento nenhum plano concede o convite — ninguém convida', () => {
    // A regra "só o paciente convida" não depende de código novo: é o entitlement desligado.
    for (const status of ['pendente', 'verificado', 'recusado', 'suspenso'] as const) {
      expect(podeConvidarPacientes(com({ statusVerificacao: status }), false)).toBe(false)
    }
  })
})

describe('CARE-003 · quem não age sempre sabe por quê', () => {
  it('verificado não recebe motivo — não há o que explicar', () => {
    expect(motivoDeNaoAgir(base)).toBeNull()
    expect(estaVerificado(base)).toBe(true)
  })

  it.each(['pendente', 'recusado', 'suspenso'] as const)('%s recebe explicação, nunca silêncio', (status) => {
    const motivo = motivoDeNaoAgir(com({ statusVerificacao: status }))
    expect(motivo, `${status} sem motivo`).toBeTruthy()
    expect(motivo!.length).toBeGreaterThan(30)
  })

  it('cadastro incompleto explica O QUE falta, não só que falta algo', () => {
    const motivo = motivoDeNaoAgir(com({ statusVerificacao: 'pendente', registroNumero: null }))
    expect(motivo).toContain('número de registro')
  })

  it('pendente diz que já dá para RECEBER paciente — o gratuito nunca é bloqueado', () => {
    expect(motivoDeNaoAgir(com({ statusVerificacao: 'pendente' }))).toContain('receber pacientes')
  })

  it('a nota de quem conferiu manda sobre a frase genérica', () => {
    const motivo = motivoDeNaoAgir(com({ statusVerificacao: 'recusado', verificacaoNota: 'Registro consta em outro estado.' }))
    expect(motivo).toContain('Registro consta em outro estado.')
  })

  it('recusado sem nota ainda diz o que fazer', () => {
    expect(motivoDeNaoAgir(com({ statusVerificacao: 'recusado' }))).toMatch(/confira/i)
  })

  it('profissão sem conselho explica por que não há o que verificar', () => {
    const motivo = motivoDeNaoAgir(com({ profissao: 'outro', conselho: null, registroNumero: null, registroUf: null, statusVerificacao: 'pendente' }))
    expect(motivo).toMatch(/não tem conselho/i)
  })
})

// FUNC · CARE-003 §1.2 — o documento proposto pelo profissional.
//
// ESTE ARQUIVO GUARDA A RESOLUÇÃO DE UM CONFLITO. O CARE-001 §3.6 diz que o profissional NUNCA altera a base
// do paciente. O plano de negócios §21 diz que ele envia documentos que integram o histórico. Os dois
// sobrevivem porque ele PROPÕE e o aceite do paciente é o que ESCREVE — acrescentar não é editar, e quem
// acrescenta é sempre o titular.
//
// Se algum teste daqui cair, é essa resolução que está sendo desfeita.

import { describe, it, expect } from 'vitest'
import {
  respostaDaPropostaPermitida, motivoRespostaDaPropostaInvalida, podePropor, motivoNaoPodePropor, aguardaResposta,
  rotuloParaProfissional, rotuloParaPaciente, AVISO_ANTES_DE_ACEITAR,
  type EstadoProposta, type AutorDaResposta,
} from '@sintera/core'

const TODOS: EstadoProposta[] = ['proposto', 'aceito', 'recusado', 'cancelado']
const AUTORES: AutorDaResposta[] = ['paciente', 'profissional']

describe('CARE-003 §1.2 · CATRACA — só o paciente aceita', () => {
  it('o paciente aceita e recusa', () => {
    expect(respostaDaPropostaPermitida('proposto', 'aceito', 'paciente')).toBe(true)
    expect(respostaDaPropostaPermitida('proposto', 'recusado', 'paciente')).toBe(true)
  })

  it('o profissional NUNCA aceita nem recusa, de nenhum estado', () => {
    for (const de of TODOS) {
      expect(respostaDaPropostaPermitida(de, 'aceito', 'profissional'), `${de} -> aceito`).toBe(false)
      expect(respostaDaPropostaPermitida(de, 'recusado', 'profissional'), `${de} -> recusado`).toBe(false)
    }
  })

  it('e a recusa explica a regra, e oferece o que ele PODE fazer', () => {
    const m = motivoRespostaDaPropostaInvalida('proposto', 'aceito', 'profissional')
    expect(m).toMatch(/só a pessoa dona dos dados/i)
    expect(m, 'negar sem oferecer saída é beco sem saída').toMatch(/cancelar/i)
  })

  it('cancelar é de quem enviou; o paciente recusa, não cancela', () => {
    expect(respostaDaPropostaPermitida('proposto', 'cancelado', 'profissional')).toBe(true)
    expect(respostaDaPropostaPermitida('proposto', 'cancelado', 'paciente')).toBe(false)
    expect(motivoRespostaDaPropostaInvalida('proposto', 'cancelado', 'paciente')).toMatch(/recusar/i)
  })
})

describe('CARE-003 · estados finais', () => {
  it.each(['aceito', 'recusado', 'cancelado'] as const)('%s é definitivo para os dois lados', (de) => {
    for (const para of TODOS) {
      for (const por of AUTORES) {
        expect(respostaDaPropostaPermitida(de, para, por), `${de} -> ${para} por ${por}`).toBe(false)
      }
    }
    expect(motivoRespostaDaPropostaInvalida(de, 'aceito', 'paciente')).toMatch(/já foi/i)
  })

  it('só `proposto` aguarda resposta', () => {
    expect(aguardaResposta({ estado: 'proposto' })).toBe(true)
    for (const e of ['aceito', 'recusado', 'cancelado'] as const) {
      expect(aguardaResposta({ estado: e })).toBe(false)
    }
  })
})

describe('CARE-003 §5 · CATRACA — não habilitado não envia', () => {
  it('precisa de vínculo ativo E registro verificado — as duas', () => {
    expect(podePropor({ vinculoAtivo: true, profissionalVerificado: true })).toBe(true)
    expect(podePropor({ vinculoAtivo: true, profissionalVerificado: false }),
      'verificação não é opcional: é o que impede não habilitado de mandar documento clínico').toBe(false)
    expect(podePropor({ vinculoAtivo: false, profissionalVerificado: true })).toBe(false)
    expect(podePropor({ vinculoAtivo: false, profissionalVerificado: false })).toBe(false)
  })

  it('a falta de verificação é o motivo apresentado primeiro — é a que o profissional resolve', () => {
    const m = motivoNaoPodePropor({ vinculoAtivo: false, profissionalVerificado: false })
    expect(m).toMatch(/registro no conselho/i)
  })

  it('vínculo inativo explica que depende de autorização da pessoa', () => {
    expect(motivoNaoPodePropor({ vinculoAtivo: false, profissionalVerificado: true })).toMatch(/autorizou/i)
  })

  it('quem pode propor não recebe motivo nenhum', () => {
    expect(motivoNaoPodePropor({ vinculoAtivo: true, profissionalVerificado: true })).toBeNull()
  })
})

describe('CARE-003 §3.1 · a recusa não volta como pendência', () => {
  it('para o profissional, recusado é "encerrado" — nunca negativa', () => {
    const r = rotuloParaProfissional('recusado')
    expect(r).toMatch(/encerrado/i)
    expect(r, 'ele não precisa saber que foi negativa').not.toMatch(/recus|negad|rejeit/i)
  })

  it('para a pessoa, o próprio ato dela aparece com clareza', () => {
    expect(rotuloParaPaciente('recusado')).toMatch(/você recusou/i)
  })

  it('nenhum rótulo sugere insistir', () => {
    for (const e of TODOS) {
      for (const r of [rotuloParaProfissional(e), rotuloParaPaciente(e)]) {
        expect(r.length).toBeGreaterThan(3)
        expect(r, `${e} sugere insistência`).not.toMatch(/reenvi|tente|lembr|cobr/i)
      }
    }
  })
})

describe('CARE-003 · aceitar é decisão, não clique', () => {
  it('o aviso diz o que acontece, quem aparece junto, e que dá para desfazer', () => {
    expect(AVISO_ANTES_DE_ACEITAR).toMatch(/entra nos seus documentos/i)
    expect(AVISO_ANTES_DE_ACEITAR, 'sem a autoria, o histórico perderia a origem').toMatch(/quem enviou/i)
    expect(AVISO_ANTES_DE_ACEITAR, 'saber que dá para remover é o que torna o aceite reversível').toMatch(/remov/i)
  })

  it('o aviso não promete leitura nem interpretação do conteúdo (RDC 657)', () => {
    expect(AVISO_ANTES_DE_ACEITAR).not.toMatch(/diagn[óo]stic|interpret|analis|avalia/i)
  })
})

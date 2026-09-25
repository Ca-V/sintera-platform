// FUNC · CARE-003 §2.3 e §4.2 — o convite.
//
// DUAS CATRACAS, e as duas protegem quem RECEBE o convite, não quem envia:
//
// 1. Quem convida não responde pelo convidado. Aceitar e recusar são do destinatário — a mesma regra do
//    vínculo, de que ninguém concede acesso aos dados de outra pessoa em nome dela.
// 2. O convite não carrega dado de saúde, e a recusa não volta ao remetente como pendência. A ausência de
//    resposta tem de continuar ambígua: é isso que impede o convite de virar instrumento de pressão.

import { describe, it, expect } from 'vitest'
import {
  direcaoDe, quemIniciou, respostaPermitida, motivoRespostaInvalida, pendenciasDoConvite,
  estaVencido, podeResponder, rotuloParaRemetente, DIAS_ATE_EXPIRAR, PROIBIDO_NO_CONVITE,
  type StatusConvite, type Autor,
} from '@sintera/core'

const TODOS: StatusConvite[] = ['enviado', 'aceito', 'recusado', 'expirado', 'cancelado']
const AUTORES: Autor[] = ['remetente', 'destinatario', 'sistema']

const AGORA = new Date('2026-09-25T12:00:00Z')
const emDias = (d: number) => new Date(AGORA.getTime() + d * 86400000)

describe('CARE-003 · direção do convite', () => {
  it('a direção deriva de quem iniciou, e volta', () => {
    expect(direcaoDe('paciente')).toBe('paciente_convida_profissional')
    expect(direcaoDe('profissional')).toBe('profissional_convida_paciente')
    expect(quemIniciou(direcaoDe('paciente'))).toBe('paciente')
    expect(quemIniciou(direcaoDe('profissional'))).toBe('profissional')
  })

  it('só o convite do profissional exige declaração de relação assistencial', () => {
    expect(pendenciasDoConvite({ direcao: 'profissional_convida_paciente', declaracaoRelacao: null }))
      .toEqual(['declaração de relação assistencial'])
    expect(pendenciasDoConvite({ direcao: 'profissional_convida_paciente', declaracaoRelacao: '   ' }))
      .toHaveLength(1)
    expect(pendenciasDoConvite({ direcao: 'profissional_convida_paciente', declaracaoRelacao: 'Paciente desde 2024.' }))
      .toEqual([])
    expect(pendenciasDoConvite({ direcao: 'paciente_convida_profissional', declaracaoRelacao: null }))
      .toEqual([])
  })
})

describe('CARE-003 · CATRACA — quem convida não responde pelo convidado', () => {
  it('o destinatário aceita e recusa', () => {
    expect(respostaPermitida('enviado', 'aceito', 'destinatario')).toBe(true)
    expect(respostaPermitida('enviado', 'recusado', 'destinatario')).toBe(true)
  })

  it('o remetente NUNCA aceita nem recusa, de nenhum estado', () => {
    for (const de of TODOS) {
      expect(respostaPermitida(de, 'aceito', 'remetente'), `${de} -> aceito pelo remetente`).toBe(false)
      expect(respostaPermitida(de, 'recusado', 'remetente'), `${de} -> recusado pelo remetente`).toBe(false)
    }
  })

  it('e a recusa explica a regra', () => {
    expect(motivoRespostaInvalida('enviado', 'aceito', 'remetente'))
      .toMatch(/quem convida não responde pelo convidado/i)
  })

  it('cancelar é do remetente; ninguém mais', () => {
    expect(respostaPermitida('enviado', 'cancelado', 'remetente')).toBe(true)
    for (const por of ['destinatario', 'sistema'] as const) {
      expect(respostaPermitida('enviado', 'cancelado', por)).toBe(false)
    }
  })

  it('expirar é do relógio, não de gente', () => {
    expect(respostaPermitida('enviado', 'expirado', 'sistema')).toBe(true)
    expect(respostaPermitida('enviado', 'expirado', 'remetente')).toBe(false)
    expect(respostaPermitida('enviado', 'expirado', 'destinatario')).toBe(false)
  })
})

describe('CARE-003 · estados finais do convite', () => {
  it.each(['aceito', 'recusado', 'expirado', 'cancelado'] as const)('%s é definitivo', (de) => {
    for (const para of TODOS) {
      for (const por of AUTORES) {
        expect(respostaPermitida(de, para, por), `${de} -> ${para} por ${por}`).toBe(false)
      }
    }
    expect(motivoRespostaInvalida(de, 'aceito', 'destinatario')).toMatch(/já foi/i)
  })
})

describe('CARE-003 · vencimento', () => {
  it('convite vence em 30 dias', () => {
    expect(DIAS_ATE_EXPIRAR).toBe(30)
  })

  it('convite vencido não aceita resposta, mesmo marcado como enviado', () => {
    const vencido = { status: 'enviado' as const, expiraEm: emDias(-1) }
    expect(estaVencido(vencido, AGORA)).toBe(true)
    expect(podeResponder(vencido, AGORA)).toBe(false)
  })

  it('convite dentro do prazo aceita resposta', () => {
    const vivo = { status: 'enviado' as const, expiraEm: emDias(10) }
    expect(estaVencido(vivo, AGORA)).toBe(false)
    expect(podeResponder(vivo, AGORA)).toBe(true)
  })

  it('só `enviado` vence — respondido não "expira" depois', () => {
    expect(estaVencido({ status: 'aceito', expiraEm: emDias(-5) }, AGORA)).toBe(false)
    expect(estaVencido({ status: 'recusado', expiraEm: emDias(-5) }, AGORA)).toBe(false)
  })
})

describe('CARE-003 §3.1 · CATRACA — a recusa não volta como pendência', () => {
  it('recusado aparece ao remetente como ENCERRADO, nunca como recusa', () => {
    const rotulo = rotuloParaRemetente('recusado')
    expect(rotulo).toMatch(/encerrado/i)
    expect(rotulo, 'o remetente não precisa saber que foi negativa').not.toMatch(/recus|negad|rejeit/i)
  })

  it('nenhum rótulo sugere insistir', () => {
    for (const s of TODOS) {
      const r = rotuloParaRemetente(s)
      expect(r.length).toBeGreaterThan(3)
      expect(r, `${s} sugere insistência`).not.toMatch(/reenvi|tente|lembr|pendente|aguardando/i)
    }
  })
})

describe('CARE-003 · CATRACA — o convite não carrega dado de saúde', () => {
  it('a lista de proibidos cobre as classes que importam', () => {
    for (const termo of ['exame', 'diagnostico', 'medicamento', 'laudo', 'resultado']) {
      expect(PROIBIDO_NO_CONVITE, `${termo} precisa estar na lista`).toContain(termo)
    }
  })

  it('os campos públicos do convite não incluem nada clínico', () => {
    // Contrato da visão do remetente: se alguém acrescentar um campo clínico, este teste cai.
    const campos = ['paraContato', 'status', 'criadoEm', 'expiraEm']
    for (const campo of campos) {
      for (const proibido of PROIBIDO_NO_CONVITE) {
        expect(campo.toLowerCase(), `${campo} parece clínico`).not.toContain(proibido)
      }
    }
  })
})

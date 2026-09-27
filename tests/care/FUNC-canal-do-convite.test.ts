// FUNC · CARE-003 §2.3 + NOTIF-001 — por onde o convite sai, e o que a tela diz sobre isso.
//
// ============================================================================================
// ESTE ARQUIVO EXISTE POR CAUSA DE UM DEFEITO REAL
// ============================================================================================
// Homologação da fundadora, 27/09/2026: ela convidou por e-mail e por telefone, a tela disse "Convites
// enviados", e nada chegou. O convite era gravado e o envio não existia.
//
// O defeito grave não era a falta do envio — era a tela AFIRMAR o que não aconteceu. Um rótulo que mente
// destrói a confiança em todos os outros, porque a pessoa deixa de saber quais acreditar.
//
// A catraca daqui é essa: **nenhum rótulo afirma entrega que não houve.**

import { describe, it, expect } from 'vitest'
import {
  canalDoContato, contatoNormalizado, rotuloDaEntrega, foiEntregue, rotuloDoConviteNaLista,
  AVISO_CONTATO_NAO_RECONHECIDO,
  type EntregaDoConvite, type CanalDoConvite, type StatusConvite,
} from '@sintera/core'

const ENTREGAS: EntregaDoConvite[] = ['pendente', 'entregue', 'falhou', 'nao_configurado']
const CANAIS: CanalDoConvite[] = ['email', 'whatsapp']

describe('NOTIF-001 · o canal vem do formato do contato', () => {
  it.each(['ana@exemplo.com', 'ANA@Exemplo.COM.BR', 'a.b+c@sub.dominio.io'])('“%s” é e-mail', (v) => {
    expect(canalDoContato(v)).toBe('email')
  })

  it.each(['+55 11 98765-4321', '11987654321', '(11) 98765 4321'])('“%s” é WhatsApp', (v) => {
    expect(canalDoContato(v)).toBe('whatsapp')
  })

  it.each(['', '   ', 'ana', 'ana@', '@exemplo.com', 'nem-uma-coisa-nem-outra'])('“%s” não é reconhecido', (v) => {
    expect(canalDoContato(v)).toBe('desconhecido')
  })

  it('e-mail é normalizado em minúsculas; telefone vira só dígitos', () => {
    expect(contatoNormalizado(' ANA@Exemplo.com ')).toBe('ana@exemplo.com')
    expect(contatoNormalizado('(11) 98765-4321')).toMatch(/^\d+$/)
    expect(contatoNormalizado('qualquer coisa')).toBeNull()
  })

  it('o aviso de contato não reconhecido não culpa quem digitou', () => {
    expect(AVISO_CONTATO_NAO_RECONHECIDO).toMatch(/confira/i)
    expect(AVISO_CONTATO_NAO_RECONHECIDO, 'não acusa a pessoa de erro').not.toMatch(/inválid|errad|incorret/i)
  })
})

describe('CARE-003 · CATRACA — nenhum rótulo afirma entrega que não houve', () => {
  it.each(CANAIS)('em %s, só `entregue` diz que o convite foi enviado', (canal) => {
    for (const e of ENTREGAS) {
      const r = rotuloDaEntrega(e, canal)
      if (e === 'entregue') {
        expect(r).toMatch(/enviado/i)
      } else {
        expect(r, `"${r}" afirma envio que não aconteceu (${e})`).not.toMatch(/convite enviado/i)
      }
    }
  })

  it('`foiEntregue` só aceita entregue — é a fonte de verdade da tela', () => {
    expect(foiEntregue('entregue')).toBe(true)
    for (const e of ['pendente', 'falhou', 'nao_configurado'] as const) expect(foiEntregue(e)).toBe(false)
  })

  it('canal sem credencial diz que o convite NÃO saiu, e não some no silêncio', () => {
    const r = rotuloDaEntrega('nao_configurado', 'email')
    expect(r).toMatch(/não saiu/i)
    expect(r).toMatch(/configurad/i)
  })

  it('falha oferece a saída — tentar de novo', () => {
    expect(rotuloDaEntrega('falhou', 'whatsapp')).toMatch(/tente de novo/i)
  })

  it('o rótulo nomeia o canal, para a pessoa saber onde procurar', () => {
    expect(rotuloDaEntrega('entregue', 'email')).toMatch(/e-mail/i)
    expect(rotuloDaEntrega('entregue', 'whatsapp')).toMatch(/whatsapp/i)
  })
})

describe('CARE-003 · o rótulo na lista de quem enviou', () => {
  const c = (status: StatusConvite, entrega: EntregaDoConvite) =>
    ({ status, entrega, canal: 'email' as const })

  it('convite enviado e ENTREGUE mostra o estado do convite', () => {
    expect(rotuloDoConviteNaLista(c('enviado', 'entregue'))).toMatch(/convite enviado/i)
  })

  it('convite enviado e NÃO entregue mostra o estado da ENTREGA — é o que a pessoa precisa saber', () => {
    expect(rotuloDoConviteNaLista(c('enviado', 'nao_configurado'))).toMatch(/não saiu/i)
    expect(rotuloDoConviteNaLista(c('enviado', 'falhou'))).toMatch(/não consegui enviar/i)
    expect(rotuloDoConviteNaLista(c('enviado', 'pendente'))).toMatch(/enviando/i)
  })

  it('convite já respondido mostra a resposta, qualquer que tenha sido a entrega', () => {
    // Uma vez respondido, o caminho de entrega deixou de importar: o fato aconteceu.
    expect(rotuloDoConviteNaLista(c('aceito', 'falhou'))).toMatch(/vínculo ativo/i)
    expect(rotuloDoConviteNaLista(c('recusado', 'entregue'))).toMatch(/encerrado/i)
  })

  it('nenhum rótulo da lista sugere insistir', () => {
    for (const status of ['enviado', 'aceito', 'recusado', 'expirado', 'cancelado'] as const) {
      for (const entrega of ENTREGAS) {
        expect(rotuloDoConviteNaLista({ status, entrega, canal: 'email' })).not.toMatch(/reenvi|lembr|cobr/i)
      }
    }
  })
})

describe('CARE-003 · motivo de configuração diz O QUE FAZER', () => {
  // Achado na homologação de 27/09: o WhatsApp recusou com #131030 (conta em modo de teste, número fora da
  // lista autorizada) e a tela disse "tente de novo" — mandando a pessoa repetir o que não podia dar certo.
  it('número fora da lista autorizada não manda tentar de novo — manda usar e-mail', () => {
    const r = rotuloDaEntrega('nao_configurado', 'whatsapp', 'numero_nao_autorizado')
    expect(r).toMatch(/modo de teste/i)
    expect(r, 'precisa oferecer a saída que existe').toMatch(/e-mail/i)
    expect(r, 'repetir não resolve configuração').not.toMatch(/tente de novo/i)
  })

  it.each([
    ['template_nao_aprovado', /modelo de mensagem/i],
    ['remetente_nao_registrado', /remetente/i],
    ['token_invalido', /credencial/i],
    ['sem_resend_api_key', /e-mail ainda não está configurado/i],
  ])('o motivo "%s" tem frase própria', (motivo, esperado) => {
    expect(rotuloDaEntrega('nao_configurado', 'whatsapp', motivo)).toMatch(esperado)
  })

  it('todo motivo de configuração diz que o convite NÃO saiu', () => {
    for (const m of ['numero_nao_autorizado', 'template_nao_aprovado', 'remetente_nao_registrado',
                     'token_invalido', 'sem_resend_api_key']) {
      expect(rotuloDaEntrega('nao_configurado', 'whatsapp', m), `${m} não diz que não saiu`)
        .toMatch(/não saiu/i)
    }
  })

  it('motivo desconhecido cai na frase genérica, e ela continua honesta', () => {
    const r = rotuloDaEntrega('nao_configurado', 'email', 'algo_que_nao_mapeamos')
    expect(r).toMatch(/não saiu/i)
    expect(r).not.toMatch(/convite enviado/i)
  })
})

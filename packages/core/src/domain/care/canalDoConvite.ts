// @sintera/core — CARE-003 §2.3 + NOTIF-001: por onde o convite sai.
//
// ============================================================================================
// O DEFEITO QUE ISTO CORRIGE (homologação da fundadora, 27/09/2026)
// ============================================================================================
// O convite era gravado e a tela dizia "Convites enviados" — e NADA saía. Nem e-mail, nem mensagem. Quem
// convidasse esperaria uma resposta que nunca chegaria, sem nenhum sinal de que havia problema.
//
// Pior que o defeito: a tela MENTIA. Um rótulo que afirma o que não aconteceu destrói a confiança em todos os
// outros rótulos, porque a pessoa deixa de saber quais acreditar.
//
// ============================================================================================
// O CANAL VEM DO CONTATO, NÃO DE PREFERÊNCIA
// ============================================================================================
// O NOTIF-001 diz que a pessoa configura o canal por categoria — e-mail, WhatsApp, ambos ou nenhum. Aqui isso
// NÃO se aplica, e a razão importa: o destinatário do convite **ainda não é usuário**. Não tem conta, não tem
// preferência, e não consentiu com nada.
//
// Então o canal é decidido pelo formato do que quem convida digitou. Quem escreveu um e-mail recebe e-mail;
// quem escreveu um telefone recebe WhatsApp. É o mínimo de intromissão possível: usa-se o endereço que a
// pessoa já deu a quem a está convidando, e nenhum outro.

import { toDialDigits } from '../profile/phone'

export type CanalDoConvite = 'email' | 'whatsapp' | 'desconhecido'

/** Forma de e-mail. Deliberadamente frouxa: recusar endereço válido é pior do que aceitar um inválido. */
const PARECE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/**
 * Por onde este contato recebe.
 *
 * `desconhecido` não é erro de quem digitou — é a plataforma admitindo que não reconheceu o formato. A tela
 * pede para conferir; não acusa a pessoa de ter errado.
 */
export function canalDoContato(contato: string | null | undefined): CanalDoConvite {
  const v = (contato ?? '').trim()
  if (!v) return 'desconhecido'
  if (PARECE_EMAIL.test(v)) return 'email'
  if (toDialDigits(v)) return 'whatsapp'
  return 'desconhecido'
}

/** Como o contato é normalizado para envio. `null` quando o canal não reconhece o valor. */
export function contatoNormalizado(contato: string | null | undefined): string | null {
  const v = (contato ?? '').trim()
  switch (canalDoContato(v)) {
    case 'email': return v.toLowerCase()
    case 'whatsapp': return toDialDigits(v)
    default: return null
  }
}

/** O que a pessoa lê ao digitar um contato que não reconhecemos. */
export const AVISO_CONTATO_NAO_RECONHECIDO =
  'Não reconheci este contato como e-mail nem como telefone. Confira e tente de novo.'

// ------------------------------------------------------------------------------------------------------
// Estado da entrega
// ------------------------------------------------------------------------------------------------------

/**
 * `pendente` existe porque a entrega acontece DEPOIS de gravar o convite. Entre um e outro, o estado honesto
 * é "ainda não sei" — e não "enviado".
 *
 * `nao_configurado` é diferente de `falhou`, e a distinção decide o que fazer: falha é problema a investigar;
 * canal sem credencial é configuração ausente, que a pessoa certa resolve em minutos. Tratá-los como a mesma
 * coisa é a armadilha que já custou dois ciclos de homologação a este projeto.
 */
export type EntregaDoConvite = 'pendente' | 'entregue' | 'falhou' | 'nao_configurado'

/**
 * O rótulo que quem convidou lê. Nenhum deles afirma entrega que não aconteceu.
 *
 * `nao_configurado` e `falhou` dizem para quem olha que o convite NÃO chegou — porque deixar a pessoa
 * esperando uma resposta impossível é exatamente o defeito que este módulo existe para corrigir.
 */
export function rotuloDaEntrega(e: EntregaDoConvite, canal: CanalDoConvite, motivo?: string | null): string {
  const onde = canal === 'whatsapp' ? 'por WhatsApp' : 'por e-mail'
  switch (e) {
    case 'pendente': return 'Enviando…'
    case 'entregue': return `Convite enviado ${onde}`
    case 'falhou': return `Não consegui enviar ${onde}. Tente de novo.`
    case 'nao_configurado': return MOTIVO[motivo ?? ''] ?? `O envio ${onde} ainda não está configurado — o convite não saiu.`
  }
}

/**
 * A frase de cada motivo de configuração pendente.
 *
 * ELAS DIZEM O QUE FAZER, e não só o que houve. Achado na homologação de 27/09: o WhatsApp recusou porque a
 * conta na Meta está em modo de teste, e a tela disse "tente de novo" — mandando a pessoa repetir o que não
 * podia dar certo. Um motivo sem saída é quase tão ruim quanto um rótulo que mente.
 *
 * O texto mora no core porque as duas pontas leem o mesmo (BASE ÚNICA).
 */
const MOTIVO: Readonly<Record<string, string>> = {
  numero_nao_autorizado:
    'O WhatsApp da SINTERA ainda está em modo de teste e só envia para números autorizados na Meta. ' +
    'O convite não saiu — por enquanto, convide por e-mail.',
  template_nao_aprovado:
    'O modelo de mensagem do convite ainda não foi aprovado pela Meta. O convite não saiu — por enquanto, ' +
    'convide por e-mail.',
  remetente_nao_registrado:
    'O número remetente do WhatsApp ainda não está registrado na Meta. O convite não saiu.',
  token_invalido:
    'A credencial do WhatsApp expirou ou é inválida. O convite não saiu.',
  sem_resend_api_key:
    'O envio por e-mail ainda não está configurado — o convite não saiu.',
}

/** O convite chegou ao destinatário? Só `entregue` conta. */
export function foiEntregue(e: EntregaDoConvite): boolean {
  return e === 'entregue'
}

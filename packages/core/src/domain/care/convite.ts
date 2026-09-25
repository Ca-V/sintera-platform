// @sintera/core — CARE-003 §2.3 e §4.2: o convite.
//
// Regra PURA, fonte única Web↔Mobile. O convite é o que precede o vínculo — e precisa existir para quem ainda
// não tem conta, que é a razão de ser entidade própria e não um vínculo em estado inicial.
//
// DUAS REGRAS QUE ESTE MÓDULO EXISTE PARA SUSTENTAR:
//
// 1. O convite NUNCA carrega dado de saúde. Um convite lido por quem não deveria não pode revelar nada além
//    de que uma pessoa quis se conectar a outra.
// 2. O remetente não sabe se o convite foi aberto, nem se a pessoa criou conta. Saber transformaria a recusa
//    em constrangimento e o silêncio em cobrança.

import { type Lado } from './vinculo'

export type DirecaoConvite = 'paciente_convida_profissional' | 'profissional_convida_paciente'

export type StatusConvite = 'enviado' | 'aceito' | 'recusado' | 'expirado' | 'cancelado'

export interface Convite {
  readonly direcao: DirecaoConvite
  readonly status: StatusConvite
  readonly expiraEm: Date
  readonly declaracaoRelacao?: string | null
}

export const DIAS_ATE_EXPIRAR = 30

export function direcaoDe(por: Lado): DirecaoConvite {
  return por === 'paciente' ? 'paciente_convida_profissional' : 'profissional_convida_paciente'
}

export function quemIniciou(d: DirecaoConvite): Lado {
  return d === 'paciente_convida_profissional' ? 'paciente' : 'profissional'
}

/** Transições válidas. Só `enviado` muda de estado; o resto é definitivo. */
const TRANSICOES: Readonly<Record<StatusConvite, readonly StatusConvite[]>> = {
  enviado: ['aceito', 'recusado', 'expirado', 'cancelado'],
  aceito: [],
  recusado: [],
  expirado: [],
  cancelado: [],
}

/**
 * Quem pode aplicar cada resposta.
 *
 * `aceito` e `recusado` são do DESTINATÁRIO. Quem convida não responde por quem foi convidado — e isso não é
 * formalidade: é a mesma regra do vínculo, de que ninguém concede acesso aos dados de outra pessoa em nome
 * dela. `cancelado` é do remetente; `expirado` é do relógio.
 */
const QUEM_RESPONDE: Readonly<Record<StatusConvite, readonly ('remetente' | 'destinatario' | 'sistema')[]>> = {
  enviado: [],
  aceito: ['destinatario'],
  recusado: ['destinatario'],
  cancelado: ['remetente'],
  expirado: ['sistema'],
}

export type Autor = 'remetente' | 'destinatario' | 'sistema'

export function respostaPermitida(de: StatusConvite, para: StatusConvite, por: Autor): boolean {
  return TRANSICOES[de].includes(para) && QUEM_RESPONDE[para].includes(por)
}

export function motivoRespostaInvalida(de: StatusConvite, para: StatusConvite, por: Autor): string | null {
  if (respostaPermitida(de, para, por)) return null
  if (de !== 'enviado') return `Este convite já foi ${de} e não muda mais.`
  if ((para === 'aceito' || para === 'recusado') && por === 'remetente') {
    return 'Quem convida não responde pelo convidado. Só o destinatário aceita ou recusa.'
  }
  if (para === 'cancelado' && por !== 'remetente') return 'Só quem enviou pode cancelar o convite.'
  return 'Esta mudança não é permitida neste convite.'
}

/** O convite do profissional exige declaração de relação assistencial existente (CARE-003 §4.2). */
export function pendenciasDoConvite(c: Pick<Convite, 'direcao' | 'declaracaoRelacao'>): string[] {
  const faltam: string[] = []
  if (c.direcao === 'profissional_convida_paciente' && !c.declaracaoRelacao?.trim()) {
    faltam.push('declaração de relação assistencial')
  }
  return faltam
}

/** Expirado é estado derivado do relógio; um convite vencido não aceita resposta mesmo marcado 'enviado'. */
export function estaVencido(c: Pick<Convite, 'status' | 'expiraEm'>, agora: Date): boolean {
  return c.status === 'enviado' && c.expiraEm.getTime() <= agora.getTime()
}

export function podeResponder(c: Pick<Convite, 'status' | 'expiraEm'>, agora: Date): boolean {
  return c.status === 'enviado' && !estaVencido(c, agora)
}

/**
 * O que o REMETENTE pode saber sobre o convite que enviou.
 *
 * Deliberadamente pobre. Ele vê para onde mandou, quando, e se foi respondido — nunca se a pessoa abriu, se
 * criou conta, ou se existe na plataforma. A ausência de resposta tem de continuar ambígua: é isso que
 * impede o convite de virar instrumento de pressão.
 */
export interface VisaoDoRemetente {
  readonly paraContato: string
  readonly status: StatusConvite
  readonly criadoEm: Date
  readonly expiraEm: Date
}

/** Como a recusa é apresentada a quem convidou: encerrada, nunca como pendência a insistir. */
export function rotuloParaRemetente(status: StatusConvite): string {
  switch (status) {
    case 'enviado': return 'Convite enviado'
    case 'aceito': return 'Vínculo ativo'
    // "Encerrado" e não "recusado": o remetente não precisa saber que foi uma negativa, e sim que acabou.
    case 'recusado': return 'Convite encerrado'
    case 'expirado': return 'Convite expirado'
    case 'cancelado': return 'Convite cancelado'
  }
}

/**
 * Campos que o convite NUNCA pode carregar. Usado pela catraca de teste.
 *
 * Lista de CLASSES, não de nomes exaustivos (Modelo Aberto): qualquer coisa que descreva condição, exame,
 * medida, medicamento ou motivo clínico está fora. Se um dia for preciso "dar contexto" no convite, a resposta
 * é não — o contexto existe depois do aceite, dentro do vínculo.
 */
export const PROIBIDO_NO_CONVITE: readonly string[] = [
  'exame', 'exames', 'biomarcador', 'diagnostico', 'diagnóstico', 'condicao', 'condição',
  'medicamento', 'medida', 'peso', 'laudo', 'resultado', 'sintoma', 'motivo_clinico',
]

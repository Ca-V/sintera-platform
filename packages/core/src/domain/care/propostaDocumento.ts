// @sintera/core — CARE-003 §1.2: o documento proposto pelo profissional.
//
// A REGRA QUE ESTE MÓDULO EXISTE PARA SUSTENTAR, e que resolve um conflito com o CARE-001:
//
//   O CARE-001 §3.6 diz "somente leitura — o profissional NUNCA altera a base do paciente". O plano de
//   negócios §21 diz que o profissional envia exames, receitas e planos que integram o histórico. Os dois
//   sobrevivem porque o profissional PROPÕE e o aceite do paciente é o que ESCREVE. Acrescentar não é editar,
//   e quem acrescenta é sempre o titular.
//
// Uma proposta NÃO é um documento do histórico. Vira um quando aceita — e a linha em `patient_documents` é
// inserida pelo próprio paciente, o que mantém intacta a policy mais forte da plataforma.

import type { PatientDocumentSubtype } from '../documents/patientDocuments'

export type EstadoProposta = 'proposto' | 'aceito' | 'recusado' | 'cancelado'

export type AutorDaResposta = 'paciente' | 'profissional'

export interface PropostaDeDocumento {
  readonly subtype: PatientDocumentSubtype
  readonly estado: EstadoProposta
  readonly issuer?: string | null
  readonly docDate?: string | null
  readonly notes?: string | null
}

/** Só `proposto` muda de estado. O resto é definitivo. */
const TRANSICOES: Readonly<Record<EstadoProposta, readonly EstadoProposta[]>> = {
  proposto: ['aceito', 'recusado', 'cancelado'],
  aceito: [],
  recusado: [],
  cancelado: [],
}

/**
 * Quem pode aplicar cada resposta.
 *
 * Aceitar e recusar são do PACIENTE — é o invariante inteiro em uma linha. Cancelar é do profissional, e é
 * outra coisa: desistir do que propôs, não decidir pelo outro.
 */
const QUEM_RESPONDE: Readonly<Record<EstadoProposta, readonly AutorDaResposta[]>> = {
  proposto: [],
  aceito: ['paciente'],
  recusado: ['paciente'],
  cancelado: ['profissional'],
}

export function respostaDaPropostaPermitida(de: EstadoProposta, para: EstadoProposta, por: AutorDaResposta): boolean {
  return TRANSICOES[de].includes(para) && QUEM_RESPONDE[para].includes(por)
}

export function motivoRespostaDaPropostaInvalida(de: EstadoProposta, para: EstadoProposta, por: AutorDaResposta): string | null {
  if (respostaDaPropostaPermitida(de, para, por)) return null
  if (de !== 'proposto') return `Esta proposta já foi ${de} e não muda mais.`
  if ((para === 'aceito' || para === 'recusado') && por === 'profissional') {
    return 'Só a pessoa dona dos dados aceita ou recusa um documento. Você pode cancelar o envio.'
  }
  if (para === 'cancelado' && por === 'paciente') {
    return 'Cancelar é de quem enviou. Você pode recusar.'
  }
  return 'Esta mudança não é permitida nesta proposta.'
}

/**
 * O profissional pode propor?
 *
 * Três condições, todas necessárias, e nenhuma delas é formalidade:
 *  · vínculo ATIVO — sem aceite do paciente não existe canal;
 *  · registro no conselho VERIFICADO — é o que impede alguém não habilitado de mandar a um usuário um
 *    documento que ele vai ler como clínico;
 *  · a proposta nasce em `proposto` — ninguém se autoconcede o aceite.
 *
 * As mesmas três estão na policy de INSERT da migração 160. Aqui elas existem para a tela poder EXPLICAR
 * antes de tentar, em vez de deixar o banco recusar sem dizer por quê.
 */
export function podePropor(args: { vinculoAtivo: boolean; profissionalVerificado: boolean }): boolean {
  return args.vinculoAtivo && args.profissionalVerificado
}

export function motivoNaoPodePropor(args: { vinculoAtivo: boolean; profissionalVerificado: boolean }): string | null {
  if (!args.profissionalVerificado) {
    return 'Seu registro no conselho ainda não foi confirmado. Enquanto isso, você não pode enviar documentos.'
  }
  if (!args.vinculoAtivo) {
    return 'Este vínculo não está ativo. Só é possível enviar documentos a quem autorizou você.'
  }
  return null
}

/** Uma proposta ainda espera resposta? */
export function aguardaResposta(p: Pick<PropostaDeDocumento, 'estado'>): boolean {
  return p.estado === 'proposto'
}

/**
 * Como o estado é apresentado a cada lado.
 *
 * Para o PROFISSIONAL, recusado vira "encerrado" — pela mesma razão do convite: ele não precisa saber que foi
 * negativa, e transformar recusa em pendência visível cria pressão sobre quem recusou.
 */
export function rotuloParaProfissional(estado: EstadoProposta): string {
  switch (estado) {
    case 'proposto': return 'Enviado'
    case 'aceito': return 'No histórico do paciente'
    case 'recusado': return 'Envio encerrado'
    case 'cancelado': return 'Cancelado por você'
  }
}

export function rotuloParaPaciente(estado: EstadoProposta): string {
  switch (estado) {
    case 'proposto': return 'Aguardando você'
    case 'aceito': return 'Nos seus documentos'
    case 'recusado': return 'Você recusou'
    case 'cancelado': return 'Cancelado por quem enviou'
  }
}

/**
 * O que a pessoa precisa saber ANTES de aceitar.
 *
 * Aceitar acrescenta ao histórico dela um documento que ela não produziu. Dizer isso antes é o que torna o
 * aceite uma decisão, e não um clique.
 */
export const AVISO_ANTES_DE_ACEITAR =
  'Ao aceitar, este documento entra nos seus documentos, com o nome de quem enviou e a data. Você pode removê-lo depois.'

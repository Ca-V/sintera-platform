// @sintera/core — BILLING-003 §3: o que um limite de plano pode e não pode fazer.
//
// ============================================================================================
// A REGRA QUE NENHUM LIMITE PODE VIOLAR
// ============================================================================================
//   Limite se aplica a ACRESCENTAR, nunca a VER o que já está lá.
//
// Uma pessoa no Plus com 500 documentos que para de pagar cai no gratuito, cujo limite é 5. Os outros 495
// NÃO somem, não são ocultados e não ficam borrados. Ela deixa de poder enviar o 501º.
//
// Não é gentileza. São dados de saúde dela, e condicionar o acesso a eles ao pagamento seria reter informação
// clínica como garantia — além de conflitar com o direito de acesso e de portabilidade.
//
// Vale igual para o vínculo: quem tem 3 profissionais e cai para o gratuito (1) NÃO perde os vínculos. Deixa
// de poder criar o quarto. Revogação é ato da pessoa, nunca consequência de fatura.
//
// Este módulo existe para que essa regra tenha UM lugar, com teste, em vez de depender de cada tela lembrar.

import type { Entitlements } from './entitlements'

export interface AvaliacaoDeLimite {
  /** Pode acrescentar mais um? */
  readonly podeAcrescentar: boolean
  /** Quantos já existem. */
  readonly atual: number
  /** O teto, ou `null` quando não há. */
  readonly limite: number | null
  /** Já está no teto ou acima dele — por queda de plano, por exemplo. */
  readonly noTeto: boolean
}

/**
 * Avalia um limite. `limite` nulo (chave ausente nos entitlements) significa ILIMITADO, conforme o contrato.
 *
 * `atual > limite` é estado legítimo, não erro: acontece quando alguém cai de plano. A resposta certa é
 * impedir o próximo, nunca esconder os que existem.
 */
export function avaliarLimite(e: Entitlements, chave: string, atual: number): AvaliacaoDeLimite {
  const limite = e.limit(chave)
  if (limite === null) return { podeAcrescentar: true, atual, limite: null, noTeto: false }
  return { podeAcrescentar: atual < limite, atual, limite, noTeto: atual >= limite }
}

/**
 * A frase que a pessoa lê quando o teto a impede. `null` quando ela pode acrescentar.
 *
 * Diz o número e oferece a saída. Um limite que só diz "não" deixa a pessoa sem entender o que aconteceu com
 * um produto que antes deixava.
 */
export function motivoDoLimite(a: AvaliacaoDeLimite, rotuloPlural: string): string | null {
  if (a.podeAcrescentar) return null
  return a.atual > (a.limite ?? 0)
    ? `Seu plano atual inclui ${a.limite} ${rotuloPlural}. Você tem ${a.atual}, e continua com acesso a ` +
      `todos — só não é possível acrescentar mais.`
    : `Seu plano atual inclui ${a.limite} ${rotuloPlural}. Para acrescentar mais, mude de plano.`
}

/**
 * CATRACA EM FORMA DE FUNÇÃO: o que já existe continua visível, sempre.
 *
 * Esta função devolve a lista INTEIRA, de propósito, e recebe os entitlements só para deixar explícito que
 * eles não influenciam. Existe para que qualquer tentativa de "cortar pelo limite" na exibição tropece num
 * nome que diz o contrário — e no teste que a acompanha.
 */
export function visivelIndependenteDoPlano<T>(itens: readonly T[], _e: Entitlements): readonly T[] {
  return itens
}

/** Nomes de limite usados hoje. Centralizados para que tela e plano falem a mesma chave. */
export const LIMITE_PROFISSIONAIS = 'profissionais'
export const LIMITE_DOCUMENTOS_PROPRIOS = 'documentos_proprios'
export const LIMITE_PROFISSIONAIS_NA_CONTA = 'profissionais_na_conta'

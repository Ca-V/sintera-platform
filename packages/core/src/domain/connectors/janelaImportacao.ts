// @sintera/core — QUANTO PARA TRÁS a plataforma busca, e por quê.
//
// A PERGUNTA DA FUNDADORA (30/08): "por que foram carregadas doze atividades? Qual seria o padrão? Seria
// carregar só o que veio depois de habilitar, seria carregar todas as atividades feitas até hoje?"
//
// A RESPOSTA, e ela vale para TODA fonte — Health Connect, Apple Saúde, e qualquer conector futuro:
//
//   NA PRIMEIRA VEZ, TUDO QUE A FONTE PERMITIR. Depois, só o que é novo.
//
// POR QUE NÃO "só do dia da autorização em diante". A SINTERA existe para dar continuidade a uma história de
// saúde. Começar do zero no dia da instalação jogaria fora justamente o que a pessoa já tem — e a obrigaria a
// digitar à mão o passado que a fonte já guarda. Seria a plataforma pedindo trabalho em vez de poupá-lo.
//
// POR QUE NÃO "sempre tudo, toda vez". Reler anos a cada sincronização é lento e não acrescenta nada: a
// ingestão é idempotente e descartaria o repetido. O caro seria pago sem retorno.
//
// O QUE LIMITA, e não somos nós:
//
//   - O Health Connect entrega só os 30 dias anteriores à PRIMEIRA autorização, a menos que a permissão de
//     histórico seja concedida. E ultrapassar esse teto NÃO devolve menos: devolve erro.
//   - Cada aplicativo escreve no cofre o que quer, e quase sempre só a partir de quando é ligado. O que o
//     Strava tinha de 01/08 em diante veio; o que era anterior a isso, ele nunca escreveu.
//
// Foi por isso que a primeira sincronização da fundadora trouxe 34 atividades de exatamente 30 dias: era o
// tamanho da janela que pedimos, e era tudo o que havia no cofre.

/** Quantos dias a plataforma pede na PRIMEIRA sincronização, quando a fonte libera o histórico completo. */
export const DIAS_PRIMEIRA_SINCRONIZACAO = 5 * 365

/**
 * Teto quando a fonte NÃO liberou o histórico.
 *
 * 28, e não 30, de propósito: o limite do Health Connect é contado a partir da primeira autorização, e pedir
 * exatamente 30 é pedir na borda — qualquer diferença de relógio derruba a leitura INTEIRA, com erro, não com
 * menos dados. Foi o que quase escondeu a causa na homologação de 30/08.
 */
export const DIAS_SEM_HISTORICO = 28

/**
 * Sobreposição entre sincronizações incrementais.
 *
 * Uma fonte pode gravar um registro com atraso — a atividade termina às 9h e chega ao cofre às 9h20. Retomar
 * exatamente de onde parou perderia esse registro para sempre. Uma hora de sobreposição custa nada (a
 * ingestão descarta o repetido) e evita um buraco permanente.
 */
export const HORAS_SOBREPOSICAO = 1

export interface JanelaImportacao {
  readonly desde: Date
  readonly ate: Date
  /** Primeira vez desta fonte? Determina se é varredura de histórico ou incremento. */
  readonly primeira: boolean
}

/**
 * A janela a pedir agora.
 *
 * `ultimaSincronizacao` ausente = primeira vez: varre o histórico. Presente = incrementa a partir dela, com a
 * sobreposição. O teto por permissão é aplicado na camada do aparelho, que é quem sabe o que foi concedido.
 *
 * `agora` entra por parâmetro para a função ser PURA e testável — data do relógio dentro de regra de domínio
 * é o que torna um comportamento impossível de verificar.
 */
export function janelaImportacao(agora: Date, ultimaSincronizacao?: Date | null): JanelaImportacao {
  if (!ultimaSincronizacao || Number.isNaN(ultimaSincronizacao.getTime())) {
    return {
      desde: new Date(agora.getTime() - DIAS_PRIMEIRA_SINCRONIZACAO * 24 * 60 * 60 * 1000),
      ate: agora,
      primeira: true,
    }
  }
  const desde = new Date(ultimaSincronizacao.getTime() - HORAS_SOBREPOSICAO * 60 * 60 * 1000)
  // Relógio para trás, marca-d'água no futuro: cai para a janela curta em vez de pedir um intervalo invertido,
  // que a fonte recusaria inteiro.
  if (desde.getTime() >= agora.getTime()) {
    return { desde: new Date(agora.getTime() - DIAS_SEM_HISTORICO * 24 * 60 * 60 * 1000), ate: agora, primeira: false }
  }
  return { desde, ate: agora, primeira: false }
}

/**
 * Janela da sincronização em SEGUNDO PLANO, que é mais curta na primeira vez — de propósito.
 *
 * Varrer anos numa tarefa de fundo é receita para o sistema matá-la no meio: o Android dá poucos segundos, e
 * uma varredura interrompida deixa a marca d'água avançar sobre dias que nunca foram lidos. O histórico
 * completo é assunto da sincronização MANUAL, com a tela aberta e a pessoa esperando.
 *
 * A divergência mora aqui, ao lado da regra que ela excepciona, e não escondida numa constante de outro
 * arquivo — que foi como ela existiu até agora.
 */
export function janelaImportacaoSegundoPlano(agora: Date, ultimaSincronizacao?: Date | null): JanelaImportacao {
  const j = janelaImportacao(agora, ultimaSincronizacao)
  if (!j.primeira) return j
  return { desde: new Date(agora.getTime() - DIAS_SEM_HISTORICO * 24 * 60 * 60 * 1000), ate: agora, primeira: true }
}

/**
 * O que a pessoa lê sobre o alcance da busca, depois de sincronizar.
 *
 * Existe porque "34 atividades" sem dizer DE QUANDO deixa a pessoa sem saber se faltou alguma coisa — foi
 * exatamente a dúvida que a fundadora levantou ao ver a primeira importação.
 */
export function alcanceLabel(diasJanela: number, historicoLiberado: boolean, primeira: boolean): string {
  if (primeira && historicoLiberado) {
    return 'Buscamos todo o histórico que a fonte permite. O que não veio é porque a fonte não guardava.'
  }
  if (primeira) {
    return `Buscamos os últimos ${diasJanela} dias — é o limite da fonte sem a autorização de histórico. ` +
      'Autorizando o histórico, a próxima busca vai além.'
  }
  return 'Buscamos o que entrou desde a última vez.'
}

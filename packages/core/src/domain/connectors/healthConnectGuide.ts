// @sintera/core — O QUE A PESSOA PRECISA FAZER EM CADA APP para o dado chegar até aqui.
//
// A FALHA QUE ISTO CORRIGE (achada pela fundadora, 28/08). A plataforma dizia "Autorizar e sincronizar", a
// pessoa autorizava, e não vinha nada — porque autorizar a SINTERA é só METADE. A outra metade acontece DENTRO
// do Strava, do Whoop, do Oura: cada um precisa ser ligado para escrever no Health Connect. Sem isso o cofre
// está aberto e vazio.
//
// E o efeito era o pior possível: nada acontece, e nada explica por quê. A pessoa conclui que a plataforma não
// funciona. É a mesma armadilha da configuração ausente que custou dois ciclos de homologação — só que aqui a
// configuração que falta é do lado dela, e ninguém a avisou.
//
// POR QUE O TEXTO MORA NO CORE. É instrução que a pessoa lê, e vale igual na Web e no aplicativo. Escrita duas
// vezes, divergiria — e uma instrução de configuração errada é pior do que instrução nenhuma: manda a pessoa
// procurar um menu que não existe.
//
// LISTA ABERTA (Modelo Aberto): o que não está aqui não deixa de funcionar. Qualquer app que escreva no Health
// Connect chega com a procedência certa; esta lista existe para ORIENTAR os casos comuns, não para limitar.

export interface FonteGuia {
  /** Id da fonte, o mesmo que aparece na procedência do dado. */
  readonly source: string
  readonly nome: string
  /** O caminho dentro do app da pessoa, em português, como ela vê na tela. */
  readonly caminho: string
  /** O que essa fonte manda. Ajuda a saber se vale ligar. */
  readonly traz: string
  /**
   * Quando a fonte AINDA não escreve no Health Connect. Dizer isso é obrigação: sem o aviso, a pessoa procuraria
   * um menu inexistente e concluiria que errou. Prometer o que não existe é o que corrói a confiança.
   */
  readonly indisponivel?: string
}

export const HEALTH_CONNECT_FONTES: readonly FonteGuia[] = [
  {
    source: 'strava',
    nome: 'Strava',
    // Caminho CONFERIDO no aparelho da fundadora (30/08). O Strava não chama de "Health Connect": chama de
    // "Conexão Saúde", e esconde em "Outros serviços". São TRÊS nomes para a mesma coisa — Health Connect
    // (Google), Saúde Connect (Play Store) e Conexão Saúde (Strava). Quem procura pelo nome que a gente diz
    // não acha, e conclui que o aparelho não tem.
    caminho: 'Strava → Você → Configurações → Outros serviços → Conexão Saúde → marcar',
    traz: 'corridas, pedaladas e caminhadas com tempo, distância e calorias',
  },
  {
    source: 'whoop',
    nome: 'Whoop',
    caminho: 'Whoop → Mais → Configurações do app → Integrações → Health Connect',
    traz: 'frequência cardíaca, sono e atividades',
  },
  {
    source: 'oura',
    nome: 'Oura',
    caminho: 'Oura → Perfil → Aplicativos e serviços → Health Connect',
    traz: 'sono, frequência cardíaca e temperatura',
  },
  {
    source: 'fitbit',
    nome: 'Fitbit',
    caminho: 'Fitbit → Você → Configurações → Health Connect',
    traz: 'passos, frequência cardíaca e sono',
  },
  {
    source: 'garmin',
    nome: 'Garmin',
    caminho: 'Garmin Connect → Configurações → Health Connect',
    traz: 'passos, frequência cardíaca, sono e atividades',
    // Verificado em 28/08/2026: anunciado pelo Google em maio de 2025, ainda não disponível. Enquanto não
    // estiver, o caminho acima não existe no app — e mandar a pessoa procurá-lo seria fazê-la se sentir burra
    // por não achar o que não está lá.
    indisponivel: 'O Garmin ainda não envia dados para o Health Connect. O suporte foi anunciado pelo Google, mas não foi liberado. Assim que sair, funciona sem você fazer nada aqui.',
  },
]

/** Só as fontes que dá para ligar hoje. */
export function fontesDisponiveis(): FonteGuia[] {
  return HEALTH_CONNECT_FONTES.filter(f => !f.indisponivel)
}

/** As que ainda não escrevem — mostradas com o motivo, nunca escondidas. */
export function fontesIndisponiveis(): FonteGuia[] {
  return HEALTH_CONNECT_FONTES.filter(f => !!f.indisponivel)
}

/**
 * A explicação de por que autorizar a SINTERA não basta.
 *
 * Fica no core porque é a frase que evita a conclusão errada — "não funciona" — quando na verdade falta um passo
 * do outro lado. As duas pontas dizem exatamente isto.
 */
export const HEALTH_CONNECT_DOIS_PASSOS =
  'São dois passos, e o segundo é dentro do app do seu aparelho. Aqui você autoriza a SINTERA a ler; ' +
  'lá você autoriza o aparelho a escrever. Sem os dois, o Health Connect fica aberto e vazio.'

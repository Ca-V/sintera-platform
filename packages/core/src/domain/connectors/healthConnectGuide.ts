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
  /**
   * Versão mínima do Android (nível de API) em que ESTA fonte funciona.
   *
   * O Health Connect roda a partir do Android 9, mas os aplicativos que escrevem nele têm exigências próprias e
   * MAIORES. Num aparelho abaixo do mínimo, o caminho descrito simplesmente não existe — e mandar a pessoa
   * procurá-lo é fazê-la se sentir incompetente por não achar o que não está lá.
   *
   * Descoberto na homologação de 30/08: no Android 9 da fundadora, o Samsung Health estava listado no guia e
   * autorizado no Health Connect, e nunca escreveria nada — a versão dele que roda nesse aparelho é anterior ao
   * Health Connect existir.
   */
  readonly apiMinima?: number
  /**
   * O caminho no iPhone, quando ele foi CONFERIDO num aparelho real.
   *
   * Ausente na maioria de propósito. Os caminhos do Android acima foram verificados um a um — o do Strava
   * custou uma rodada de homologação, porque ele chama o Health Connect de "Conexão Saúde" e o esconde em
   * "Outros serviços". Escrever de cabeça os equivalentes no iOS repetiria o erro que esta lista existe para
   * evitar: mandar a pessoa procurar um menu que talvez não esteja onde eu disse.
   *
   * Sem este campo, a orientação cai na frase genérica de `CAMINHO_IOS_GENERICO`, que é verdadeira para todos.
   * Cada caminho conferido no iPhone entra aqui, com data, como os do Android entraram.
   */
  readonly caminhoIos?: string
}

/**
 * A instrução para quem está no iPhone e não tem caminho conferido para aquela fonte.
 *
 * Vaga de propósito, e honesta por isso: descreve o que a pessoa procura, sem afirmar onde está. Melhor um
 * "procure por" verdadeiro do que um caminho exato inventado.
 */
export const CAMINHO_IOS_GENERICO =
  'No aplicativo da fonte, procure Configurações → integrações (ou "aplicativos e serviços") e ligue o Apple Saúde.'

/** O caminho a mostrar, conforme o aparelho de quem lê. */
export function caminhoDaFonte(f: FonteGuia, plataforma: 'android' | 'ios'): string {
  if (plataforma === 'android') return f.caminho
  return f.caminhoIos ?? CAMINHO_IOS_GENERICO
}

/** Nome amigável da versão do Android, para a frase soar como a pessoa fala. */
function versaoAndroid(api: number): string {
  return `Android ${api - 19}` // API 29 = Android 10, 30 = 11, e assim por diante.
}

/**
 * Por que esta fonte não serve NESTE aparelho. `null` quando serve.
 *
 * Duas razões possíveis, e são diferentes: a fonte ainda não escreve no Health Connect (vale para todo mundo),
 * ou escreve mas exige um Android mais novo que o deste aparelho (vale só aqui). A segunda é a que estava
 * faltando, e é a que engana — a fonte aparece na lista, aceita a permissão, e não entrega nada.
 */
export function motivoIndisponivel(f: FonteGuia, apiAndroid?: number): string | null {
  if (f.indisponivel) return f.indisponivel
  if (f.apiMinima && typeof apiAndroid === 'number' && apiAndroid < f.apiMinima) {
    return `O ${f.nome} exige ${versaoAndroid(f.apiMinima)} ou mais recente para conversar com o Health Connect. ` +
      `Este aparelho tem ${versaoAndroid(apiAndroid)}, então esta fonte não vai enviar dados por aqui.`
  }
  return null
}

export const HEALTH_CONNECT_FONTES: readonly FonteGuia[] = [
  {
    source: 'strava',
    nome: 'Strava',
    // Caminho CONFERIDO no aparelho da fundadora (30/08). O Strava não chama de "Health Connect": chama de
    // "Conexão Saúde", e esconde em "Outros serviços". São TRÊS nomes para a mesma coisa — Health Connect
    // (Google), Saúde Connect (Play Store) e Conexão Saúde (Strava). Quem procura pelo nome que a gente diz
    // não acha, e conclui que o aparelho não tem.
    //
    // O equivalente no iPhone NÃO está aqui porque não foi conferido num aparelho — e foi justamente este
    // caminho que provou o custo de escrever de cabeça. Entra quando for verificado.
    caminho: 'Strava → Você → Configurações → Outros serviços → Conexão Saúde → marcar',
    traz: 'corridas, pedaladas e caminhadas com tempo, distância e calorias',
  },
  {
    // Faltava, e é a fonte mais provável de todas em aparelho Samsung: já vem instalado e já conta passos há
    // meses. Na homologação de 30/08 ele estava ali, em "acesso não permitido", enquanto se procurava dado
    // para testar. A fonte mais fácil era a que ninguém tinha lembrado de listar.
    source: 'samsung_health',
    nome: 'Samsung Health',
    caminho: 'Saúde Connect → Permissões do app → Samsung Health → permitir',
    traz: 'passos, frequência cardíaca e sono — já registrados no aparelho',
    // O Samsung Health exige Android 10. Verificado em 30/08/2026, no aparelho da fundadora: Android 9, o
    // Samsung Health autorizado no Health Connect, e TODAS as categorias vazias. A versão do Samsung Health que
    // roda em Android 9 é anterior ao Health Connect existir — ela nunca escreveria nada, e nada dizia isso.
    apiMinima: 29,
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

/** Só as fontes que dá para ligar NESTE aparelho. Sem a versão do Android, considera só o que vale para todos. */
export function fontesDisponiveis(apiAndroid?: number): FonteGuia[] {
  return HEALTH_CONNECT_FONTES.filter(f => !motivoIndisponivel(f, apiAndroid))
}

/** As que não servem aqui — mostradas COM o motivo, nunca escondidas. */
export function fontesIndisponiveis(apiAndroid?: number): { fonte: FonteGuia; motivo: string }[] {
  return HEALTH_CONNECT_FONTES
    .map(f => ({ fonte: f, motivo: motivoIndisponivel(f, apiAndroid) }))
    .filter((x): x is { fonte: FonteGuia; motivo: string } => !!x.motivo)
}

/**
 * A forma mais rápida de PROVAR que a ligação funciona, em vez de esperar.
 *
 * Nasceu do impasse de 30/08: o Health Connect estava vazio, e sem nada escrito não havia como distinguir
 * "configurado errado" de "configurado certo e ainda sem dado". Esperar horas por um sinal que talvez não venha
 * é a pior instrução possível — a pessoa desiste antes.
 *
 * Gravar uma atividade curta produz um dado NOVO, que é exatamente o que estas fontes escrevem: elas passam a
 * enviar a partir do momento em que são ligadas, e quase nunca reenviam o que já era antigo.
 */
export const HEALTH_CONNECT_COMO_TESTAR =
  'Para conferir agora, sem esperar: abra o aplicativo da fonte (o Strava, por exemplo), grave uma atividade ' +
  'de dois minutos e salve. Ela aparece no Health Connect em seguida, e a próxima sincronização a traz. ' +
  'É a prova de que a ligação está de pé — as fontes enviam o que acontece DEPOIS de ligadas, e raramente o que ' +
  'já era antigo.'

/**
 * A explicação de por que autorizar a SINTERA não basta.
 *
 * Fica no core porque é a frase que evita a conclusão errada — "não funciona" — quando na verdade falta um passo
 * do outro lado. As duas pontas dizem exatamente isto.
 */
/**
 * O QUE A PLATAFORMA CONSEGUE HOJE, dito sem promessa.
 *
 * Escrito porque a tela de Conexões no navegador não mencionava o Health Connect em lugar nenhum: quem usa a
 * SINTERA no computador não tinha como descobrir que a sincronização automática existe. Uma capacidade que a
 * plataforma tem e não diz é, na prática, uma capacidade que ninguém usa.
 *
 * E diz também o que NÃO consegue. O caminho automático depende do Health Connect, que é do Android — no
 * iPhone ele não existe, e o equivalente da Apple ainda não foi implementado. Silenciar sobre isso faria quem
 * tem iPhone procurar por semanas um botão que não está lá.
 */
export const CONEXOES_ONDE_FUNCIONA = {
  titulo: 'A sincronização automática acontece no seu celular',
  comoFunciona:
    'No aplicativo da SINTERA, a leitura chega sozinha pelo cofre de saúde do próprio aparelho — o Health ' +
    'Connect no Android, o Apple Saúde no iPhone. Você autoriza uma vez, e os aplicativos que você já usa ' +
    'passam a alimentar a plataforma sem que você precise pedir nada.',
  ondeFazer:
    'Os passos abaixo são feitos no celular, nos aplicativos das fontes. Estão aqui para você ler com calma; ' +
    'a execução é no aparelho.',
  /**
   * A diferença REAL entre os dois cofres, dita sem promessa e sem esconder.
   *
   * Os caminhos existem nos dois. O que muda é onde a pessoa liga cada fonte — e, no iPhone, o fato de a Apple
   * não informar ao aplicativo o que foi recusado. Calar sobre isso faria a pessoa culpar a plataforma por um
   * dado que ela mesma não autorizou.
   */
  iphone:
    'No iPhone o cofre é o Apple Saúde, e o caminho é o mesmo: você autoriza uma vez no aplicativo da SINTERA. ' +
    'Os passos por fonte abaixo valem para os dois — no iPhone, cada aplicativo é ligado ao Apple Saúde em vez ' +
    'do Health Connect. Uma diferença importante: por privacidade, o iPhone não informa aos aplicativos o que ' +
    'foi recusado, então a SINTERA não consegue dizer o que ficou de fora. Se algo não aparecer, confira em ' +
    'Ajustes → Saúde → Acesso a dados e dispositivos → SINTERA.',
} as const

export const HEALTH_CONNECT_DOIS_PASSOS =
  'São dois passos, e o segundo é dentro do app do seu aparelho. Aqui você autoriza a SINTERA a ler; ' +
  'lá você autoriza o aparelho a escrever. Sem os dois, o Health Connect fica aberto e vazio.'

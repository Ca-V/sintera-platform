// ============================================================
// Sistema de textos — FONTE ÚNICA de frases canônicas da SINTERA (PS-3)
// ============================================================
// Mesmo estado ⇒ mesma frase, em TODA a plataforma (Web E Mobile). Evita que a
// mesma situação apareça como "Documento enviado" numa tela e "Upload concluído"
// noutra, ou que cada plataforma redija seu próprio aviso regulatório à mão.
// Texto factual, calmo, sem juízo clínico (RDC 657). Vive no core justamente para
// ser consumido pelos dois apps — a Web re-exporta via @/lib/ui/copy (paths estáveis).
// ============================================================

/** Frases canônicas. Use SEMPRE estas — nunca redigite uma variante. */
export const COPY = {
  // sucesso
  documentSent: 'Documento enviado',
  purchaseRegistered: 'Compra registrada',
  linkGenerated: 'Link gerado',
  // erro
  imageUnreadable: 'Não consegui ler a imagem',
  // pendência
  awaitingConfirmation: 'Aguardando confirmação',
} as const

export type CopyKey = keyof typeof COPY

/**
 * TEXTO DE TELA — título, subtítulo, rótulos de campo, estado vazio e ações.
 *
 * POR QUE ISTO EXISTE (homologação da fundadora, 25/08): a tela de Monitoramento prometia coisas DIFERENTES
 * em cada plataforma. A Web dizia que acompanha "sinais vitais, atividade, sono e outros indicadores"; o
 * Mobile dizia "sinais vitais — pressão, frequência cardíaca, glicemia". Mesma tela, mesmo produto, promessas
 * distintas — porque cada ponta redigiu o seu texto à mão.
 *
 * Este arquivo já dizia, desde sempre, que existe para impedir isso. Só não tinha o texto das telas dentro.
 *
 * REGRA: nenhum texto visível ao usuário é escrito na tela. Vem daqui, e as duas pontas leem o mesmo.
 */
export const SCREEN_COPY = {
  monitoramento: {
    title:          'Monitoramento',
    subtitle:       'Acompanhe sinais vitais, atividade, sono e outros indicadores — manuais e, em breve, de dispositivos — ao longo do tempo.',
    add:            'Adicionar',
    close:          'Fechar',
    save:           'Salvar',
    emptyTitle:     'Nenhum sinal vital ainda',
    emptyMessage:   'Registre um sinal vital. Use Adicionar.',
    fieldVital:     'Sinal vital',
    fieldDate:      'Data',
    // HIP-014 §2 — a hora distingue duas medições do mesmo dia (o diário de pressão). Opcional de propósito:
    // quem mede uma vez por dia não deve ser obstruído por um campo que não usa.
    fieldTime:      'Hora (opcional)',
    fieldTimeHint:  'Registre a hora quando medir mais de uma vez no dia — é o que mantém as leituras separadas.',
    fieldValue:     'Valor',
    fieldUnit:      'Unidade',
    fieldNotes:     'Observações (opcional)',
    // Conexões é a porta das integrações com dispositivos (HIP-001). Aparece nas DUAS pontas.
    connectInvite:  'Conecte um dispositivo e deixe os dados entrarem sozinhos',
    connectAction:  'Conexões',
    // Editar e excluir são OBRIGATÓRIOS em todo card da plataforma (regra da fundadora) — ver `cardActions`.
    editAction:     'Editar',
    removeAction:   'Remover',

    // Atividade física (HIP-014 §3) — seção IRMÃ de Sinais vitais dentro de Monitoramento. Registra o que
    // aconteceu, sem avaliar desempenho (RDC 657): a plataforma organiza e preserva, não interpreta.
    vitalsSection:      'Sinais vitais',
    activitySection:    'Atividade física',
    activityAdd:        'Registrar atividade',
    activityEmptyTitle: 'Nenhuma atividade registrada',
    activityEmptyMsg:   'Registre um treino ou conecte um aplicativo para que entrem sozinhos.',
    fieldActivityType:  'Tipo de atividade',
    fieldActivityName:  'Nome (opcional)',
    fieldStartDate:     'Data',
    fieldStartTime:     'Início (opcional)',
    fieldDurationMin:   'Duração em minutos (opcional)',
    fieldDistanceKm:    'Distância em km (opcional)',
    // Já existiam no banco desde a migração 149 e nenhum formulário os oferecia — o conector preencheria,
    // a pessoa não. Ritmo e velocidade NÃO entram aqui: são DERIVADOS da duração e da distância, e pedi-los
    // seria pedir duas vezes a mesma informação, com risco de as duas se contradizerem.
    fieldHeartRate:     'Frequência cardíaca média (opcional)',
    fieldEnergy:        'Energia gasta em kcal (opcional)',
    paceHint:           'O ritmo é calculado sozinho a partir da duração e da distância.',
  },
  exames: {
    title:        'Exames',
    subtitle:     'Solte o laudo — a SINTERA lê e extrai os dados por você. Os resultados ficam organizados ao longo do tempo.',
    add:          'Adicionar exame realizado',
    emptyTitle:   'Nenhum exame ainda',
  },
  // Pedido é a ORIGEM do fluxo assistencial (Q1), não um detalhe do exame — e tem o seu próprio texto.
  // Antes, quem entrava por "Pedidos de exame" lia um subtítulo sobre laudos: o menu levava a um lugar e a
  // tela se apresentava como outro. No Mobile o subtítulo nem seguia a aba, e era um texto DIFERENTE do da Web
  // para a mesma tela.
  pedidos: {
    title:        'Pedidos de exame',
    subtitle:     'Guarde o pedido ou a guia — a SINTERA lê o que foi solicitado. O pedido fica registrado até o resultado chegar.',
    add:          'Adicionar pedido de exame',
    emptyTitle:   'Nenhum pedido ou solicitação',
    emptyMessage: 'Pedidos médicos e guias de convênio aparecem aqui quando você os envia.',
    listNote:     'Pedidos médicos e guias de convênio — documentos de solicitação, guardados à parte dos resultados.',
  },
  // Entrada na plataforma. IDENTIDADE — nada aqui concede acesso a dados de saúde; isso é outra camada,
  // separada de propósito (ver tests/contracts/identidade-vs-autorizacao.ARCH.test.ts).
  login: {
    googleAction:    'Continuar com Google',
    separator:       'ou',
    googleCancelled: 'Entrada cancelada.',
    googleFailed:    'Não foi possível entrar com o Google. Tente de novo ou use e-mail e senha.',
  },
  conexoes: {
    title:          'Conexões',
    subtitle:       'Conecte dispositivos e serviços de saúde para que os dados entrem sozinhos, sem digitação.',
    emptyTitle:     'Nenhuma conexão ainda',
    emptyMessage:   'Conecte um dispositivo para acompanhar seus dados automaticamente.',
    connectAction:  'Conectar',
    disconnect:     'Desconectar',
    lastSync:       'Última sincronização',

    // Health Connect (HIP-014 §5) — natureza DIFERENTE das demais conexões, e o texto precisa dizer isso:
    // não há login nem senha, a autorização vive na permissão do sistema e a pessoa a revoga por lá.
    // Nomear as fontes que chegam por dentro dele é o que torna a proposta compreensível.
    // O NOME DUPLO é obrigatório, e custou uma hora da fundadora na homologação de 30/08. O Google traduz o
    // nome do app conforme o idioma do aparelho: em português ele se chama "Saúde Connect". Ela procurou
    // "Health Connect" na Play Store, encontrou "Saúde Connect" e concluiu que era outro aplicativo — o
    // que é a conclusão razoável. Dizer os dois nomes é o que evita a próxima pessoa parar no mesmo lugar.
    hcTitle:        'Health Connect (Saúde Connect)',
    hcSubtitle:     'Traz o que já está no seu aparelho — inclusive de Strava, Oura, Garmin e outros apps que gravam nele.',
    hcAction:       'Autorizar e sincronizar',
    hcSyncing:      'Sincronizando…',
    hcUnavailable:  'Não disponível neste aparelho',
    // A versão anterior CONSTATAVA e parava aí. Na homologação de 30/08 a tela disse "não disponível" e a
    // fundadora ficou sem saber o que fazer — a mensagem estava certa e inútil. Dizer o que falta sem dizer como
    // resolver é a forma educada de deixar a pessoa sozinha.
    hcUnavailableHint: 'No Android 14 ou mais novo ele já vem instalado. Em versões anteriores, é um aplicativo gratuito da Google que precisa ser instalado pela Play Store. Na Play Store em português ele aparece como "Saúde Connect", da Google LLC — é o mesmo aplicativo. Depois de instalar, volte aqui.',
    hcInstallAction: 'Instalar (aparece como "Saúde Connect")',
    /**
     * O QUE O IPHONE VÊ. Sem esta bifurcação, quem abre a tela num iPhone recebe o roteiro inteiro do Android
     * — incluindo um botão "Instalar Saúde Connect" que leva à Play Store, que não existe no aparelho dela.
     *
     * E o texto diz o estado REAL, no presente. O aviso anterior dizia que "a integração SERÁ com o Apple
     * Saúde": futuro do verbo para uma coisa não implementada é promessa, e promessa é o que a plataforma não
     * faz. Enquanto não existir, o honesto é dizer que não existe e apontar o que existe.
     */
    hcIosTitle:     'Apple Saúde',
    hcIosHint:      'No iPhone, a SINTERA lê do Apple Saúde — o cofre do próprio aparelho, onde os aplicativos ' +
                    'que você já usa escrevem. Você autoriza uma vez, e o dado passa a entrar sem que você ' +
                    'precise pedir. A SINTERA não escreve nada lá: só lê.',
    hcIosAction:    'Autorizar e sincronizar',
    /**
     * O QUE A APPLE NÃO NOS DEIXA SABER, dito à pessoa em vez de escondido.
     *
     * Por privacidade, o iOS não informa ao aplicativo quais tipos foram RECUSADOS — um tipo negado se comporta
     * exatamente como um tipo vazio. Então a plataforma não pode dizer "você autorizou 8 de 12"; dizer isso
     * seria inventar. O que ela pode é apontar onde a pessoa confere e corrige.
     */
    hcIosRevisar:   'O iPhone não informa aos aplicativos o que foi recusado — por isso a SINTERA não consegue ' +
                    'dizer o que ficou de fora. Se algo não aparecer, confira em Ajustes → Saúde → Acesso a ' +
                    'dados e dispositivos → SINTERA.',
    hcIosVazio:     'Nada veio do Apple Saúde nesta busca. Duas causas comuns: a permissão daquele tipo não foi ' +
                    'concedida, ou nenhum aplicativo escreveu ainda. Os aplicativos passam a escrever a partir ' +
                    'do momento em que você os liga ao Apple Saúde.',
    hcDenied:       'Nenhuma permissão concedida. Você decide o que compartilhar, e pode mudar depois.',
    hcRevokeHint:   'A autorização fica no Health Connect, não aqui — é lá que você revoga quando quiser.',
  },

  /**
   * DADOS RECEBIDOS — onde a pessoa vê o que entrou sozinho, de onde veio, e decide sobre o que parece repetido.
   *
   * Existe por causa da decisão da fundadora (28/08): ela autoriza a fonte UMA VEZ e o dado entra sem perguntar,
   * mas continua podendo revisar depois. Sem esta tela, "entra sozinho" viraria "entra sem que eu saiba".
   *
   * O TOM é de INFORMAÇÃO, não de tarefa. Nada aqui exige resposta: quem não abrir a tela não perde nada, e
   * nada foi duplicado nem descartado em silêncio. Uma fila de pendências transformaria o registro de saúde numa
   * caixa de entrada, que é o oposto do que a plataforma faz pela pessoa.
   */
  dadosRecebidos: {
    title:        'Dados recebidos',
    subtitle:     'O que entrou pelas suas conexões, com a origem de cada informação. Nada aqui exige resposta — é para você conferir quando quiser.',
    emptyTitle:   'Nada recebido ainda',
    emptyMessage: 'Quando um aparelho ou aplicativo estiver conectado, o que ele registrar aparece aqui, com a origem.',
    duplicateTitle: 'Parece já estar registrado',
    // FACTUAL: descreve a semelhança, não afirma que é a mesma coisa. Quem sabe é a pessoa.
    duplicateHint:  'Encontramos algo muito parecido, vindo de outra fonte. Você decide o que fazer — e pode não fazer nada.',
    removeAction:   'Remover',
    sourceLabel:    'Origem',
  },

  /**
   * ENTRADA DE DOCUMENTO (ANEXO-001) — o mesmo rótulo em todo ponto que aceita anexo.
   *
   * O componente único já garantia o comportamento igual, mas o TEXTO estava escrito em cada arquivo. Medido em
   * 27/08: a Web dizia "Anexar arquivo" em Hábitos e "Anexar arquivos" no componente compartilhado — singular
   * de um lado, plural do outro, para a mesma ação que aceita vários arquivos.
   */
  anexo: {
    add:        'Anexar arquivos',
    // Arrastar é afordância de teclado e mouse: o texto muda porque o GESTO existe só ali. É a exceção legítima
    // da base única — mecanismo de plataforma —, e por isso mora aqui nomeada, não escrita solta na tela.
    addDrag:    'Anexar ou arrastar aqui',
    addMore:    'Adicionar mais páginas',
    sending:    'Enviando…',
    camera:     'Fotografar documento',
    formatHint: 'PDF ou imagem · vários arquivos',
    reading:    'Lendo o documento…',
    required:   'Anexe o documento.',
  },

  /**
   * FRASES COMUNS a várias telas — o que se diz quando algo falha e se pode tentar de novo.
   *
   * A família "Não foi possível…" nasceu solta: cada tela redigiu a sua, e o convite a tentar de novo saiu
   * "em instantes" na Web e "mais tarde" no aplicativo. A mensagem ESPECÍFICA continua de cada tela (dizer o que
   * falhou é informação); o que se unifica é a parte que se repete.
   */
  comum: {
    retry:          'Tente novamente.',
    retryLater:     'Tente novamente em instantes.',
    loadFailed:     'Não foi possível carregar.',
    historyFailed:  'Não foi possível carregar o histórico.',
    // Redefinir, não "recuperar": a senha antiga não volta — cria-se uma nova. A Web dizia "recuperação" e o
    // aplicativo "redefinição" para o mesmo e-mail.
    resetPassword:  'Enviar link de redefinição',
    resetSent:      'Enviamos um link de redefinição ao seu e-mail.',
  },
} as const

export type ScreenCopyKey = keyof typeof SCREEN_COPY

/**
 * Variantes PROIBIDAS por frase canônica — a mesma situação não pode
 * aparecer com nomes diferentes. Validado em copy.test.ts.
 */
export const FORBIDDEN_VARIANTS: Record<CopyKey, readonly string[]> = {
  documentSent: ['Arquivo recebido', 'Upload concluído', 'Arquivo salvo'],
  purchaseRegistered: ['Compra salva', 'Compra concluída'],
  linkGenerated: ['Link criado', 'Compartilhamento concluído'],
  imageUnreadable: ['Falha no OCR', 'Erro de processamento', 'Erro de leitura'],
  awaitingConfirmation: ['Em análise', 'Pendente de revisão'],
}

/** Acesso seguro à frase canônica (use no lugar de string literal). */
export function copy(key: CopyKey): string {
  return COPY[key]
}

/**
 * Avisos regulatórios (RDC 657/2022) CANÔNICOS — fonte única.
 * Consolidam as redações que estavam espalhadas à mão pelas telas (Web e Mobile).
 * Substância preservada das versões já vetadas (não reinterpreta a norma);
 * a redação final é decisão regulatória da fundadora. Renderizar via <Disclaimer>.
 *
 * FUNDAMENTAÇÃO (rastreabilidade): a SINTERA apenas organiza informações, SEM
 * finalidade clínica, diagnóstica ou terapêutica → não atende à definição de
 * dispositivo médico (RDC 657/2022, Art. 2º, VII) e recai na exclusão do
 * Art. 1º, § 2º, IV (reforçada pelo III) → fora do escopo como SaMD.
 * REDAÇÃO: a referência é INTEGRADA e "observa/está em consonância" com a norma —
 * nunca "em conformidade com o texto" (a RDC não prescreve o texto do aviso).
 * Enquadramento definitivo = matéria de parecer jurídico-regulatório.
 */
export const DISCLAIMERS = {
  /** Uso geral: histórico, insights, agenda, saúde, timeline E registros autorrelatados (condições, hábitos, medidas, sinais, recursos). */
  geral: 'As informações apresentadas têm caráter organizacional e não substituem a avaliação de um profissional de saúde, nem constituem diagnóstico, prescrição ou orientação clínica, observando os limites de atuação definidos pela RDC 657/2022.',
  /** Extração/reprodução de laudos laboratoriais (exames, ômica, biomarcadores). */
  laudo: 'Os dados apresentados correspondem à organização das informações contidas em seus laudos, preservando seu conteúdo original. Não constituem diagnóstico nem avaliação clínica, em consonância com o enquadramento regulatório da plataforma (RDC 657/2022).',
  /** Medicamentos e suplementos. */
  medicamento: 'A SINTERA organiza informações sobre medicamentos e suplementos. Não realiza prescrições nem fornece orientações de tratamento ou dosagem, observando os limites de atuação definidos pela RDC 657/2022.',
  /** Valores calculados/estimados (IMC). */
  estimativa: 'Os valores apresentados são calculados automaticamente a partir dos dados informados pelo usuário e possuem finalidade exclusivamente organizacional. Não substituem a avaliação de um profissional de saúde, em consonância com o enquadramento regulatório da plataforma (RDC 657/2022).',
  /** Ciclo menstrual — PRESERVA a ressalva contraceptiva (requisito regulatório específico; NÃO dobrar em outra variante). */
  ciclo: 'As estimativas são calculadas a partir das informações registradas pelo usuário e possuem finalidade exclusivamente organizacional. Não constituem método contraceptivo, diagnóstico ou orientação médica, observando os limites de atuação definidos pela RDC 657/2022.',
  /** Relatório e compartilhamento (documento que sai da plataforma → texto tailored). */
  relatorio: 'Este relatório organiza informações registradas e documentos enviados pelo usuário para facilitar o acompanhamento da sua saúde. Não substitui avaliação, diagnóstico ou conduta definidos por um profissional de saúde, em consonância com o enquadramento regulatório adotado pela plataforma (RDC 657/2022).',
} as const

export type DisclaimerVariant = keyof typeof DISCLAIMERS

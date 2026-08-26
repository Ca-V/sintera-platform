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
    hcTitle:        'Health Connect',
    hcSubtitle:     'Traz o que já está no seu aparelho — inclusive de Strava, Oura, Garmin e outros apps que gravam nele.',
    hcAction:       'Autorizar e sincronizar',
    hcSyncing:      'Sincronizando…',
    hcUnavailable:  'Não disponível neste aparelho',
    hcUnavailableHint: 'O Health Connect é do Android e precisa estar instalado. Em iPhone, a integração será com o Apple Saúde.',
    hcDenied:       'Nenhuma permissão concedida. Você decide o que compartilhar, e pode mudar depois.',
    hcRevokeHint:   'A autorização fica no Health Connect, não aqui — é lá que você revoga quando quiser.',
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

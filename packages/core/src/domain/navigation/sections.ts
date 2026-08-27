// @sintera/core — CATÁLOGO ÚNICO das seções da plataforma: quais existem, como se chamam, em que ordem e em
// que grupo aparecem, e o que cada uma faz numa frase.
//
// POR QUE ESTE ARQUIVO EXISTE. A taxonomia estava escrita em TRÊS lugares — a Sidebar da Web, o `ssotTabs.ts` do
// aplicativo e o menu de Minha Saúde. As três concordavam por disciplina, não por construção: renomear uma seção
// exigia lembrar dos três, e esquecer um deles fazia as duas pontas chamarem a mesma coisa por nomes diferentes.
// A memória do projeto já dizia "a Sidebar é a SSOT da taxonomia"; aqui isso deixa de ser combinado e passa a ser
// verdade — a Sidebar também LÊ daqui (base única, 27/08).
//
// O QUE MORA AQUI: o nome, a ordem, o agrupamento e o resumo. O que NÃO mora: ícone, rota e cor — a Web navega
// por `href`, o aplicativo por nome de rota, e cada um escolhe seu ícone. Isso é MECANISMO, e diverge por
// natureza; a decisão de QUE seções existem e como se chamam, não.
//
// REDAÇÃO DOS RESUMOS (ADR-000 · RDC 657/2022): descrevem o que a plataforma GUARDA e ORGANIZA — nunca o que ela
// concluiria a respeito. "A evolução de cada indicador, exame a exame" é fato; "o que seus exames indicam" seria
// interpretação clínica, que a SINTERA não produz.

export type SectionId =
  | 'inicio' | 'agenda'
  | 'exames' | 'pedidos' | 'documentos'
  | 'medicamentos' | 'suplementos' | 'recursos'
  | 'condicoes' | 'medidas' | 'ciclo' | 'monitoramento' | 'habitos'
  | 'historico-exames' | 'historico-saude'
  | 'rede' | 'despesas' | 'configuracoes'

export interface PlatformSection {
  readonly id: SectionId
  /** Nome exibido. O MESMO nas duas pontas — é assim que a pessoa reconhece a seção. */
  readonly label: string
  /** O que essa seção faz, numa frase. Factual: o que se guarda ali, não o que se conclui dali. */
  readonly summary: string
}

export interface SectionGroup {
  readonly id: string
  /** Título do grupo. `null` = itens de primeiro nível, sem cabeçalho. */
  readonly label: string | null
  /** Subgrupos rotulados (a Sidebar os mostra dentro de "Minha Saúde"). */
  readonly subgroups: readonly { readonly label: string | null; readonly sections: readonly PlatformSection[] }[]
}

export const PLATFORM_NAV: readonly SectionGroup[] = [
  {
    id: 'topo',
    label: null,
    subgroups: [{
      label: null,
      sections: [
        { id: 'inicio', label: 'Painel Inicial', summary: 'Seu ponto de partida: o que vem a seguir e os atalhos do dia.' },
        { id: 'agenda', label: 'Agenda', summary: 'Consultas, exames e procedimentos marcados, com lembrete de cada um.' },
      ],
    }],
  },
  {
    id: 'minha-saude',
    label: 'Minha Saúde',
    subgroups: [
      {
        // O critério do grupo cabe numa frase: aqui está o que ALGUÉM EMITIU para você.
        label: 'Documentos',
        sections: [
          { id: 'exames', label: 'Exames', summary: 'Os laudos que você recebeu, organizados e com os valores em ordem cronológica.' },
          { id: 'pedidos', label: 'Pedidos de exame', summary: 'As solicitações que deram origem a cada exame, guardadas junto do resultado.' },
          { id: 'documentos', label: 'Receitas e atestados', summary: 'Receitas, atestados, relatórios e encaminhamentos, ligados a quem os emitiu.' },
        ],
      },
      {
        // …e aqui, o que VOCÊ USA OU TOMA.
        label: 'Cuidados',
        sections: [
          { id: 'medicamentos', label: 'Medicamentos', summary: 'O que você toma, com dose, período e aviso de quando repor.' },
          { id: 'suplementos', label: 'Suplementos', summary: 'A mesma organização dos medicamentos, para o que você toma por conta própria.' },
          { id: 'recursos', label: 'Recursos de Saúde', summary: 'Óculos, aparelhos, órteses e o que mais apoia o seu dia a dia.' },
        ],
      },
      {
        label: 'Saúde',
        sections: [
          { id: 'condicoes', label: 'Condições de Saúde', summary: 'As condições registradas por você ou transcritas de um documento.' },
          { id: 'medidas', label: 'Composição Corporal', summary: 'Peso, altura, circunferência e laudos de bioimpedância ao longo do tempo.' },
          { id: 'ciclo', label: 'Ciclo e Contracepção', summary: 'Registro do ciclo menstrual e do método contraceptivo em uso.' },
          { id: 'monitoramento', label: 'Monitoramento', summary: 'Sinais vitais e atividade física — do seu registro, de um aparelho ou de um aplicativo.' },
          { id: 'habitos', label: 'Hábitos', summary: 'Sono, alimentação, atividade e o mais que você quiser acompanhar.' },
        ],
      },
      {
        label: 'Histórico',
        sections: [
          { id: 'historico-exames', label: 'Histórico de Exames', summary: 'A evolução de cada indicador, exame a exame.' },
          { id: 'historico-saude', label: 'Histórico de Saúde', summary: 'Sua linha do tempo: tudo o que foi registrado, em ordem.' },
        ],
      },
    ],
  },
  {
    id: 'rodape',
    label: null,
    subgroups: [{
      label: null,
      sections: [
        { id: 'rede', label: 'Rede de Cuidado', summary: 'Reúna suas informações num relatório e compartilhe com quem cuida de você.' },
        { id: 'despesas', label: 'Despesas', summary: 'O que cada consulta, exame ou medicamento custou.' },
        { id: 'configuracoes', label: 'Configurações', summary: 'Como você quer ser avisada, seus dados e sua conta.' },
      ],
    }],
  },
]

/** Todas as seções, na ordem em que aparecem. */
export function allSections(): readonly PlatformSection[] {
  return PLATFORM_NAV.flatMap(g => g.subgroups.flatMap(s => s.sections))
}

const POR_ID = new Map<string, PlatformSection>(allSections().map(s => [s.id, s]))

/** Rótulo de uma seção. Desconhecido devolve `null` — o modelo é aberto, degrada e não quebra. */
export function sectionLabel(id: string | null | undefined): string | null {
  return POR_ID.get((id ?? '').trim())?.label ?? null
}

/** Resumo de uma seção, para menus que explicam o que cada destino faz. */
export function sectionSummary(id: string | null | undefined): string | null {
  return POR_ID.get((id ?? '').trim())?.summary ?? null
}

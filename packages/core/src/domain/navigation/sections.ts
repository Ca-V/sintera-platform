// @sintera/core — CATÁLOGO ÚNICO das seções da plataforma: quais existem, como se chamam, em que ordem e em
// que grupo aparecem, o que cada uma faz numa frase, e por que palavras a pessoa as procura.
//
// POR QUE ESTE ARQUIVO EXISTE. A taxonomia estava escrita em TRÊS lugares — a Sidebar da Web, o `ssotTabs.ts` do
// aplicativo e o menu de Minha Saúde. As três concordavam por disciplina, não por construção: renomear uma seção
// exigia lembrar dos três, e esquecer um deles fazia as duas pontas chamarem a mesma coisa por nomes diferentes.
// A memória do projeto já dizia "a Sidebar é a SSOT da taxonomia"; aqui isso deixa de ser combinado e passa a ser
// verdade — a Sidebar também LÊ daqui (base única, 27/08).
//
// O QUE MORA AQUI: o nome, a ordem, o agrupamento, o resumo e os termos de busca. O que NÃO mora: ícone, rota e
// cor — a Web navega por `href`, o aplicativo por nome de rota, e cada um escolhe seu ícone. Isso é MECANISMO, e
// diverge por natureza; a decisão de QUE seções existem e como se chamam, não.
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
  /**
   * Palavras pelas quais a pessoa PROCURA esta seção — não sinônimos do nome, mas o que ela tem na cabeça.
   *
   * Quem quer registrar a pressão digita "pressão", não "monitoramento". Quem procura o remédio digita
   * "remédio", não "medicamento". A busca falha quando exige o vocabulário do produto; estes termos são a
   * ponte entre a palavra da pessoa e o nome da seção.
   */
  readonly keywords: readonly string[]
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
        {
          id: 'inicio', label: 'Painel Inicial',
          summary: 'Seu ponto de partida: o que vem a seguir e os atalhos do dia.',
          keywords: ['início', 'home', 'painel', 'principal'],
        },
        {
          id: 'agenda', label: 'Agenda',
          summary: 'Consultas, exames e procedimentos marcados, com lembrete de cada um.',
          keywords: ['consulta', 'marcar', 'agendar', 'compromisso', 'lembrete', 'calendário', 'médico', 'retorno', 'vacina', 'procedimento'],
        },
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
          {
            id: 'exames', label: 'Exames',
            summary: 'Os laudos que você recebeu, organizados e com os valores em ordem cronológica.',
            keywords: ['exame', 'laudo', 'resultado', 'sangue', 'hemograma', 'ultrassom', 'raio-x', 'laboratório', 'indicador', 'biomarcador'],
          },
          {
            id: 'pedidos', label: 'Pedidos de exame',
            summary: 'As solicitações que deram origem a cada exame, guardadas junto do resultado.',
            keywords: ['pedido', 'solicitação', 'guia', 'requisição', 'encaminhado para exame', 'convênio'],
          },
          {
            id: 'documentos', label: 'Receitas e atestados',
            summary: 'Receitas, atestados, relatórios e encaminhamentos, ligados a quem os emitiu.',
            keywords: ['receita', 'atestado', 'relatório', 'encaminhamento', 'prescrição', 'documento', 'laudo médico'],
          },
        ],
      },
      {
        // …e aqui, o que VOCÊ USA OU TOMA.
        label: 'Cuidados',
        sections: [
          {
            id: 'medicamentos', label: 'Medicamentos',
            summary: 'O que você toma, com dose, período e aviso de quando repor.',
            keywords: ['remédio', 'medicamento', 'dose', 'comprimido', 'tomar', 'farmácia', 'recomprar', 'antibiótico'],
          },
          {
            id: 'suplementos', label: 'Suplementos',
            summary: 'A mesma organização dos medicamentos, para o que você toma por conta própria.',
            keywords: ['suplemento', 'vitamina', 'ômega', 'creatina', 'proteína', 'colágeno', 'mineral'],
          },
          {
            id: 'recursos', label: 'Recursos de Saúde',
            summary: 'Óculos, aparelhos, órteses e o que mais apoia o seu dia a dia.',
            keywords: ['óculos', 'lente', 'aparelho', 'órtese', 'prótese', 'palmilha', 'muleta', 'auditivo'],
          },
        ],
      },
      {
        label: 'Saúde',
        sections: [
          {
            id: 'condicoes', label: 'Condições de Saúde',
            summary: 'As condições registradas por você ou transcritas de um documento.',
            keywords: ['condição', 'diagnóstico', 'doença', 'alergia', 'crônica', 'histórico familiar'],
          },
          {
            id: 'medidas', label: 'Composição Corporal',
            summary: 'Peso, altura, circunferência e laudos de bioimpedância ao longo do tempo.',
            keywords: ['peso', 'altura', 'imc', 'bioimpedância', 'gordura', 'massa muscular', 'cintura', 'emagrecer', 'balança'],
          },
          {
            id: 'ciclo', label: 'Ciclo e Contracepção',
            summary: 'Registro do ciclo menstrual e do método contraceptivo em uso.',
            keywords: ['menstruação', 'ciclo', 'anticoncepcional', 'contracepção', 'diu', 'período', 'regra', 'tpm'],
          },
          {
            id: 'monitoramento', label: 'Monitoramento',
            summary: 'Sinais vitais, atividade física e rotina — do seu registro, de um aparelho ou de um app.',
            // 'rotina', 'meta', 'musculação', 'treino' e 'academia' entraram aqui em 31/08/2026, quando
            // atividade física passou a ter um endereço só. Sem isso, quem busca "rotina" continuaria caindo
            // em Hábitos, onde o campo já não existe.
            keywords: ['pressão', 'pressão arterial', 'glicemia', 'glicose', 'frequência cardíaca', 'batimento', 'saturação', 'temperatura', 'febre', 'sinal vital', 'atividade física', 'exercício', 'treino', 'academia', 'musculação', 'rotina', 'meta', 'corrida', 'caminhada', 'ciclismo', 'passos', 'strava', 'garmin', 'oura', 'relógio', 'wearable', 'conexões', 'health connect'],
          },
          {
            id: 'habitos', label: 'Hábitos',
            // "atividade" SAIU deste resumo e destas palavras: desde 31/08/2026 ela mora em Monitoramento, e
            // quem busca "atividade física" ou "rotina" precisa chegar LÁ. Uma busca que leva à tela errada é
            // pior do que uma busca que não encontra — manda a pessoa procurar um campo que não existe mais.
            summary: 'Sono, alimentação, hidratação, álcool e tabagismo — o que você quiser acompanhar.',
            keywords: ['hábito', 'sono', 'dormir', 'alimentação', 'água', 'hidratação', 'álcool', 'tabagismo', 'cigarro'],
          },
        ],
      },
      {
        label: 'Histórico',
        sections: [
          {
            id: 'historico-exames', label: 'Histórico de Exames',
            summary: 'A evolução de cada indicador, exame a exame.',
            keywords: ['evolução', 'comparar exames', 'gráfico', 'indicador ao longo do tempo', 'tendência'],
          },
          {
            id: 'historico-saude', label: 'Histórico de Saúde',
            summary: 'Sua linha do tempo: tudo o que foi registrado, em ordem.',
            keywords: ['linha do tempo', 'histórico', 'timeline', 'passado', 'tudo o que aconteceu'],
          },
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
        {
          id: 'rede', label: 'Rede de Cuidado',
          summary: 'Reúna suas informações num relatório e compartilhe com quem cuida de você.',
          keywords: ['relatório', 'compartilhar', 'enviar para o médico', 'rede', 'cuidador', 'família', 'link'],
        },
        {
          id: 'despesas', label: 'Despesas',
          summary: 'O que cada consulta, exame ou medicamento custou.',
          keywords: ['gasto', 'despesa', 'custo', 'valor', 'nota fiscal', 'reembolso', 'imposto de renda', 'plano'],
        },
        {
          id: 'configuracoes', label: 'Configurações',
          summary: 'Como você quer ser avisada, seus dados e sua conta.',
          keywords: ['configuração', 'ajuste', 'notificação', 'aviso', 'senha', 'conta', 'sair', 'privacidade', 'excluir conta', 'perfil'],
        },
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

/**
 * Normaliza para comparar: sem acento, sem caixa, sem espaço sobrando.
 *
 * Quem digita no celular escreve "pressao" e "glicemia" sem acento, com pressa. Exigir a grafia exata faria a
 * busca falhar justamente para quem tem mais pressa.
 */
function normalizar(s: string): string {
  // O intervalo é escrito ESCAPADO de propósito: os sinais combinantes são invisíveis no editor, e um arquivo
  // que passe por uma conversão de codificação os perderia sem ninguém notar — a busca deixaria de casar
  // "pressao" com "pressão" e ninguém saberia por quê.
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

export interface SectionMatch {
  readonly section: PlatformSection
  /** Menor é melhor. Só para ordenar — não é para ser exibido. */
  readonly rank: number
}

/**
 * Procura seções por qualquer palavra que a pessoa escreva.
 *
 * A ORDEM dos resultados segue o quanto o acerto é direto:
 *   0 — o nome da seção começa com o que foi digitado ("mon" → Monitoramento)
 *   1 — um termo de busca começa com o que foi digitado ("press" → Monitoramento, por "pressão")
 *   2 — o nome contém em algum lugar
 *   3 — um termo contém
 *   4 — o resumo contém (o mais fraco: casa por palavra solta, e serve de rede)
 *
 * Consulta vazia devolve lista vazia, e não "tudo": a tela decide mostrar o menu inteiro quando não há busca.
 * Devolver tudo aqui faria "nenhum resultado" e "não busquei nada" parecerem a mesma coisa.
 */
export function searchSections(query: string): readonly SectionMatch[] {
  const q = normalizar(query ?? '')
  if (q.length < 2) return []

  const achados: SectionMatch[] = []
  for (const section of allSections()) {
    const label = normalizar(section.label)
    const termos = section.keywords.map(normalizar)
    const resumo = normalizar(section.summary)

    let rank = -1
    if (label.startsWith(q)) rank = 0
    else if (termos.some(t => t.startsWith(q))) rank = 1
    else if (label.includes(q)) rank = 2
    else if (termos.some(t => t.includes(q))) rank = 3
    else if (resumo.includes(q)) rank = 4

    if (rank >= 0) achados.push({ section, rank })
  }

  // Empate resolvido pela ordem do catálogo — determinístico, para a mesma busca dar sempre a mesma lista.
  const ordem = new Map(allSections().map((s, i) => [s.id, i]))
  return achados.sort((a, b) => a.rank - b.rank || (ordem.get(a.section.id)! - ordem.get(b.section.id)!))
}

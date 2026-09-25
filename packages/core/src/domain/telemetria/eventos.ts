// @sintera/core — VAL-001 §4: os eventos que o portão de decisão precisa.
//
// ============================================================================================
// POR QUE OS NOMES VIVEM AQUI, E NÃO EM CADA TELA
// ============================================================================================
// Retenção não se mede para trás. O que não for registrado no dia não existe depois — e o portão da §46
// decide se a SINTERA escala ou para. Se Web e aplicativo emitirem `primeiro_valor` numa ponta e
// `first_value` na outra, a série histórica nasce partida, e isso não se conserta com migração: os eventos
// que faltaram, faltaram.
//
// Por isso o nome é DECISÃO, não detalhe de implementação. Mora no core, como a taxonomia da sidebar.
//
// ============================================================================================
// O QUE `metadata` NUNCA PODE CARREGAR
// ============================================================================================
// Nenhum dado de saúde. Nem valor de exame, nem nome de condição, nem medida, nem medicamento.
//
// `usage_events.metadata` é `jsonb` livre, sem validação no banco — a disciplina precisa ser explícita e
// testada, senão o primeiro "só para facilitar a análise" põe glicemia numa tabela de telemetria de produto,
// que tem outra finalidade, outra retenção e outra base legal.

/** Ciclo de vida da pessoa na plataforma. */
export const EVENTOS_CICLO = [
  'cadastro_concluido',
  'onboarding_concluido',
  /**
   * O evento mais importante do conjunto, e o que mais se presta a interpretação frouxa. Definição ÚNICA:
   * **a pessoa viu dado próprio dela organizado** — um exame extraído, ou uma medida registrada e vista na
   * linha do tempo. Não é abrir a plataforma; não é cadastrar. É ver o próprio dado de volta.
   */
  'primeiro_valor',
  'sessao_iniciada',
] as const

/** Rede de Cuidado (CARE-003). */
export const EVENTOS_VINCULO = [
  'convite_enviado',
  'convite_aceito',
  'convite_recusado',
  'vinculo_criado',
  'vinculo_revogado',
  'documento_proposto',
  'documento_aceito',
  'documento_recusado',
] as const

/** Comercial (BILLING-003). */
export const EVENTOS_COMERCIAL = [
  'plano_visualizado',
  'checkout_iniciado',
  'assinatura_criada',
  'assinatura_cancelada',
  'pagamento_falhou',
] as const

/** Entrada de dados. */
export const EVENTOS_DADOS = [
  'conexao_iniciada',
  'conexao_concluida',
  'conexao_falhou',
  'documento_proprio_enviado',
] as const

/** Experimento (VAL-001 §2.1, mitigação 4). Gravado no cadastro, uma vez. */
export const EVENTOS_COORTE = ['coorte_atribuida'] as const

/** Os que já existiam antes do VAL-001. Ficam para não quebrar a série histórica que já corre. */
export const EVENTOS_LEGADOS = [
  'exam_analyzed_success',
  'exam_detail_viewed',
  'feedback_submitted',
  'perfil_segmentacao',
  'problema_reportado',
] as const

export const EVENTOS: readonly string[] = [
  ...EVENTOS_CICLO, ...EVENTOS_VINCULO, ...EVENTOS_COMERCIAL,
  ...EVENTOS_DADOS, ...EVENTOS_COORTE, ...EVENTOS_LEGADOS,
]

export type NomeDeEvento = typeof EVENTOS_CICLO[number] | typeof EVENTOS_VINCULO[number]
  | typeof EVENTOS_COMERCIAL[number] | typeof EVENTOS_DADOS[number]
  | typeof EVENTOS_COORTE[number] | typeof EVENTOS_LEGADOS[number]

export function ehEventoConhecido(nome: string): nome is NomeDeEvento {
  return EVENTOS.includes(nome)
}

/**
 * Chaves proibidas em `metadata`. Lista de CLASSES, não exaustiva (Modelo Aberto): qualquer coisa que
 * descreva resultado, condição, medida, medicamento ou motivo clínico está fora.
 */
export const METADATA_PROIBIDA: readonly string[] = [
  'exame', 'exam', 'biomarcador', 'biomarker', 'resultado', 'result', 'valor', 'value',
  'diagnostico', 'diagnosis', 'condicao', 'condition', 'medicamento', 'medication',
  'peso', 'weight', 'medida', 'measure', 'laudo', 'sintoma', 'glicemia', 'pressao',
]

/** Chaves que a análise precisa e que não descrevem saúde. Tudo fora daqui é suspeito por padrão. */
export const METADATA_PERMITIDA: readonly string[] = [
  'origem', 'plataforma', 'plano', 'escopo', 'direcao', 'motivo', 'coorte',
  'dias_desde_cadastro', 'quantidade', 'fonte', 'modulo', 'canal', 'versao',
]

export interface ProblemaDeMetadata {
  readonly chave: string
  readonly porque: string
}

/**
 * Verifica `metadata` antes de sair. Devolve os problemas; vazio quando está limpo.
 *
 * Não lança e não corrige: a telemetria nunca deve quebrar a tela, e silenciar um dado indevido apagando-o
 * esconderia o defeito de quem o escreveu. Quem chama decide — e a catraca de teste é quem impede que chegue
 * a produção.
 */
export function problemasNoMetadata(metadata: Record<string, unknown> | null | undefined): ProblemaDeMetadata[] {
  if (!metadata) return []
  const problemas: ProblemaDeMetadata[] = []
  for (const chave of Object.keys(metadata)) {
    const k = chave.toLowerCase()
    const proibida = METADATA_PROIBIDA.find(p => k === p || k.startsWith(p + '_') || k.endsWith('_' + p))
    if (proibida) {
      problemas.push({ chave, porque: `"${proibida}" descreve saúde; telemetria de produto não é lugar para isso` })
      continue
    }
    if (!METADATA_PERMITIDA.includes(k)) {
      problemas.push({ chave, porque: 'chave fora da lista conhecida — acrescente-a a METADATA_PERMITIDA se for legítima' })
    }
  }
  return problemas
}

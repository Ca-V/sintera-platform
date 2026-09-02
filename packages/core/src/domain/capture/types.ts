// @sintera/core — Captura de documentos (HUB-001): CONTRATOS PUROS (sem React, sem Supabase, sem IO).
// Fonte ÚNICA Web↔Mobile. As implementações (processadores/pipeline) e o contexto (SupabaseClient/File) vivem
// na camada de plataforma; aqui ficam só os tipos de domínio que as duas pontas compartilham.

/**
 * O que a pessoa deseja adicionar (intenção) + o que a CLASSIFICAÇÃO identifica no documento.
 *
 * `clinical_document` e `medical_order` entraram na homologação de 25/08, quando passaram a ter consumidor: a
 * fundadora marcou "Receita", anexou um pedido de exame e um laudo, e os dois foram gravados como receita. Sem
 * esses dois valores, a classificação não tinha como dizer que o documento era outra coisa — para ela, pedido
 * e laudo eram ambos "exam", e receita/atestado eram "other".
 *
 * Antes disso `clinical_document` esteve aqui por dois commits e foi REMOVIDO justamente por não ter quem o
 * produzisse. Voltou junto com quem o produz e quem o consome.
 */
export const DOCUMENT_KINDS = [
  'exam',
  'medical_order',
  'medication_label',
  'eyeglass_prescription',
  'omics',
  'clinical_document',
  'other',
  'unknown',
] as const

/** Derivado do catálogo acima — a lista em runtime e o tipo têm UM dono só (ADR-023). */
export type DocumentKind = typeof DOCUMENT_KINDS[number]

/** Como a pessoa deseja enviar (método de entrada). */
export type IntakeMethod = 'pdf' | 'photo' | 'gallery'

/** De onde veio a classificação — debug · métricas · auditoria. */
export type ClassificationSource = 'filename' | 'mime' | 'signature' | 'content_ai' | 'none'

/** Resultado FACTUAL da classificação — a UI mostra e pede confirmação. */
export interface ClassificationResult {
  kind: DocumentKind
  confidence: 'high' | 'medium' | 'low'
  reason?: string
  subtype?: string
  source?: ClassificationSource
  /**
   * Fatos DOCUMENTAIS transcritos do papel, para preencher o formulário e a pessoa REVISAR (ANEXO-001).
   * Transcrição, jamais inferência: quem assinou e a data que está escrita ali — não quem "deve ter" assinado
   * nem quando "provavelmente" foi emitido. Nada aqui é conteúdo clínico (RDC 657).
   */
  issuer?: string
  /**
   * O PROFISSIONAL e a INSTITUIÇÃO, transcritos SEPARADAMENTE.
   *
   * Antes o modelo é que escolhia qual dos dois era "o emissor" — e num atestado da homologação de 30/08 ele
   * escolheu a clínica, deixando o médico de fora para sempre. Transcrever os dois é dele; DECIDIR qual
   * aparece na frente é da plataforma, onde a regra é uma só e testável (`documentPrimaryName`).
   *
   * `issuer` continua existindo e recebe o nome principal — nada que já o consome quebra.
   */
  professional?: string
  institution?: string
  /** Data do documento em ISO (AAAA-MM-DD), quando escrita de forma inequívoca. */
  docDate?: string
  /**
   * O que a RECEITA prescreve, transcrito do papel — "Losartana 50mg", como está escrito.
   *
   * Pedido da fundadora (30/08): uma receita identificada só por médico e data obriga a abrir o arquivo para
   * saber do que se trata, que é justamente o trabalho que a plataforma existe para poupar.
   *
   * Continua sendo TRANSCRIÇÃO: copia o nome e a concentração escritos. Não diz para que serve, não avalia a
   * dose, não inclui posologia — a fronteira da RDC 657 permanece onde estava.
   */
  items?: string[]
}

/** Motivo de erro NORMALIZADO (o Hub traduz qualquer falha de pipeline para isto). */
export type CaptureErrorReason = 'unreadable' | 'protected' | 'incompatible' | 'temporary' | 'unknown'

/** CONTRATO ÚNICO de retorno — todo processador devolve isto; o Hub só renderiza. */
export interface CaptureResult {
  status: 'success' | 'forwarded' | 'error'
  kind: DocumentKind
  /** Título unificado ("Exame criado", "Documento encaminhado", "Não foi possível processar"). */
  title: string
  /** Detalhe factual para a pessoa. */
  message: string
  /** Rótulo da próxima ação ("Abrir exame", "Continuar"). */
  nextActionLabel?: string
  /** Destino da próxima ação (rota resolvida pela plataforma). */
  nextHref?: string
  /** Id da entidade criada (quando houver). */
  entityId?: string
  /** Preenchido quando status='error'. */
  errorReason?: CaptureErrorReason
}

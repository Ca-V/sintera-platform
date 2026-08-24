// @sintera/core — Captura de documentos (HUB-001): CONTRATOS PUROS (sem React, sem Supabase, sem IO).
// Fonte ÚNICA Web↔Mobile. As implementações (processadores/pipeline) e o contexto (SupabaseClient/File) vivem
// na camada de plataforma; aqui ficam só os tipos de domínio que as duas pontas compartilham.

/**
 * O que a pessoa deseja adicionar (intenção) + classificações auxiliares.
 *
 * `clinical_document` (DOC-002) cobre atestado · relatório · encaminhamento · outros documentos clínicos.
 * Sem ele, a intenção "Atestado, relatório ou encaminhamento" do Hub chegava à etapa de classificação e só
 * encontrava kinds que não eram o que a pessoa escolheu — a categoria não se perdia por defeito, nunca teve
 * para onde ir. O SUBTIPO (atestado/relatório/encaminhamento/outro) é perguntado depois do anexo e vive em
 * `DOCUMENT_SUBTYPES`, no domínio de Documentos: aqui fica só a natureza do documento.
 */
export const DOCUMENT_KINDS = [
  'exam',
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

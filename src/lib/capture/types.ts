// ============================================================
// Centro de Entrada de Documentos — CONTRATOS (Trilha B, sem domínio)
// ============================================================
// Camadas isoladas (PO 30/06):
//   Documento → Intake (UX) → Classifier (identifica) → Processor (encaminha) → Pipeline
// Esta camada NÃO cria evento, NÃO escreve catálogo, NÃO decide domínio (Estado 2).
// CONTRATO ÚNICO: todo processador devolve um CaptureResult; o Hub só renderiza —
// estados, resultado e erro ficam UNIFORMES, independentemente do pipeline.
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js'

/** O que a usuária deseja adicionar (intenção) + classificações auxiliares. */
export type DocumentKind =
  | 'exam'
  | 'medication_label'
  | 'eyeglass_prescription'
  | 'omics'
  | 'other'
  | 'unknown'

/** Como a usuária deseja enviar (método de entrada). */
export type IntakeMethod = 'pdf' | 'photo' | 'gallery'

/** Resultado FACTUAL da classificação — a UI mostra e pede confirmação. */
export interface ClassificationResult {
  kind: DocumentKind
  confidence: 'high' | 'medium' | 'low'
  reason?: string
  /** Subtipo curto quando evidente (ex.: 'hemograma', 'bula', 'receita', 'omica'). */
  subtype?: string
}

/** Motivo de erro NORMALIZADO (o Hub traduz qualquer falha de pipeline para isto). */
export type CaptureErrorReason = 'unreadable' | 'protected' | 'incompatible' | 'temporary' | 'unknown'

/** Contexto passado aos processadores (sem acoplar a React). */
export interface CaptureContext {
  supabase: SupabaseClient
  userId: string
}

/** CONTRATO ÚNICO de retorno — todo processador devolve isto; o Hub só renderiza. */
export interface CaptureResult {
  status: 'success' | 'forwarded' | 'error'
  kind: DocumentKind
  /** Título unificado ("Exame criado", "Documento encaminhado", "Não foi possível processar"). */
  title: string
  /** Detalhe factual para a usuária. */
  message: string
  /** Rótulo da próxima ação ("Abrir exame", "Continuar"). */
  nextActionLabel?: string
  /** Destino da próxima ação. */
  nextHref?: string
  /** Id da entidade criada (quando houver). */
  entityId?: string
  /** Preenchido quando status='error'. */
  errorReason?: CaptureErrorReason
}

/**
 * Contrato de um processador de documento. O Intake conversa SÓ com esta interface;
 * cada processador encaminha para o pipeline EXISTENTE (sem alterá-lo) e devolve o
 * CaptureResult único.
 */
export interface DocumentProcessor {
  kind: Exclude<DocumentKind, 'unknown' | 'other'>
  label: string
  icon: string
  accepts: string[]
  target: string
  confirmPhrase: string
  /** Processa/encaminha o arquivo e devolve o CONTRATO ÚNICO. */
  process(file: File, ctx: CaptureContext): Promise<CaptureResult>
}

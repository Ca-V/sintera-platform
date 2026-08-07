// ============================================================
// Centro de Entrada de Documentos — CONTRATOS (Trilha B)
// ============================================================
// Os contratos PUROS (DocumentKind, IntakeMethod, ClassificationResult, CaptureResult…) vivem em @sintera/core
// (SSOT Web↔Mobile) e são reexportados aqui para preservar os import sites. O que depende de plataforma
// (SupabaseClient/File) — CaptureContext e DocumentProcessor — permanece nesta camada.
import type { SupabaseClient } from '@supabase/supabase-js'
import type { DocumentKind, CaptureResult } from '@sintera/core'

export type {
  DocumentKind, IntakeMethod, ClassificationSource, ClassificationResult, CaptureErrorReason, CaptureResult,
} from '@sintera/core'

/** Contexto passado aos processadores (acopla à plataforma — Supabase). */
export interface CaptureContext {
  supabase: SupabaseClient
  userId: string
}

/**
 * Contrato de um processador de documento. O Intake conversa SÓ com esta interface;
 * cada processador encaminha para o pipeline EXISTENTE (sem alterá-lo) e devolve o
 * CaptureResult único (do core).
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

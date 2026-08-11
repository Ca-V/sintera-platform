// @sintera/core — ESTADO DE PROCESSAMENTO do exame → rótulo + tom (FONTE ÚNICA Web+Mobile). O banco guarda códigos
// abertos (pending/processing/processed/error/…); a UI NUNCA os exibe crus. GENÉRICO por ESTADO (não por tipo de
// exame) e FACTUAL (REG-001): fala do processamento do DOCUMENTO, não interpreta resultado clínico. Puro/testável.
//
// Causa C1: antes Web (STATUS_CONFIG) e Mobile (examStatus.ts) tinham modelos SEPARADOS e divergentes (pending
// virava "Processando" no Mobile e "Aguardando" na Web; erro tinha textos diferentes). Aqui há UM modelo; cada
// plataforma mapeia o `tone` semântico para suas cores/ícones do Design System.

export type ExamProcessingState = 'pending' | 'processing' | 'ready' | 'failed' | 'none'

/** Tom SEMÂNTICO do estado (a plataforma traduz para cor/ícone do seu DS — nada de cor aqui). */
export type ExamStateTone = 'success' | 'info' | 'attention' | 'error' | 'neutral'

/** Código de status (aberto) → estado de UI. Desconhecido → 'processing' (Modelo Aberto: status novo do backend
 *  NUNCA vira "erro" na tela). Vazio/nulo → 'none' (sem linha de situação). */
export function examProcessingState(status: string | null | undefined): ExamProcessingState {
  switch (status) {
    case 'processed': return 'ready'
    case 'error':
    case 'failed': return 'failed'
    case 'pending': return 'pending'
    case 'processing': return 'processing'
    case null:
    case undefined:
    case '': return 'none'
    default: return 'processing'
  }
}

/** Rótulo curto do estado. `null` = não mostrar linha de situação ('ready'/'none' — o selo de completude cobre 'ready'). */
export const EXAM_STATE_LABEL: Record<ExamProcessingState, string | null> = {
  pending: 'Aguardando',
  processing: 'Processando',
  ready: null,
  failed: 'Não foi possível ler o documento',
  none: null,
}

export const EXAM_STATE_TONE: Record<ExamProcessingState, ExamStateTone> = {
  pending: 'attention',
  processing: 'info',
  ready: 'success',
  failed: 'error',
  none: 'neutral',
}

/** Rótulo curto para exibição (ou null quando não há linha de situação). */
export function examStatusLabel(status: string | null | undefined): string | null {
  return EXAM_STATE_LABEL[examProcessingState(status)]
}

/** Selo de COMPLETUDE do exame PROCESSADO (CEF): 'document_only' → só documento; senão → resultados estruturados. */
export function examCompletenessLabel(extractionCompleteness: string | null | undefined): string {
  return extractionCompleteness === 'document_only' ? 'Documento disponível' : 'Resultados estruturados'
}

export const isExamProcessing = (s: string | null | undefined) => examProcessingState(s) === 'processing' || examProcessingState(s) === 'pending'
export const isExamFailed = (s: string | null | undefined) => examProcessingState(s) === 'failed'
export const isExamReady = (s: string | null | undefined) => examProcessingState(s) === 'ready'

/** Rótulo do botão de extração conforme o estado (falhou → "Tentar novamente"; senão → "Extrair dados"). SSOT. */
export function examAnalyzeLabel(status: string | null | undefined): string {
  return isExamFailed(status) ? 'Tentar novamente' : 'Extrair dados'
}

// ── Filtro de status na LISTA (FONTE ÚNICA das opções + do casamento; consumidores não redefinem rótulos) ──
export type ExamStatusFilter = 'all' | 'processed' | 'pending' | 'error'
export const EXAM_STATUS_FILTER_OPTIONS: { value: ExamStatusFilter; label: string }[] = [
  { value: 'all',       label: 'Todos os status' },
  { value: 'processed', label: 'Dados extraídos' },
  { value: 'pending',   label: 'Aguardando' },
  { value: 'error',     label: 'Com erro' },
]
/** Bucket do exame para o filtro (agrupa pending+processing em "pending"; failed em "error"). */
export function examStatusFilterBucket(status: string | null | undefined): Exclude<ExamStatusFilter, 'all'> {
  const st = examProcessingState(status)
  if (st === 'ready') return 'processed'
  if (st === 'failed') return 'error'
  return 'pending'
}
/** O exame passa pelo filtro selecionado? */
export function matchesExamStatusFilter(status: string | null | undefined, filter: ExamStatusFilter): boolean {
  return filter === 'all' || examStatusFilterBucket(status) === filter
}

// Estado de PROCESSAMENTO do exame → rótulo amigável. O banco guarda códigos (pending/processing/processed/
// error/…); a UI nunca deve exibi-los crus. GENÉRICO por ESTADO (não por tipo de exame) e FACTUAL (REG-001):
// fala do processamento do DOCUMENTO, não interpreta resultado clínico. Puro/testável.

export type ExamProcessingState = 'processing' | 'ready' | 'failed' | 'none'

/** Mapeia o código de status (aberto) para um estado de UI. Desconhecido → 'processing' (degrada sem quebrar —
 *  Modelo Aberto: um status novo do backend não deve virar "erro" na tela). */
export function examProcessingState(status: string | null | undefined): ExamProcessingState {
  switch (status) {
    case 'processed':
      return 'ready'
    case 'error':
      return 'failed'
    case 'pending':
    case 'processing':
      return 'processing'
    case null:
    case undefined:
    case '':
      return 'none'
    default:
      return 'processing' // status desconhecido: trata como "em andamento", não como erro
  }
}

/** Rótulo curto para exibição. `null` = não mostrar linha de situação (estado normal "pronto"/sem status). */
export function examStatusLabel(status: string | null | undefined): string | null {
  switch (examProcessingState(status)) {
    case 'processing':
      return 'Processando…'
    case 'failed':
      return 'Não foi possível ler o documento'
    case 'ready':
    case 'none':
      return null
  }
}

export const isExamProcessing = (s: string | null | undefined) => examProcessingState(s) === 'processing'
export const isExamFailed = (s: string | null | undefined) => examProcessingState(s) === 'failed'

// Estado de PROCESSAMENTO do exame → rótulo/tom. FONTE ÚNICA movida para `@sintera/core`
// (domain/exams/processingStatus) — Causa C1 (antes Web e Mobile tinham modelos separados/divergentes).
// Este módulo só re-exporta, mantendo o caminho de import estável nas telas do Mobile.
export {
  type ExamProcessingState, type ExamStateTone,
  examProcessingState, EXAM_STATE_LABEL, EXAM_STATE_TONE, examStatusLabel, examCompletenessLabel,
  isExamProcessing, isExamFailed,
} from '@sintera/core'

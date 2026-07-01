// ============================================================
// Centro de Entrada — REGISTRO de processadores (fonte única)
// ============================================================
// Agrega os processadores isolados (processors/*). Adicionar um novo tipo (vacina,
// DICOM, receita veterinária…) = um arquivo em processors/ + uma linha aqui, sem
// tocar o Intake nem os pipelines existentes.
// ============================================================

import type { DocumentKind, DocumentProcessor } from './types'
import { examProcessor } from './processors/exam'
import { medicationProcessor } from './processors/medication'
import { eyeglassProcessor } from './processors/eyeglass'
import { omicsProcessor } from './processors/omics'

export const CAPTURE_PROCESSORS: DocumentProcessor[] = [
  examProcessor,
  medicationProcessor,
  eyeglassProcessor,
  omicsProcessor,
]

/** Processador de um tipo (null para unknown/other ou tipo não registrado). */
export function processorFor(kind: DocumentKind): DocumentProcessor | null {
  return CAPTURE_PROCESSORS.find(p => p.kind === kind) ?? null
}

/** Processadores que aceitam um dado MIME (para validar a entrada). */
export function processorsAccepting(mime: string): DocumentProcessor[] {
  return CAPTURE_PROCESSORS.filter(p => p.accepts.includes(mime))
}

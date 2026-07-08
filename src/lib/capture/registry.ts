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

// Centro de Captura pela ótica da usuária — 3 categorias naturais (Exame · Receita de
// medicamento ou suplemento · Recursos de Saúde). "Exame ômico" NÃO é exposto: para a
// usuária, ômica é um exame; um documento de ômica é capturado como Exame e a
// diferenciação fina acontece depois/no módulo de Exames (classificação = escopo CAP-001).
// O processador omics.ts permanece no repositório (reativável), fora desta lista.
export const CAPTURE_PROCESSORS: DocumentProcessor[] = [
  examProcessor,
  medicationProcessor,
  eyeglassProcessor,
]

/** Processador de um tipo (null para unknown/other ou tipo não registrado). */
export function processorFor(kind: DocumentKind): DocumentProcessor | null {
  return CAPTURE_PROCESSORS.find(p => p.kind === kind) ?? null
}

/** Processadores que aceitam um dado MIME (para validar a entrada). */
export function processorsAccepting(mime: string): DocumentProcessor[] {
  return CAPTURE_PROCESSORS.filter(p => p.accepts.includes(mime))
}

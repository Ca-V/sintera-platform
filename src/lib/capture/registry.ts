// ============================================================
// Centro de Entrada — REGISTRO de processadores (fonte única)
// ============================================================
// Cada tipo de documento → seu processador, que aponta para o pipeline EXISTENTE.
// Adicionar um novo tipo (vacina, DICOM, receita veterinária…) = uma linha aqui,
// sem mexer no orquestrador. Nenhum pipeline atual é alterado.
// ============================================================

import type { DocumentKind, DocumentProcessor } from './types'

export const CAPTURE_PROCESSORS: DocumentProcessor[] = [
  {
    kind: 'exam',
    label: 'Exame',
    icon: 'FlaskConical',
    accepts: ['application/pdf', 'image/jpeg', 'image/png'],
    target: '/dashboard/exams',
    confirmPhrase: 'um exame',
  },
  {
    kind: 'lab_report',
    label: 'Laudo',
    icon: 'FileText',
    accepts: ['application/pdf', 'image/jpeg', 'image/png'],
    target: '/dashboard/exams',
    confirmPhrase: 'um laudo',
  },
  {
    kind: 'medication_label',
    label: 'Medicamento ou suplemento',
    icon: 'Pill',
    accepts: ['image/jpeg', 'image/png'],
    target: '/dashboard/medicamentos',
    confirmPhrase: 'um rótulo ou receita de medicamento',
  },
  {
    kind: 'eyeglass_prescription',
    label: 'Receita de óculos ou lentes',
    icon: 'Glasses',
    accepts: ['application/pdf', 'image/jpeg', 'image/png'],
    target: '/dashboard/condicoes',
    confirmPhrase: 'uma receita de óculos ou lentes',
  },
]

/** Processador de um tipo (null para 'unknown' ou tipo não registrado). */
export function processorFor(kind: DocumentKind): DocumentProcessor | null {
  return CAPTURE_PROCESSORS.find(p => p.kind === kind) ?? null
}

/** Processadores que aceitam um dado MIME (para validar a entrada). */
export function processorsAccepting(mime: string): DocumentProcessor[] {
  return CAPTURE_PROCESSORS.filter(p => p.accepts.includes(mime))
}

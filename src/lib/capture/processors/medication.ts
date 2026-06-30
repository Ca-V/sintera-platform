import type { DocumentProcessor } from '../types'

// Processador de MEDICAMENTO/SUPLEMENTO. Encaminha ao scan existente em Medicamentos.
export const medicationProcessor: DocumentProcessor = {
  kind: 'medication_label',
  label: 'Receita de medicamento',
  icon: 'Pill',
  accepts: ['image/jpeg', 'image/png'],
  target: '/dashboard/medicamentos',
  confirmPhrase: 'um rótulo ou receita de medicamento',
}

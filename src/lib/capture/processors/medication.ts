import type { DocumentProcessor } from '../types'
import { captureForwarded } from '../result'

// Processador de MEDICAMENTO/SUPLEMENTO. V1: encaminha ao módulo (scan + formulário);
// upload-no-hub por tipo = incremento seguinte. Resultado unificado (captureForwarded).
export const medicationProcessor: DocumentProcessor = {
  kind: 'medication_label',
  label: 'Receita de medicamento',
  icon: 'Pill',
  accepts: ['image/jpeg', 'image/png'],
  target: '/dashboard/medicamentos',
  confirmPhrase: 'um rótulo ou receita de medicamento',
  process: async () => captureForwarded(medicationProcessor),
}

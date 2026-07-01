import type { DocumentProcessor } from '../types'
import { captureForwarded } from '../result'

// Processador de RECEITA DE ÓCULOS/LENTES. V1: encaminha ao fluxo de óculos existente.
export const eyeglassProcessor: DocumentProcessor = {
  kind: 'eyeglass_prescription',
  label: 'Receita de óculos',
  icon: 'Glasses',
  accepts: ['application/pdf', 'image/jpeg', 'image/png'],
  target: '/dashboard/condicoes',
  confirmPhrase: 'uma receita de óculos ou lentes',
  process: async () => captureForwarded(eyeglassProcessor),
}

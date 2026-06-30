import type { DocumentProcessor } from '../types'

// Processador de RECEITA DE ÓCULOS/LENTES. Encaminha ao fluxo de óculos existente.
export const eyeglassProcessor: DocumentProcessor = {
  kind: 'eyeglass_prescription',
  label: 'Receita de óculos',
  icon: 'Glasses',
  accepts: ['application/pdf', 'image/jpeg', 'image/png'],
  target: '/dashboard/condicoes',
  confirmPhrase: 'uma receita de óculos ou lentes',
}

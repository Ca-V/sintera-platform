import type { DocumentProcessor } from '../types'
import { captureForwarded } from '../result'

// Processador de RECEITA DE ÓCULOS/LENTES. Encaminha ao módulo Recursos de Saúde
// (correção visual), para onde óculos/lentes migraram (antes: Condições).
export const eyeglassProcessor: DocumentProcessor = {
  kind: 'eyeglass_prescription',
  label: 'Receita de óculos',
  icon: 'Glasses',
  accepts: ['application/pdf', 'image/jpeg', 'image/png'],
  target: '/dashboard/recursos',
  confirmPhrase: 'uma receita de óculos ou lentes',
  process: async () => captureForwarded(eyeglassProcessor),
}

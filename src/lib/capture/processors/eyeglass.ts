import type { DocumentProcessor } from '../types'
import { captureForwarded } from '../result'

// Processador de RECURSO DE SAÚDE. Encaminha ao módulo Recursos de Saúde — abrange
// óculos, lentes, próteses, órteses, dispositivos etc. (não só óculos). O tipo específico
// é escolhido na própria página de Recursos. (Rename do kind é escopo do CAP-001.)
export const eyeglassProcessor: DocumentProcessor = {
  kind: 'eyeglass_prescription',
  label: 'Recurso de saúde',
  icon: 'HeartPulse',
  accepts: ['application/pdf', 'image/jpeg', 'image/png'],
  target: '/dashboard/recursos',
  confirmPhrase: 'um documento de recurso de saúde (óculos, lentes, próteses, dispositivos…)',
  process: async () => captureForwarded(eyeglassProcessor),
}

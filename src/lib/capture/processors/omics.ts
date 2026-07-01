import type { DocumentProcessor } from '../types'
import { captureForwarded } from '../result'

// Processador de EXAME ÔMICO. Pipeline próprio (catálogo + versionamento) — NÃO fundir
// com exame convencional (Princípio 7). V1: encaminha ao fluxo de Ômica.
export const omicsProcessor: DocumentProcessor = {
  kind: 'omics',
  label: 'Exame ômico',
  icon: 'Dna',
  accepts: ['application/pdf', 'image/jpeg', 'image/png'],
  target: '/dashboard/omics',
  confirmPhrase: 'um exame ômico',
  process: async () => captureForwarded(omicsProcessor),
}

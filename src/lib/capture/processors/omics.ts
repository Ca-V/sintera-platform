import type { DocumentProcessor } from '../types'

// Processador de EXAME ÔMICO. Encaminha ao fluxo próprio de Ômica (catálogo +
// versionamento) — pipeline distinto, NÃO fundir com exame convencional (Princípio 7).
export const omicsProcessor: DocumentProcessor = {
  kind: 'omics',
  label: 'Exame ômico',
  icon: 'Dna',
  accepts: ['application/pdf', 'image/jpeg', 'image/png'],
  target: '/dashboard/omics',
  confirmPhrase: 'um exame ômico',
}

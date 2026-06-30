import type { DocumentProcessor } from '../types'

// Processador de EXAME (e laudos). Encaminha ao pipeline de Exames existente.
export const examProcessor: DocumentProcessor = {
  kind: 'exam',
  label: 'Exame',
  icon: 'FlaskConical',
  accepts: ['application/pdf', 'image/jpeg', 'image/png'],
  target: '/dashboard/exams',
  confirmPhrase: 'um exame',
}

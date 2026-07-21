'use client'
// Prova visual navegável do DS-002 (Fase 2): a tela Resultado de Exame montada com o adaptador Web e
// dados de EXEMPLO — permite validar a aparência sem depender do Supabase. Rota de desenvolvimento.
import { ExamResultView, type ExamResultData } from '@/app/dashboard/exams/[id]/ExamResultView'

const MOCK: ExamResultData = {
  title: 'Perfil lipídico + Hemograma',
  documentType: 'Resultado laboratorial',
  lab: 'Laboratório Fleury',
  requestedBy: 'Dra. Helena Costa',
  collectedAt: '30/05/2026 · 07:40',
  material: 'Soro',
  indicators: [
    { value: '214', label: 'Colesterol total', trend: 'up' },
    { value: '131', label: 'LDL', trend: 'up' },
    { value: '58', label: 'HDL', trend: 'stable' },
    { value: '92', label: 'Glicose', trend: 'stable' },
  ],
  labRows: [
    { name: 'Colesterol total', value: '214', numericValue: 214, unit: 'mg/dL', refHigh: 190, refText: '< 190', trend: 'up' },
    { name: 'HDL', value: '58', numericValue: 58, unit: 'mg/dL', refLow: 40, refText: '> 40', trend: 'stable' },
    { name: 'LDL', value: '131', numericValue: 131, unit: 'mg/dL', refHigh: 100, refText: '< 100', trend: 'up' },
    { name: 'Triglicerídeos', value: '149', numericValue: 149, unit: 'mg/dL', refHigh: 150, refText: '< 150', trend: 'up' },
    { name: 'Glicose (jejum)', value: '92', numericValue: 92, unit: 'mg/dL', refLow: 70, refHigh: 99, refText: '70–99', trend: 'stable' },
    { name: 'Hemoglobina', value: '12,1', numericValue: 12.1, unit: 'g/dL', refLow: 12.3, refHigh: 15.3, refText: '12,3–15,3', trend: 'down' },
    { name: 'Leucócitos', value: '6.480', numericValue: 6480, unit: '/mm³', refLow: 4000, refHigh: 10000, refText: '4.000–10.000', trend: 'stable' },
    { name: 'TSH', value: '2,74', numericValue: 2.74, unit: 'µUI/mL', refLow: 0.4, refHigh: 4.5, refText: '0,40–4,50', trend: 'stable' },
    { name: 'Vitamina D', value: '28,6', numericValue: 28.6, unit: 'ng/mL', refLow: 30, refText: '> 30', trend: 'up' },
  ],
}

export default function DsExamPreviewPage() {
  return <ExamResultView data={MOCK} />
}

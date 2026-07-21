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
  // Agrupamento material→exame + tipos de resultado (numérico/qualitativo) — exercita o modelo ampliado da DS.
  labGroups: [
    {
      material: 'Sangue',
      exams: [
        {
          label: 'Perfil lipídico',
          rows: [
            { name: 'Colesterol total', value: '214', numericValue: 214, unit: 'mg/dL', refHigh: 190, refText: '< 190', trend: 'up', flagLabel: 'alto' },
            { name: 'HDL', value: '58', numericValue: 58, unit: 'mg/dL', refLow: 40, refText: '> 40', trend: 'stable' },
            { name: 'LDL', value: '131', numericValue: 131, unit: 'mg/dL', refHigh: 100, refText: '< 100', trend: 'up', flagLabel: 'alto' },
            { name: 'Triglicerídeos', value: '149', numericValue: 149, unit: 'mg/dL', refHigh: 150, refText: '< 150', trend: 'up' },
          ],
        },
        {
          label: 'Hemograma',
          rows: [
            { name: 'Hemoglobina', value: '12,1', numericValue: 12.1, unit: 'g/dL', refLow: 12.3, refHigh: 15.3, refText: '12,3–15,3', trend: 'down', flagLabel: 'baixo' },
            { name: 'Leucócitos', value: '6.480', numericValue: 6480, unit: '/mm³', refLow: 4000, refHigh: 10000, refText: '4.000–10.000', trend: 'stable' },
          ],
        },
      ],
    },
    {
      material: 'Urina',
      exams: [
        {
          label: 'Urina tipo I',
          rows: [
            { name: 'Aspecto', value: 'Límpido', kind: 'qualitative' },
            { name: 'Nitrito', value: 'Negativo', kind: 'qualitative' },
            { name: 'Densidade', value: '1.020', numericValue: 1.02, unit: '', refLow: 1.005, refHigh: 1.03, refText: '1,005–1,030', trend: 'stable' },
          ],
        },
      ],
    },
  ],
}

export default function DsExamPreviewPage() {
  return <ExamResultView data={MOCK} />
}

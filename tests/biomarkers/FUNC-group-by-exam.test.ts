// FUNC · Histórico de Exames (fundadora 17/07) — agrupamento por EXAME (Exame → Histórico → Biomarcadores). PURO.
import { describe, it, expect } from 'vitest'
import { buildCatalogLabels, groupByExam } from '@/lib/biomarkers/catalogLabels'

const labels = buildCatalogLabels(
  [{ id: 'sangue', label: 'Sangue', sort_order: 1 }, { id: 'urina', label: 'Urina', sort_order: 2 }],
  [],
)
type Item = { name: string; sourceMaterial: string | null; specimen: string | null; sourceExamName: string | null }
const get = (t: Item) => ({ sourceMaterial: t.sourceMaterial, specimen: t.specimen, sourceExamName: t.sourceExamName })

describe('groupByExam — Exame no topo', () => {
  it('agrupa biomarcadores pelo NOME do exame; material vira contexto', () => {
    const items: Item[] = [
      { name: 'Hemoglobina', sourceMaterial: 'sangue', specimen: 'sangue', sourceExamName: 'Hemograma' },
      { name: 'Hematócrito', sourceMaterial: 'sangue', specimen: 'sangue', sourceExamName: 'Hemograma' },
      { name: 'Colesterol total', sourceMaterial: 'sangue', specimen: 'sangue', sourceExamName: 'Perfil lipídico' },
    ]
    const groups = groupByExam(items, get, labels)
    const hemograma = groups.find(g => g.label.toLowerCase().includes('hemograma'))!
    expect(hemograma.items).toHaveLength(2)          // dois biomarcadores sob o exame
    expect(hemograma.material).toBe('Sangue')        // material = contexto
    expect(groups.some(g => g.label.toLowerCase().includes('lip'))).toBe(true)
  })

  it('sem nome de exame (dado legado) → agrupa pelo MATERIAL como exame', () => {
    const items: Item[] = [
      { name: 'Densidade', sourceMaterial: 'urina', specimen: 'urina', sourceExamName: null },
    ]
    const groups = groupByExam(items, get, labels)
    expect(groups).toHaveLength(1)
    expect(groups[0].key.startsWith('mat:')).toBe(true)
    expect(groups[0].label).toBe('Urina')
    expect(groups[0].material).toBeNull()             // o próprio grupo já é o material
  })

  it('ordena por rótulo (pt-BR)', () => {
    const items: Item[] = [
      { name: 'x', sourceMaterial: 'sangue', specimen: 'sangue', sourceExamName: 'Vitamina D' },
      { name: 'y', sourceMaterial: 'sangue', specimen: 'sangue', sourceExamName: 'Ácido úrico' },
    ]
    const groups = groupByExam(items, get, labels)
    expect(groups[0].label.toLowerCase()).toContain('ácido')
  })
})

import { describe, it, expect } from 'vitest'
import { buildCatalogLabels, groupBySpecimen, groupByMaterial, groupByMaterialExam } from './catalogLabels'

const materials = [
  { id: 'sangue', label: 'Exame de sangue', sort_order: 0 },
  { id: 'urina', label: 'Exame de urina', sort_order: 1 },
  { id: 'urina_24h', label: 'Exame de urina (24 horas)', sort_order: 2 },
]
const panels = [
  { id: 'hematologia_vermelha', label: 'Série vermelha', sort_order: 0 },
  { id: 'metabolismo_glicose', label: 'Glicose', sort_order: 4 },
]

describe('buildCatalogLabels', () => {
  const l = buildCatalogLabels(materials, panels)
  it('resolve rótulos de material e painel do catálogo', () => {
    expect(l.materialLabel('sangue')).toBe('Exame de sangue')
    expect(l.panelLabel('hematologia_vermelha')).toBe('Série vermelha')
  })
  it('fallbacks preservam o comportamento anterior (material → "Outros exames"; painel → null)', () => {
    expect(l.materialLabel('desconhecido')).toBe('Outros exames')
    expect(l.materialLabel(null)).toBe('Outros exames')
    expect(l.panelLabel('desconhecido')).toBeNull()
    expect(l.panelLabel(null)).toBeNull()
  })
  it('specimenOrder segue o sort_order', () => {
    expect(l.specimenOrder).toEqual(['sangue', 'urina', 'urina_24h'])
  })
})

describe('groupBySpecimen', () => {
  const labels = buildCatalogLabels(materials, panels)
  type Item = { id: string; specimen: string | null; category: string | null }
  const get = (i: Item) => ({ specimen: i.specimen, category: i.category })

  it('agrupa por material → painel com rótulos do catálogo', () => {
    const items: Item[] = [
      { id: 'a', specimen: 'sangue', category: 'hematologia_vermelha' },
      { id: 'b', specimen: 'sangue', category: 'metabolismo_glicose' },
    ]
    const groups = groupBySpecimen(items, get, labels)
    expect(groups).toHaveLength(1)
    expect(groups[0].label).toBe('Exame de sangue')
    expect(groups[0].categories.map(c => c.label)).toEqual(['Série vermelha', 'Glicose'])
  })
  it('ordena materiais por specimenOrder; desconhecido por último (fallback)', () => {
    const items: Item[] = [
      { id: 'a', specimen: 'urina', category: null },
      { id: 'b', specimen: 'sangue', category: null },
      { id: 'c', specimen: 'outro_material', category: null },
    ]
    const groups = groupBySpecimen(items, get, labels)
    expect(groups.map(g => g.key)).toEqual(['sangue', 'urina', 'outro_material'])
    expect(groups[2].label).toBe('Outros exames')
  })
  it('specimen/category nulos caem em "outros"', () => {
    const groups = groupBySpecimen([{ id: 'a', specimen: null, category: null }], get, labels)
    expect(groups[0].key).toBe('outros')
    expect(groups[0].categories[0].key).toBe('outros')
    expect(groups[0].categories[0].label).toBeNull()
  })
})

describe('groupByMaterial — só material, sem painel fisiológico (ING-003)', () => {
  const labels = buildCatalogLabels(materials, panels)
  type Item = { id: string; specimen: string | null }
  const get = (i: Item) => ({ specimen: i.specimen })

  it('agrupa só por material (sem nível de painel), ordenado por specimenOrder', () => {
    const items: Item[] = [
      { id: 'a', specimen: 'urina' },
      { id: 'b', specimen: 'sangue' },
      { id: 'c', specimen: 'sangue' },
    ]
    const groups = groupByMaterial(items, get, labels)
    expect(groups.map(g => g.key)).toEqual(['sangue', 'urina'])
    expect(groups[0].label).toBe('Exame de sangue')
    expect(groups[0].items).toHaveLength(2)
    expect(groups[0]).not.toHaveProperty('categories') // painel fisiológico não existe aqui
  })

  it('specimen nulo cai em "outros" (fallback), por último', () => {
    const groups = groupByMaterial([{ id: 'a', specimen: null }, { id: 'b', specimen: 'sangue' }], get, labels)
    expect(groups.map(g => g.key)).toEqual(['sangue', 'outros'])
    expect(groups[1].label).toBe('Outros exames')
  })
})

describe('groupByMaterialExam — Material → Exame(opcional) → itens (ING-004)', () => {
  const labels = buildCatalogLabels(materials, panels)
  type Item = { id: string; sourceMaterial: string | null; specimen: string | null; sourceExamName: string | null }
  const get = (i: Item) => ({ sourceMaterial: i.sourceMaterial, specimen: i.specimen, sourceExamName: i.sourceExamName })

  it('com source_exam_name → agrupa por material do laudo → nome do exame (gasometria)', () => {
    const items: Item[] = [
      { id: 'pH', sourceMaterial: 'Sangue venoso', specimen: null, sourceExamName: 'Gasometria venosa' },
      { id: 'pO2', sourceMaterial: 'Sangue venoso', specimen: null, sourceExamName: 'Gasometria venosa' },
    ]
    const g = groupByMaterialExam(items, get, labels)
    expect(g).toHaveLength(1)
    expect(g[0].label).toBe('Sangue venoso')
    expect(g[0].exams).toHaveLength(1)
    expect(g[0].exams[0].label).toBe('Gasometria venosa')
    expect(g[0].exams[0].items).toHaveLength(2)
  })

  it('sem source_exam_name → itens diretos sob o material (exame label null)', () => {
    const g = groupByMaterialExam([{ id: 'ca', sourceMaterial: 'URINA DE 24 HORAS', specimen: null, sourceExamName: null }], get, labels)
    expect(g[0].label).toBe('URINA DE 24 HORAS')
    expect(g[0].exams[0].label).toBeNull()
  })

  it('sem source_material → fallback ao rótulo do catálogo (specimen)', () => {
    const g = groupByMaterialExam([{ id: 'hb', sourceMaterial: null, specimen: 'sangue', sourceExamName: null }], get, labels)
    expect(g[0].label).toBe('Exame de sangue')
    expect(g[0].iconKey).toBe('sangue')
  })

  it('reconhecido (specimen presente) → rótulo do CATÁLOGO vence o texto cru do laudo (evita divisão)', () => {
    const g = groupByMaterialExam([{ id: 'ca', sourceMaterial: 'SANGUE', specimen: 'sangue', sourceExamName: null }], get, labels)
    expect(g[0].label).toBe('Exame de sangue') // não "SANGUE"
  })
})

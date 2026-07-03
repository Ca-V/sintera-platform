import { describe, it, expect } from 'vitest'
import { buildCatalogLabels, groupBySpecimen } from './catalogLabels'

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

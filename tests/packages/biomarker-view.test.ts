// @sintera/core — apresentação PURA de resultados (biomarcadores). Fonte única Web↔Mobile.
// Garante fidelidade: interpretação NUNCA recomputada, copy de situação estável, ordenação/agrupamento/índice.
import { describe, it, expect } from 'vitest'
import {
  biomarkerStatus, biomarkerStatusLabel, biomarkerSourceLabel,
  displayValue, sortBiomarkers, biomarkerCounts, experimentalIndex,
  groupByMaterialExam, formatReference, type BiomarkerLike,
} from '../../packages/core/src/domain/exams/biomarkerView'

function bm(p: Partial<BiomarkerLike>): BiomarkerLike {
  return {
    name: 'X', value: null, value_text: null, unit: null, reference_min: null, reference_max: null,
    interpretation: null, result_type: 'numeric', reference_source: null, source: null,
    source_material: null, source_exam_name: null, ...p,
  }
}

describe('biomarkerStatus — tipo do resultado tem prioridade', () => {
  it('qualitativo presente NUNCA vira "ausente"', () => {
    expect(biomarkerStatus(bm({ result_type: 'qualitative', value_text: 'Negativo' }))).toBe('qualitative')
  })
  it('mapeia interpretações numéricas', () => {
    expect(biomarkerStatus(bm({ interpretation: 'acima_da_referencia' }))).toBe('above')
    expect(biomarkerStatus(bm({ interpretation: 'abaixo_da_referencia' }))).toBe('below')
    expect(biomarkerStatus(bm({ interpretation: 'dentro_da_referencia' }))).toBe('within')
  })
  it('missing/failed refletem o tipo; sem interpretação → no_reference', () => {
    expect(biomarkerStatus(bm({ result_type: 'missing' }))).toBe('missing')
    expect(biomarkerStatus(bm({ result_type: 'extraction_failed' }))).toBe('failed')
    expect(biomarkerStatus(bm({ interpretation: null }))).toBe('no_reference')
  })
  it('rótulo de situação = copy estável (não pressupõe laboratório)', () => {
    expect(biomarkerStatusLabel(bm({ interpretation: 'acima_da_referencia' }))).toMatch(/Acima da referência/)
  })
})

describe('displayValue — número e texto com o mesmo tratamento', () => {
  it('numérico → formata pt-BR + unidade', () => {
    expect(displayValue(bm({ value: 1234.5, unit: 'mg/dL' }))).toEqual({ main: '1.234,5', unit: 'mg/dL' })
  })
  it('qualitativo CAIXA ALTA → caixa de frase; extrai unidade embutida', () => {
    expect(displayValue(bm({ result_type: 'qualitative', value_text: 'NEGATIVO' }))).toEqual({ main: 'Negativo', unit: null })
    expect(displayValue(bm({ result_type: 'qualitative', value_text: 'SUPERIOR A 90 mL/min', unit: 'mL/min' })))
      .toEqual({ main: 'Superior a 90', unit: 'mL/min' })
  })
  it('sem valor → main null', () => {
    expect(displayValue(bm({ value: null }))).toEqual({ main: null, unit: null })
  })
})

describe('sort / counts / índice', () => {
  it('ordena fora-da-faixa antes de dentro; depois por nome', () => {
    const out = sortBiomarkers([
      bm({ name: 'B', interpretation: 'dentro_da_referencia' }),
      bm({ name: 'A', interpretation: 'acima_da_referencia' }),
      bm({ name: 'C', interpretation: 'dentro_da_referencia' }),
    ])
    expect(out.map(b => b.name)).toEqual(['A', 'B', 'C'])
  })
  it('contagens', () => {
    const c = biomarkerCounts([
      bm({ interpretation: 'acima_da_referencia' }),
      bm({ interpretation: 'dentro_da_referencia' }),
      bm({ interpretation: 'dentro_da_referencia' }),
    ])
    expect(c).toEqual({ total: 3, acima: 1, abaixo: 0, dentro: 2 })
  })
  it('índice experimental exige ≥5 elegíveis (laudo+numeric+interpretado)', () => {
    const few = Array.from({ length: 4 }, () => bm({ reference_source: 'laudo', result_type: 'numeric', interpretation: 'dentro_da_referencia' }))
    expect(experimentalIndex(few)).toBeNull()
    const enough = Array.from({ length: 5 }, (_, i) => bm({ reference_source: 'laudo', result_type: 'numeric', interpretation: i < 4 ? 'dentro_da_referencia' : 'acima_da_referencia' }))
    expect(experimentalIndex(enough)).toEqual({ numerator: 4, denominator: 5, pct: 80 })
  })
})

describe('groupByMaterialExam — fiel ao laudo', () => {
  it('agrupa por material → exame; sem material cai em "Resultados"', () => {
    const groups = groupByMaterialExam([
      bm({ name: 'Glicose', source_material: 'Sangue', source_exam_name: 'Bioquímica' }),
      bm({ name: 'Ureia', source_material: 'Sangue', source_exam_name: 'Bioquímica' }),
      bm({ name: 'Densidade', source_material: 'Urina', source_exam_name: 'EAS' }),
      bm({ name: 'Solto' }),
    ])
    expect(groups.map(g => g.material)).toEqual(['Sangue', 'Urina', 'Resultados'])
    expect(groups[0].exams[0].items.map(i => i.name)).toEqual(['Glicose', 'Ureia'])
  })
})

describe('formatReference / sourceLabel', () => {
  it('faixa min-max / só min / só max', () => {
    expect(formatReference(70, 99)).toBe('70 – 99')
    expect(formatReference(70, null)).toBe('≥ 70')
    expect(formatReference(null, 99)).toBe('≤ 99')
    expect(formatReference(null, null)).toBeNull()
  })
  it('origem humana', () => {
    expect(biomarkerSourceLabel('ai_extracted')).toMatch(/automaticamente/)
    expect(biomarkerSourceLabel('desconhecido')).toMatch(/estruturados a partir/)
  })
})

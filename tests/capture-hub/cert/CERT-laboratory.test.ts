import { describe, it, expect } from 'vitest'
import { laboratoryToUcda, type LabBiomarkerRow } from '@/lib/capture/laboratory-adapter'
import { ENGINE_VERSION } from '@/lib/capture/ucda'

// CERT — CERTIFICAÇÃO DA PLATAFORMA aplicada ao LABORATÓRIO (modalidade de referência). Valida as 6
// dimensões (Universalidade · Fidelidade · Reprodutibilidade · Auditabilidade · Cobertura · Evolução) sobre
// um corpus com as FORMAS REAIS dos 446 biomarcadores. Este arquivo é o TEMPLATE que toda modalidade futura
// reutiliza — uma capacidade só é "concluída" quando o seu CERT passa (docs/CERTIFICACAO_PLATAFORMA.md).

const row = (o: Partial<LabBiomarkerRow>): LabBiomarkerRow => ({
  name: 'X', value: null, valueText: null, unit: null, referenceMin: null, referenceMax: null,
  resultType: 'numeric', sourceMaterial: null, sourceExamName: null, ...o,
})

// Corpus representativo das formas reais (hemograma, endócrino, min-only, max-only, qualitativo, não-resultado).
const CORPUS: LabBiomarkerRow[] = [
  row({ name: 'Hemoglobina', value: '13.5', unit: 'g/dL', referenceMin: '12', referenceMax: '16', sourceMaterial: 'SANGUE', sourceExamName: 'HEMOGRAMA', rawText: 'Hemoglobina 13,5 g/dL', page: 1 }),
  row({ name: 'VCM', value: '89.7', unit: 'fl', referenceMin: '80', referenceMax: '100', sourceMaterial: 'SANGUE', sourceExamName: 'HEMOGRAMA', rawText: 'VCM 89,7 fL', page: 1 }),
  row({ name: 'Cortisol', value: '16.5', unit: 'MCG/DL', referenceMin: '5', referenceMax: '25', sourceMaterial: 'SANGUE' }),
  row({ name: 'Elastase pancreática fecal', value: '235', unit: 'MCG/G', referenceMin: '200', sourceMaterial: 'FEZES' }),
  row({ name: 'Insulina', value: '10.7', unit: 'MICRO UN/mL', referenceMax: '19.1', sourceMaterial: 'SANGUE' }),
  row({ name: 'Sorologia toxoplasmose IgG', value: null, valueText: 'Reagente', resultType: 'qualitative', sourceMaterial: 'SANGUE' }),
  row({ name: 'IGF-1', value: null, valueText: null, resultType: 'missing' }), // não-resultado
]

describe('CERT · Laboratório — Certificação da Plataforma (6 dimensões)', () => {
  it('1) UNIVERSALIDADE — analito futuro/arbitrário representa sem alteração estrutural', () => {
    const novo = laboratoryToUcda([row({ name: 'ANALITO-INEXISTENTE-2050', value: '7', unit: 'x/y' })])
    expect(novo.items).toHaveLength(1)
    expect(novo.items[0].name).toBe('ANALITO-INEXISTENTE-2050')
  })

  it('2) FIDELIDADE — value_text é transcrição fiel; nada inventado; nada além do que veio', () => {
    const ucda = laboratoryToUcda(CORPUS)
    // nenhum item além dos que têm valor (6 com valor; 1 não-resultado fora)
    expect(ucda.items.length).toBeLessThanOrEqual(CORPUS.length)
    const hb = ucda.items.find(i => i.name === 'Hemoglobina')!
    expect(hb.valueText).toBe('13.5')                 // fiel
    expect(hb.referenceText).toBe('12 – 16')          // transcrito, não interpretado
    const soro = ucda.items.find(i => i.name.includes('toxoplasmose'))!
    expect(soro.valueText).toBe('Reagente')           // qualitativo preservado, sem inventar número
    expect(soro.valueNum).toBeNull()
  })

  it('3) REPRODUTIBILIDADE — mesmo corpus → representação idêntica, sempre', () => {
    expect(JSON.stringify(laboratoryToUcda(CORPUS))).toBe(JSON.stringify(laboratoryToUcda(CORPUS)))
  })

  it('4) AUDITABILIDADE — proveniência: engine + processador na representação; página/trecho por item', () => {
    const ucda = laboratoryToUcda(CORPUS)
    expect(ucda.provenance.engineVersion).toBe(ENGINE_VERSION)
    expect(ucda.provenance.processorVersion).toBe('v1')
    const hb = ucda.items.find(i => i.name === 'Hemoglobina')!
    expect(hb.page).toBe(1)
    expect(hb.excerpt).toBe('Hemoglobina 13,5 g/dL')
  })

  it('5) COBERTURA — não-resultado (missing/failed) NÃO entra; sem falsa completude', () => {
    const ucda = laboratoryToUcda(CORPUS)
    expect(ucda.items.find(i => i.name === 'IGF-1')).toBeUndefined()
  })

  it('6) EVOLUÇÃO — cada medida tem valueNum + nome + grupo → série longitudinal possível', () => {
    const ucda = laboratoryToUcda(CORPUS)
    const measures = ucda.items.filter(i => i.itemType === 'measure')
    expect(measures.length).toBeGreaterThan(0)
    for (const m of measures) {
      expect(typeof m.valueNum).toBe('number')  // valor numérico p/ a série
      expect(m.name).toBeTruthy()               // chave da série
    }
    // organização temporal/estrutural: hemograma agrupado
    expect(ucda.items.filter(i => i.group === 'HEMOGRAMA').length).toBe(2)
  })
})

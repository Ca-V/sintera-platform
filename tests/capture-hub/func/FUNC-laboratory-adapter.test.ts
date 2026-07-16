import { describe, it, expect } from 'vitest'
import { laboratoryToUcda, biomarkerToUcdaItem, type LabBiomarkerRow } from '@/lib/capture/laboratory-adapter'
import { representationFromProcessor, toNum } from '@/lib/capture/ucda'
import type { ProcessorResult } from '@/lib/capture/clinical-processors/types'

// FUNC — Laboratory Adapter + UCDA. O CPE CONSOME o laboratório existente (biomarkers) e o apresenta como
// representação canônica UCDA, sem migrar. Linhas espelham dados REAIS (HEMOGRAMA, cortisol, elastase).

const row = (o: Partial<LabBiomarkerRow>): LabBiomarkerRow => ({
  name: 'X', value: null, valueText: null, unit: null, referenceMin: null, referenceMax: null,
  resultType: 'numeric', sourceMaterial: null, sourceExamName: null, ...o,
})

describe('FUNC · laboratoryToUcda (adapter transitório)', () => {
  it('biomarcador numérico → measure com valueNum, unit, specimen, group e referência transcrita', () => {
    const item = biomarkerToUcdaItem(row({
      name: 'HCM', value: '30.6', unit: 'pg', referenceMin: '26', referenceMax: '34',
      resultType: 'numeric', sourceMaterial: 'SANGUE', sourceExamName: 'HEMOGRAMA',
    }))
    expect(item.itemType).toBe('measure')
    expect(item.valueText).toBe('30.6')
    expect(item.valueNum).toBe(30.6)
    expect(item.unit).toBe('pg')
    expect(item.specimen).toBe('SANGUE')
    expect(item.group).toBe('HEMOGRAMA')
    expect(item.referenceText).toBe('26 – 34')
  })

  it('só referência máxima → "≤ max" (não interpreta)', () => {
    const item = biomarkerToUcdaItem(row({ name: 'INSULINA', value: '10.7', unit: 'MICRO UN/mL', referenceMax: '19.1' }))
    expect(item.referenceText).toBe('≤ 19.1')
  })

  it('só referência mínima → "≥ min"', () => {
    const item = biomarkerToUcdaItem(row({ name: 'ELASTASE', value: '235', referenceMin: '200' }))
    expect(item.referenceText).toBe('≥ 200')
  })

  it('qualitativo → parameter (não measure)', () => {
    const item = biomarkerToUcdaItem(row({ name: 'Sorologia', value: null, valueText: 'Não reagente', resultType: 'qualitative' }))
    expect(item.itemType).toBe('parameter')
    expect(item.valueText).toBe('Não reagente')
    expect(item.valueNum).toBeNull()
  })

  it('um hemograma real (várias linhas) → 1 UcdaRepresentation laboratory/structured, agrupada', () => {
    const rows = [
      row({ name: 'VCM', value: '89.7', unit: 'fl', referenceMin: '80', referenceMax: '100', sourceMaterial: 'SANGUE', sourceExamName: 'HEMOGRAMA' }),
      row({ name: 'Linfocitos', value: '2170', unit: 'Nmm3', referenceMin: '1000', referenceMax: '3500', sourceMaterial: 'SANGUE', sourceExamName: 'HEMOGRAMA' }),
    ]
    const ucda = laboratoryToUcda(rows)
    expect(ucda.clinicalModel).toBe('laboratory')
    expect(ucda.resultKind).toBe('structured')
    expect(ucda.provenance.source).toBe('laboratory-adapter')
    expect(ucda.items).toHaveLength(2)
    expect(new Set(ucda.items.map(i => i.group))).toEqual(new Set(['HEMOGRAMA']))
  })

  it('itens SEM valor (missing/extraction_failed) não entram na representação (validado nos 446 reais)', () => {
    const rows = [
      row({ name: 'GLICEMIA', value: '85', resultType: 'numeric' }),
      row({ name: 'IGF-1', value: null, valueText: null, resultType: 'missing' }),
      row({ name: 'FALHOU', value: null, valueText: '', resultType: 'extraction_failed' }),
    ]
    const ucda = laboratoryToUcda(rows)
    expect(ucda.items).toHaveLength(1)
    expect(ucda.items[0].name).toBe('GLICEMIA')
  })

  it('MODELO ABERTO: analito arbitrário/inexistente flui sem lista fechada (nome nunca visto antes)', () => {
    const inventado = biomarkerToUcdaItem(row({
      name: 'BIOMARCADOR-QUE-AINDA-NAO-EXISTE-XYZ-2050', value: '42', unit: 'ng/mL', resultType: 'numeric',
    }))
    expect(inventado.name).toBe('BIOMARCADOR-QUE-AINDA-NAO-EXISTE-XYZ-2050') // representado fielmente, sem enum
    expect(inventado.valueNum).toBe(42)
  })

  it('MODELO ABERTO: código (LOINC/outro), método e contexto passam quando a fonte fornece', () => {
    const item = biomarkerToUcdaItem(row({
      name: 'Glicose', value: '92', unit: 'mg/dL', resultType: 'numeric',
      code: '2345-7', codeSystem: 'LOINC', method: 'Hexoquinase', context: 'Jejum 8h',
    }))
    expect(item.code).toBe('2345-7')
    expect(item.codeSystem).toBe('LOINC')
    expect(item.method).toBe('Hexoquinase')
    expect(item.context).toBe('Jejum 8h')
  })

  it('MODELO ABERTO: mesmo analito com NOME diferente (sinônimo de laboratório) é representável', () => {
    const a = biomarkerToUcdaItem(row({ name: 'TGP', value: '30', unit: 'U/L', code: '1742-6', codeSystem: 'LOINC' }))
    const b = biomarkerToUcdaItem(row({ name: 'ALT', value: '30', unit: 'U/L', code: '1742-6', codeSystem: 'LOINC' }))
    // nomes diferentes, mesmo código aberto — a plataforma representa ambos sem alteração estrutural
    expect(a.name).not.toBe(b.name)
    expect(a.code).toBe(b.code)
  })

  it('é DETERMINÍSTICO', () => {
    const rows = [row({ name: 'CHCM', value: '34.1', unit: 'gNdl', referenceMin: '31.5', referenceMax: '36.5' })]
    expect(JSON.stringify(laboratoryToUcda(rows))).toBe(JSON.stringify(laboratoryToUcda(rows)))
  })
})

describe('FUNC · representationFromProcessor (modalidade → UCDA)', () => {
  it('parametric (Pentacam) → itens measure com região', () => {
    const result: ProcessorResult = {
      output: { kind: 'parametric', parameters: [{ name: 'K1', value: '43.2', unit: 'D', region: 'OD' }] },
      clinicalModel: 'corneal-tomography', contractVersion: 'v1', extractedUnits: 1, notes: [],
    }
    const ucda = representationFromProcessor(result)!
    expect(ucda.resultKind).toBe('parametric')
    expect(ucda.items[0]).toMatchObject({ itemType: 'measure', name: 'K1', valueNum: 43.2, region: 'OD' })
  })

  it('sem saída → null (document_only)', () => {
    const result: ProcessorResult = { output: null, clinicalModel: 'none', contractVersion: '-', extractedUnits: 0, notes: [] }
    expect(representationFromProcessor(result)).toBeNull()
  })
})

describe('FUNC · toNum', () => {
  it('vírgula decimal e unidade coladas', () => {
    expect(toNum('43,2')).toBe(43.2)
    expect(toNum('30.6')).toBe(30.6)
  })
  it('milhar pt-BR com vírgula decimal (antes virava NaN)', () => {
    expect(toNum('1.234,56')).toBe(1234.56)
    expect(toNum('12.000,5')).toBe(12000.5)
  })
  it('SEM vírgula, ponto é decimal — não desfaz densidade/valor ambíguo', () => {
    expect(toNum('1.028')).toBe(1.028)   // densidade urinária
    expect(toNum('7.35')).toBe(7.35)     // pH
  })
  it('não-número → null', () => {
    expect(toNum('Não reagente')).toBeNull()
    expect(toNum('')).toBeNull()
  })
})

import { describe, it, expect } from 'vitest'
import { representationFromProcessor, clinicalResultsToUcda, ucdaItemToRow, groupUcdaForDisplay, type ClinicalResultRow } from '@/lib/capture/ucda'
import type { ProcessorResult } from '@/lib/capture/clinical-processors/types'

// FUNC — UCDA como CONTRATO ÚNICO de saída, fechado dos dois lados: escrita (processador → UCDA → persistência)
// e leitura (persistência → UCDA). O consumidor lê SEMPRE UCDA, nunca o backend.

const parametric: ProcessorResult = {
  output: { kind: 'parametric', parameters: [
    { name: 'K1', value: '43.2', unit: 'D', region: 'OD' },
    { name: 'Kmax', value: '45.0', unit: 'D', region: 'OD' },
  ] },
  clinicalModel: 'corneal-tomography', contractVersion: 'v1', extractedUnits: 2, notes: [],
}

// Simula o mapeamento escrita→banco→leitura (o que o analyze grava em clinical_results).
function persist(rk: string, model: string, items: ReturnType<typeof representationFromProcessor>): ClinicalResultRow[] {
  return (items?.items ?? []).map(it => ({ clinical_model: model, result_kind: rk, ...ucdaItemToRow(it) }))
}

describe('FUNC · UCDA contrato — round-trip processador → persistência → leitura', () => {
  it('escrita converte no contrato; leitura reconstrói o MESMO contrato', () => {
    const written = representationFromProcessor(parametric)!
    const rows = persist(written.resultKind, written.clinicalModel, written)
    const read = clinicalResultsToUcda(rows)!

    expect(read.clinicalModel).toBe('corneal-tomography')
    expect(read.resultKind).toBe('parametric')
    expect(read.items).toHaveLength(2)
    expect(read.items[0]).toMatchObject({ itemType: 'measure', name: 'K1', valueNum: 43.2, unit: 'D', region: 'OD' })
  })

  it('leitura de linhas vazias → null (nada a representar)', () => {
    expect(clinicalResultsToUcda([])).toBeNull()
  })

  it('leitura preserva campos abertos (code/method/context)', () => {
    const rows: ClinicalResultRow[] = [{
      clinical_model: 'laboratory', result_kind: 'structured', item_type: 'measure', name: 'Glicose',
      value_text: '92', value_num: 92, unit: 'mg/dL', code: '2345-7', code_system: 'LOINC', value_code: null,
      region: null, anatomy: null, specimen: null, method: 'Hexoquinase', context: 'Jejum', group_label: null, reference_text: '70 – 99',
      page: 1, raw_text: 'Glicose 92 mg/dL',
    }]
    const ucda = clinicalResultsToUcda(rows)!
    expect(ucda.items[0]).toMatchObject({ code: '2345-7', codeSystem: 'LOINC', method: 'Hexoquinase', context: 'Jejum', referenceText: '70 – 99' })
  })

  it('sem saída do processador → não há o que persistir (null)', () => {
    const empty: ProcessorResult = { output: null, clinicalModel: 'none', contractVersion: '-', extractedUnits: 0, notes: [] }
    expect(representationFromProcessor(empty)).toBeNull()
  })
})

describe('FUNC · UCDA leitura — agrupamento genérico p/ exibição (sem lógica por modalidade)', () => {
  it('agrupa por group›region›anatomy, preservando ordem de 1ª aparição e ordem interna', () => {
    const rows: ClinicalResultRow[] = [
      { clinical_model: 'corneal-tomography', result_kind: 'parametric', item_type: 'measure', name: 'K1', value_text: '43.2', value_num: 43.2, unit: 'D', code: null, code_system: null, value_code: null, region: 'OD', anatomy: null, specimen: null, method: null, context: null, group_label: null, reference_text: null, page: 1, raw_text: null },
      { clinical_model: 'corneal-tomography', result_kind: 'parametric', item_type: 'measure', name: 'K1', value_text: '43.0', value_num: 43.0, unit: 'D', code: null, code_system: null, value_code: null, region: 'OE', anatomy: null, specimen: null, method: null, context: null, group_label: null, reference_text: null, page: 1, raw_text: null },
      { clinical_model: 'corneal-tomography', result_kind: 'parametric', item_type: 'measure', name: 'Kmax', value_text: '45.0', value_num: 45.0, unit: 'D', code: null, code_system: null, value_code: null, region: 'OD', anatomy: null, specimen: null, method: null, context: null, group_label: null, reference_text: null, page: 1, raw_text: null },
    ]
    const ucda = clinicalResultsToUcda(rows)!
    const sections = groupUcdaForDisplay(ucda)
    expect(sections.map(s => s.label)).toEqual(['OD', 'OE'])          // ordem de 1ª aparição
    expect(sections[0].items.map(i => i.name)).toEqual(['K1', 'Kmax']) // ordem interna preservada
    expect(sections[1].items.map(i => i.name)).toEqual(['K1'])
  })

  it('itens sem group/region/anatomy caem numa seção label=null', () => {
    const rows: ClinicalResultRow[] = [
      { clinical_model: 'x', result_kind: 'structured', item_type: 'measure', name: 'A', value_text: '1', value_num: 1, unit: null, code: null, code_system: null, value_code: null, region: null, anatomy: null, specimen: null, method: null, context: null, group_label: null, reference_text: null, page: null, raw_text: null },
    ]
    const sections = groupUcdaForDisplay(clinicalResultsToUcda(rows)!)
    expect(sections).toHaveLength(1)
    expect(sections[0].label).toBeNull()
    expect(sections[0].items[0].name).toBe('A')
  })
})

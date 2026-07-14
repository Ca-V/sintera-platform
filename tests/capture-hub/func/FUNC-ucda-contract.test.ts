import { describe, it, expect } from 'vitest'
import { representationFromProcessor, clinicalResultsToUcda, type ClinicalResultRow } from '@/lib/capture/ucda'
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
  return (items?.items ?? []).map(it => ({
    clinical_model: model, result_kind: rk, item_type: it.itemType, name: it.name,
    value_text: it.valueText, value_num: it.valueNum ?? null, unit: it.unit ?? null,
    code: it.code ?? null, code_system: it.codeSystem ?? null, value_code: it.valueCode ?? null,
    region: it.region ?? null, anatomy: it.anatomy ?? null, method: it.method ?? null,
    context: it.context ?? null, group_label: it.group ?? null, reference_text: it.referenceText ?? null,
  }))
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
      region: null, anatomy: null, method: 'Hexoquinase', context: 'Jejum', group_label: null, reference_text: '70 – 99',
    }]
    const ucda = clinicalResultsToUcda(rows)!
    expect(ucda.items[0]).toMatchObject({ code: '2345-7', codeSystem: 'LOINC', method: 'Hexoquinase', context: 'Jejum', referenceText: '70 – 99' })
  })

  it('sem saída do processador → não há o que persistir (null)', () => {
    const empty: ProcessorResult = { output: null, clinicalModel: 'none', contractVersion: '-', extractedUnits: 0, notes: [] }
    expect(representationFromProcessor(empty)).toBeNull()
  })
})

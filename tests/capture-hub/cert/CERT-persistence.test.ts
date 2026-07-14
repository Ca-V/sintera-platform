import { describe, it, expect } from 'vitest'
import { ucdaItemToRow, clinicalResultsToUcda, type UcdaItem, type ClinicalResultRow } from '@/lib/capture/ucda'

// CERT — AUDITORIA DA PERSISTÊNCIA CANÔNICA (entrega 3, fundadora 14/07): confirmar que TODA informação
// clínica produzida pela plataforma é persistível SEM adaptação por modalidade. O modelo aberto suporta:
// parâmetros · biomarcadores · achados · classificações · medidas · estruturas anatômicas · lateralidade ·
// grupos · texto estruturado · e qualquer tipo futuro. Round-trip: UcdaItem → linha → UcdaItem (sem perda).

// Um item de CADA classe de informação clínica — todos pelo MESMO mapeador genérico.
const ITEMS: Record<string, UcdaItem> = {
  parametro:     { itemType: 'parameter', name: 'Ritmo de base', valueText: 'alfa 10 Hz' },
  biomarcador:   { itemType: 'measure', name: 'Hemoglobina', valueText: '13.5', valueNum: 13.5, unit: 'g/dL', specimen: 'SANGUE', group: 'HEMOGRAMA', referenceText: '12 – 16', code: '718-7', codeSystem: 'LOINC' },
  achado:        { itemType: 'finding', name: 'Nódulo', valueText: 'nódulo sólido de contornos regulares', anatomy: 'mama' },
  classificacao: { itemType: 'classification', name: 'BI-RADS', valueText: 'BI-RADS 2', valueCode: '2', codeSystem: 'BI-RADS' },
  medida:        { itemType: 'measure', name: 'Fração de ejeção', valueText: '62', valueNum: 62, unit: '%' },
  anatomia_lateralidade: { itemType: 'measure', name: 'Kmax', valueText: '45.3', valueNum: 45.3, unit: 'D', region: 'OD', anatomy: 'córnea', page: 2, excerpt: 'OD Kmax 45,3 D' },
  grupo:         { itemType: 'measure', name: 'LDL', valueText: '90', valueNum: 90, unit: 'mg/dL', group: 'Perfil lipídico' },
  texto:         { itemType: 'observation', name: 'Conclusão', valueText: 'exame dentro dos padrões de normalidade', method: 'leitura radiológica', context: 'rotina' },
}

// Reconstrói a linha completa (item + chaves) como o analyze grava.
const asRow = (it: UcdaItem, model: string, kind: string): ClinicalResultRow => ({
  clinical_model: model, result_kind: kind, ...ucdaItemToRow(it),
})

describe('CERT · Persistência canônica — qualquer informação clínica, sem adaptação por modalidade', () => {
  for (const [classe, item] of Object.entries(ITEMS)) {
    it(`representa e reconstrói: ${classe} (${item.itemType})`, () => {
      const row = asRow(item, 'qualquer-modelo', 'structured')
      const back = clinicalResultsToUcda([row])!
      const r = back.items[0]
      // toda informação preenchida no item volta idêntica (round-trip sem perda)
      for (const key of Object.keys(item) as (keyof UcdaItem)[]) {
        expect(r[key]).toEqual(item[key])
      }
    })
  }

  it('o mapeador é ÚNICO e genérico — mesma função para todos os tipos (sem ramo por modalidade)', () => {
    // Se algum tipo exigisse adaptação, precisaríamos de um mapeador por modalidade. Não precisamos:
    const rows = Object.values(ITEMS).map(it => asRow(it, 'm', 'structured'))
    const back = clinicalResultsToUcda(rows)!
    expect(back.items).toHaveLength(Object.keys(ITEMS).length)
  })

  it('tipo FUTURO desconhecido não quebra a persistência (degrada para observation)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const futuro = { itemType: 'tipo-que-ainda-nao-existe' as any, name: 'X', valueText: 'v' } as UcdaItem
    const back = clinicalResultsToUcda([asRow(futuro, 'm', 'structured')])!
    expect(back.items[0].name).toBe('X')
    expect(back.items[0].itemType).toBe('observation') // fallback seguro, sem alteração estrutural
  })
})

import { describe, it, expect } from 'vitest'
import { segment } from '@/lib/capture/segmentation'
import { structuralAnalysis, type StructuralRepresentation } from '@/lib/capture/structural-analysis'

// FUNC — Segmentação (3ª etapa). Recebe o ARTEFATO da Análise Estrutural (por página) e decide quantas
// CDUs, sem extrair. Fronteira: laboratório (results) = 1 CDU com N resultados internos; laudos
// narrativos distintos = N CDUs.

// Helper: Análise Estrutural por página → artefatos (é o que o pipeline faz antes de segmentar).
const structs = (pages: string[]): StructuralRepresentation[] =>
  pages.map(t => structuralAnalysis({ text: t, pageCount: 1 }))

const LAB_PAGES = [
  `MATERIAL - SANGUE\nGLICEMIA - JEJUM\nMÉTODO: COLORIMÉTRICO\nRESULTADO: 85 mg/dL\nVALORES DE REFERÊNCIA: 60 A 99`,
  `MATERIAL - SANGUE\nCORTISOL\nMÉTODO: QUIMIOLUMINESCÊNCIA\nRESULTADO: 16,5 MCG/DL\nVALORES DE REFERÊNCIA: 5 A 25`,
  `MATERIAL - SANGUE\nIGF-1 - SOMATOMEDINA C\nRESULTADO: 149 ng/mL\nVALORES DE REFERÊNCIA: 117 A 329`,
  `MATERIAL - SANGUE\nHORMÔNIO DE CRESCIMENTO (GH)\nRESULTADO: 7,55 ng/mL\nMATERIAL - SANGUE\nINSULINA\nRESULTADO: 10,7 MICRO UN/mL\nPEPTÍDEO C\nRESULTADO: 1,8 ng/mL\nVALOR DE REFERÊNCIA: 0,9 A 7,1`,
]

const IMG_PAGES = [
  `MAMOGRAFIA DIGITAL\nIndicação clínica: Rastreamento.\nTécnica: incidências crânio-caudal e médio-lateral.\nAchados: parênquima mamário heterogêneo.\nConclusão: BI-RADS 2.`,
  `ULTRASSONOGRAFIA DAS MAMAS E AXILAS\nIndicação clínica: Rastreamento.\nTécnica: modo bidimensional.\nAchados: ecotextura heterogênea. Mama direita sem nódulos.\nConclusão: sem alterações.`,
  `ULTRASSONOGRAFIA PÉLVICA ENDOVAGINAL\nIndicação clínica: dor pélvica.\nAchados: útero de dimensões normais.\nConclusão: exame dentro dos limites.`,
]

describe('FUNC · segment', () => {
  it('laudo laboratorial (6 exames, 4 páginas) → 1 CDU com 6 unidades internas', () => {
    const r = segment(structs(LAB_PAGES))
    expect(r.cdus).toHaveLength(1)
    expect(r.cdus[0].kind).toBe('results')
    expect(r.cdus[0].pages).toEqual([1, 2, 3, 4])
    expect(r.cdus[0].discoveredUnits).toBe(6)
  })

  it('PDF com 3 laudos de imagem distintos → 3 CDUs (uma por laudo)', () => {
    const r = segment(structs(IMG_PAGES))
    expect(r.cdus).toHaveLength(3)
    expect(r.cdus.every(c => c.kind === 'narrative')).toBe(true)
    expect(r.cdus.map(c => c.pages)).toEqual([[1], [2], [3]])
    expect(r.cdus[0].title?.toUpperCase()).toContain('MAMOGRAFIA')
  })

  it('laudo narrativo multipágina (mesmo título) → 1 CDU', () => {
    const r = segment(structs([
      `ELETROENCEFALOGRAMA\nTécnica: registro em vigília.\nAchados: ritmo de base alfa.`,
      `ELETROENCEFALOGRAMA\nAchados (continuação): hiperventilação sem alterações.\nConclusão: EEG normal.`,
    ]))
    expect(r.cdus).toHaveLength(1)
    expect(r.cdus[0].pages).toEqual([1, 2])
  })

  it('é DETERMINÍSTICA', () => {
    expect(JSON.stringify(segment(structs(IMG_PAGES)))).toBe(JSON.stringify(segment(structs(IMG_PAGES))))
  })

  it('bundle vazio → 1 CDU unknown, não quebra', () => {
    const r = segment([])
    expect(r.cdus).toHaveLength(1)
    expect(r.cdus[0].kind).toBe('unknown')
  })
})

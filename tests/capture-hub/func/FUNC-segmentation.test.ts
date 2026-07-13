import { describe, it, expect } from 'vitest'
import { segment } from '@/lib/capture/segmentation'

// FUNC — Segmentação (3ª etapa). Recebe a estrutura (por página) e decide quantas CDUs, sem extrair.
// Fronteira: laboratório (results) = 1 CDU com N resultados internos; laudos narrativos distintos = N CDUs.

// Laudo laboratorial: 6 exames em 4 páginas (results-style em todas) → 1 CDU, 6 unidades internas.
const LAB_PAGES = [
  `MATERIAL - SANGUE\nGLICEMIA - JEJUM\nMÉTODO: COLORIMÉTRICO\nRESULTADO: 85 mg/dL\nVALORES DE REFERÊNCIA: 60 A 99`,
  `MATERIAL - SANGUE\nCORTISOL\nMÉTODO: QUIMIOLUMINESCÊNCIA\nRESULTADO: 16,5 MCG/DL\nVALORES DE REFERÊNCIA: 5 A 25`,
  `MATERIAL - SANGUE\nIGF-1 - SOMATOMEDINA C\nRESULTADO: 149 ng/mL\nVALORES DE REFERÊNCIA: 117 A 329`,
  `MATERIAL - SANGUE\nHORMÔNIO DE CRESCIMENTO (GH)\nRESULTADO: 7,55 ng/mL\nMATERIAL - SANGUE\nINSULINA\nRESULTADO: 10,7 MICRO UN/mL\nPEPTÍDEO C\nRESULTADO: 1,8 ng/mL\nVALOR DE REFERÊNCIA: 0,9 A 7,1`,
]

// PDF com 3 laudos de imagem DISTINTOS (cada um narrativo, com seu título) → 3 CDUs.
const IMG_PAGES = [
  `MAMOGRAFIA DIGITAL\nIndicação clínica: Rastreamento.\nTécnica: incidências crânio-caudal e médio-lateral.\nAchados: parênquima mamário heterogêneo.\nConclusão: BI-RADS 2.`,
  `ULTRASSONOGRAFIA DAS MAMAS E AXILAS\nIndicação clínica: Rastreamento.\nTécnica: modo bidimensional.\nAchados: ecotextura heterogênea. Mama direita sem nódulos.\nConclusão: sem alterações.`,
  `ULTRASSONOGRAFIA PÉLVICA ENDOVAGINAL\nIndicação clínica: dor pélvica.\nAchados: útero de dimensões normais.\nConclusão: exame dentro dos limites.`,
]

describe('FUNC · segment', () => {
  it('laudo laboratorial (6 exames, 4 páginas) → 1 CDU com 6 unidades internas', () => {
    const r = segment({ pageTexts: LAB_PAGES })
    expect(r.cdus).toHaveLength(1)
    expect(r.cdus[0].kind).toBe('results')
    expect(r.cdus[0].pages).toEqual([1, 2, 3, 4])
    expect(r.cdus[0].discoveredUnits).toBe(6) // 1+1+1+3 RESULTADO
  })

  it('PDF com 3 laudos de imagem distintos → 3 CDUs (uma por laudo)', () => {
    const r = segment({ pageTexts: IMG_PAGES })
    expect(r.cdus).toHaveLength(3)
    expect(r.cdus.every(c => c.kind === 'narrative')).toBe(true)
    expect(r.cdus.map(c => c.pages)).toEqual([[1], [2], [3]])
    expect(r.cdus[0].title?.toUpperCase()).toContain('MAMOGRAFIA')
  })

  it('laudo narrativo multipágina (mesmo título) → 1 CDU', () => {
    const r = segment({
      pageTexts: [
        `ELETROENCEFALOGRAMA\nTécnica: registro em vigília.\nAchados: ritmo de base alfa.`,
        `ELETROENCEFALOGRAMA\nAchados (continuação): hiperventilação sem alterações.\nConclusão: EEG normal.`,
      ],
    })
    expect(r.cdus).toHaveLength(1)
    expect(r.cdus[0].pages).toEqual([1, 2])
  })

  it('é DETERMINÍSTICA', () => {
    expect(JSON.stringify(segment({ pageTexts: IMG_PAGES }))).toBe(JSON.stringify(segment({ pageTexts: IMG_PAGES })))
  })

  it('bundle vazio → nenhuma CDU quebra o fluxo', () => {
    const r = segment({ pageTexts: [] })
    expect(r.cdus).toHaveLength(1) // 1 CDU vazia (unknown), não quebra
    expect(r.cdus[0].kind).toBe('unknown')
  })
})

import { describe, it, expect } from 'vitest'
import { processBundle } from '@/lib/capture/clinical-information-pipeline'

// FUNC — Identity Validator (4ª etapa) via o orquestrador (ClinicalInformationPipeline). Valida a
// Segmentação inteira e produz CDUs CERTIFICADAS (contrato único, versionado). Fail-safe: fronteira
// incerta → needs_review TÉCNICO (bloqueia), nunca escolha silenciosa.

const LAB_PAGES = [
  `MATERIAL - SANGUE\nGLICEMIA - JEJUM\nRESULTADO: 85 mg/dL\nVALORES DE REFERÊNCIA: 60 A 99\nData: 11/05/2009`,
  `MATERIAL - SANGUE\nCORTISOL\nRESULTADO: 16,5 MCG/DL\nVALORES DE REFERÊNCIA: 5 A 25`,
]

const IMG_3_DISTINTOS = [
  `MAMOGRAFIA DIGITAL\nIndicação clínica: Rastreamento.\nAchados: parênquima heterogêneo.\nConclusão: BI-RADS 2.`,
  `ULTRASSONOGRAFIA DAS MAMAS\nTécnica: bidimensional.\nAchados: ecotextura heterogênea.\nConclusão: normal.`,
  `ULTRASSONOGRAFIA PÉLVICA\nAchados: útero normal.\nConclusão: dentro dos limites.`,
]

describe('FUNC · validateSegmentation (via pipeline)', () => {
  it('laudo laboratorial → 1 CDU CERTIFICADA v1 (alta confiança)', () => {
    const v = processBundle({ pageTexts: LAB_PAGES })
    expect(v.cdus).toHaveLength(1)
    expect(v.cdus[0].status).toBe('certified')
    expect(v.cdus[0].contractVersion).toBe('v1')
    expect(v.cdus[0].fingerprint).toMatch(/^[0-9a-f]{64}$/)
    expect(v.ready).toHaveLength(1)
    expect(v.blockedTechnical).toHaveLength(0)
  })

  it('3 laudos de imagem DISTINTOS → 3 CDUs certificadas', () => {
    const v = processBundle({ pageTexts: IMG_3_DISTINTOS })
    expect(v.cdus).toHaveLength(3)
    expect(v.ready).toHaveLength(3)
  })

  it('título corrompido (OCR) → needs_review TÉCNICO, bloqueia', () => {
    const v = processBundle({ pageTexts: [`䌀䄀刀䤀一䄀 倀䄀一䄀䌀䄀一\nAchados: xxx.\nConclusão: yyy.`] })
    expect(v.cdus[0].status).toBe('needs_review')
    expect(v.cdus[0].reviewType).toBe('technical')
    expect(v.blockedTechnical).toHaveLength(1)
    expect(v.ready).toHaveLength(0)
  })

  it('super-segmentação (olho direito + esquerdo, mesma data) → needs_review técnico nos dois', () => {
    const v = processBundle({ pageTexts: [
      `MAPEAMENTO DE RETINA OLHO DIREITO\nData: 12/03/2026\nAchados: normal.\nConclusão: sem alterações.`,
      `MAPEAMENTO DE RETINA OLHO ESQUERDO\nData: 12/03/2026\nAchados: normal.\nConclusão: sem alterações.`,
    ] })
    expect(v.cdus.every(c => c.status === 'needs_review' && c.reviewType === 'technical')).toBe(true)
    expect(v.cdus.some(c => c.issues.some(i => /super-segmenta/.test(i)))).toBe(true)
    expect(v.blockedTechnical).toHaveLength(2)
  })

  it('é DETERMINÍSTICA', () => {
    expect(JSON.stringify(processBundle({ pageTexts: IMG_3_DISTINTOS })))
      .toBe(JSON.stringify(processBundle({ pageTexts: IMG_3_DISTINTOS })))
  })
})

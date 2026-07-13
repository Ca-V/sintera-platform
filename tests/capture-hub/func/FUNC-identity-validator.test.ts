import { describe, it, expect } from 'vitest'
import { segment } from '@/lib/capture/segmentation'
import { validateSegmentation } from '@/lib/capture/identity-validator'

// FUNC — Identity Validator (4ª etapa). Valida a Segmentação inteira (identidade + fronteiras +
// continuidade + coerência) e produz CDUs CERTIFICADAS (contrato único de entrada dos extratores).
// Fail-safe: fronteira incerta → needs_review, nunca escolha silenciosa.

const LAB_PAGES = [
  `MATERIAL - SANGUE\nGLICEMIA - JEJUM\nRESULTADO: 85 mg/dL\nVALORES DE REFERÊNCIA: 60 A 99\nData: 11/05/2009`,
  `MATERIAL - SANGUE\nCORTISOL\nRESULTADO: 16,5 MCG/DL\nVALORES DE REFERÊNCIA: 5 A 25`,
]

const IMG_3_DISTINTOS = [
  `MAMOGRAFIA DIGITAL\nIndicação clínica: Rastreamento.\nAchados: parênquima heterogêneo.\nConclusão: BI-RADS 2.`,
  `ULTRASSONOGRAFIA DAS MAMAS\nTécnica: bidimensional.\nAchados: ecotextura heterogênea.\nConclusão: normal.`,
  `ULTRASSONOGRAFIA PÉLVICA\nAchados: útero normal.\nConclusão: dentro dos limites.`,
]

describe('FUNC · validateSegmentation', () => {
  it('laudo laboratorial → 1 CDU CERTIFICADA (alta confiança)', () => {
    const v = validateSegmentation(segment({ pageTexts: LAB_PAGES }))
    expect(v.cdus).toHaveLength(1)
    expect(v.cdus[0].status).toBe('certified')
    expect(v.cdus[0].fingerprint).toMatch(/^[0-9a-f]{64}$/)
    expect(v.allCertified).toBe(true)
  })

  it('3 laudos de imagem DISTINTOS → 3 CDUs certificadas', () => {
    const v = validateSegmentation(segment({ pageTexts: IMG_3_DISTINTOS }))
    expect(v.cdus).toHaveLength(3)
    expect(v.allCertified).toBe(true)
  })

  it('título corrompido (OCR) → needs_review, NÃO certifica', () => {
    const v = validateSegmentation(segment({
      pageTexts: [`䌀䄀刀䤀一䄀 倀䄀一䄀䌀䄀一\nAchados: xxx.\nConclusão: yyy.`],
    }))
    expect(v.cdus[0].status).toBe('needs_review')
    expect(v.allCertified).toBe(false)
  })

  it('super-segmentação (olho direito + olho esquerdo, mesma data) → needs_review nos dois', () => {
    const v = validateSegmentation(segment({
      pageTexts: [
        `MAPEAMENTO DE RETINA OLHO DIREITO\nData: 12/03/2026\nAchados: normal.\nConclusão: sem alterações.`,
        `MAPEAMENTO DE RETINA OLHO ESQUERDO\nData: 12/03/2026\nAchados: normal.\nConclusão: sem alterações.`,
      ],
    }))
    // A Segmentação vê 2 laudos (títulos distintos); o Validator sinaliza que podem ser 1 exame.
    expect(v.cdus.every(c => c.status === 'needs_review')).toBe(true)
    expect(v.cdus.some(c => c.issues.some(i => /super-segmenta/.test(i)))).toBe(true)
  })

  it('é DETERMINÍSTICA', () => {
    const a = validateSegmentation(segment({ pageTexts: IMG_3_DISTINTOS }))
    const b = validateSegmentation(segment({ pageTexts: IMG_3_DISTINTOS }))
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })
})

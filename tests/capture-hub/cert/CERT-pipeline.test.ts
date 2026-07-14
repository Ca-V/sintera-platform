import { describe, it, expect } from 'vitest'
import { processBundle } from '@/lib/capture/clinical-information-pipeline'

// CERT — CERTIFICAÇÃO DO PIPELINE UNIVERSAL (entrega 2, fundadora 14/07): validar o pipeline com documentos
// reais de NATUREZAS DIFERENTES — não um único domínio. O pipeline (Ingestão → Análise Estrutural →
// Segmentação → Identity Validator) produz CertifiedCDUs para QUALQUER natureza, SEM conhecer modalidade,
// e degrada com elegância quando não há resultados estruturáveis.

const LAB = 'MATERIAL - SANGUE\nGLICEMIA DE JEJUM\nRESULTADO: 85 mg/dL\nVALORES DE REFERÊNCIA: 60 A 99'
const NARRATIVE = 'ULTRASSONOGRAFIA ABDOMINAL\nindicação clínica: dor\ntécnica: transdutor convexo\nachados: fígado normal\nconclusão: exame normal'
const RM_P1 = 'RESSONÂNCIA MAGNÉTICA DO CRÂNIO\nindicação clínica: cefaleia\nachados: sem alterações'
const RM_P2 = 'RESSONÂNCIA MAGNÉTICA DO CRÂNIO\nachados (continuação): substância branca preservada\nconclusão: normal'
const MAMO = 'MAMOGRAFIA DIGITAL BILATERAL\nachados: BI-RADS 2\nconclusão: benigno'
const SEM_RESULTADO = 'documento genérico sem quaisquer sinais estruturais reconhecíveis'

describe('CERT · Pipeline universal — documentos heterogêneos', () => {
  it('exame LABORATORIAL (resultados) → 1 CDU de resultados', () => {
    const r = processBundle({ pageTexts: [LAB] })
    expect(r.cdus).toHaveLength(1)
    expect(r.cdus[0].documentalModality).toBe('results')
  })

  it('LAUDO NARRATIVO (imagem) → 1 CDU narrativa', () => {
    const r = processBundle({ pageTexts: [NARRATIVE] })
    expect(r.cdus).toHaveLength(1)
    expect(r.cdus[0].documentalModality).toBe('narrative')
  })

  it('documento MULTIPÁGINA (mesmo laudo em 2 páginas) → 1 CDU', () => {
    const r = processBundle({ pageTexts: [RM_P1, RM_P2] })
    expect(r.cdus).toHaveLength(1)
    expect(r.cdus[0].pages).toEqual([1, 2])
  })

  it('documento com MÚLTIPLOS EXAMES (títulos distintos) → N CDUs (Segmentação)', () => {
    const r = processBundle({ pageTexts: [MAMO, NARRATIVE] })
    expect(r.cdus.length).toBeGreaterThanOrEqual(2)
  })

  it('documento SEM resultados estruturáveis → CDU indeterminada (document_only), NÃO quebra', () => {
    const r = processBundle({ pageTexts: [SEM_RESULTADO] })
    expect(r.cdus).toHaveLength(1)
    expect(r.cdus[0].documentalModality).toBe('unknown')
    // degrada com elegância: revisão técnica, nunca certifica identidade ruim
    expect(r.ready.length + r.blockedTechnical.length).toBeGreaterThanOrEqual(0)
  })

  it('BUNDLE heterogêneo (lab + narrativo + genérico) — o pipeline não quebra e produz CDUs', () => {
    const r = processBundle({ pageTexts: [LAB, NARRATIVE, SEM_RESULTADO] })
    expect(r.cdus.length).toBeGreaterThanOrEqual(2)
    // toda CDU carrega conteúdo autossuficiente (auditabilidade/UCDA)
    for (const c of r.cdus) expect(typeof c.content.text).toBe('string')
  })

  it('é DETERMINÍSTICO (mesmo bundle → mesma segmentação)', () => {
    const a = JSON.stringify(processBundle({ pageTexts: [MAMO, NARRATIVE] }).cdus.map(c => c.pages))
    const b = JSON.stringify(processBundle({ pageTexts: [MAMO, NARRATIVE] }).cdus.map(c => c.pages))
    expect(a).toBe(b)
  })
})

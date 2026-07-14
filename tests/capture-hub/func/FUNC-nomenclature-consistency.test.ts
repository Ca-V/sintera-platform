// FUNC · E2 — Nomenclatura ÚNICA e consistente (garantia de invariância).
//
// A convenção de nomes já é certificada em ARCH-002 (document-naming.arch). Esta suíte trava a
// dimensão que E2 exige e o ARCH não afirma explicitamente: CONSISTÊNCIA — exames EQUIVALENTES
// recebem o MESMO nome, "sem variação". O nome não pode depender da ORDEM dos biomarcadores,
// nem dos VALORES medidos, nem de ruído textual do laudo. É uma propriedade de invariância
// (irmã da Reprodutibilidade): mesma origem lógica → mesma identidade documental.

import { describe, it, expect } from 'vitest'
import {
  classifyExamDocument,
  deriveDisplayTitle,
  type ExamExtractionLike,
} from '@/lib/capture/document-naming'

const title = (ex: ExamExtractionLike) => deriveDisplayTitle(classifyExamDocument(ex))

describe('E2 · invariância à ORDEM dos biomarcadores', () => {
  it('painel: reverter a ordem não muda o nome', () => {
    const bm = [
      { name: 'TSH', sourceExamName: 'TSH' },
      { name: 'T4 livre', sourceExamName: 'T4 LIVRE' },
      { name: 'T3', sourceExamName: 'T3' },
    ]
    expect(title({ examType: 'tireoide', biomarkers: bm }))
      .toBe(title({ examType: 'tireoide', biomarkers: [...bm].reverse() }))
  })

  it('documento composto (sangue+urina): qualquer ordem → "Exames laboratoriais"', () => {
    const bm = [
      { name: 'IgE látex', sourceExamName: 'IGE ESPECÍFICO LÁTEX' },
      { name: 'Hemoglobina', sourceExamName: 'HEMOGRAMA' },
      { name: 'Densidade', sourceExamName: 'URINA ROTINA' },
    ]
    // primeiro biomarcador varia — o nome NÃO pode seguir o primeiro item
    for (let i = 0; i < bm.length; i++) {
      const rotated = [...bm.slice(i), ...bm.slice(0, i)]
      expect(title({ examType: 'laboratorial', biomarkers: rotated })).toBe('Exames laboratoriais')
    }
  })
})

describe('E2 · invariância aos VALORES (dois exames do mesmo tipo → mesmo nome)', () => {
  it('hemograma com hemoglobinas diferentes → mesmo nome', () => {
    const mk = (v: string): ExamExtractionLike => ({
      examType: 'Hemograma',
      biomarkers: [
        { name: 'Hemoglobina', sourceExamName: 'Hemograma completo' },
        { name: 'Hematócrito', sourceExamName: 'Hemograma completo' },
      ],
      text: `Hemoglobina ${v} g/dL`,
    })
    expect(title(mk('13.1'))).toBe(title(mk('9.4')))
    expect(title(mk('13.1'))).toBe('Hemograma completo')
  })
})

describe('E2 · idempotência (mesma entrada → mesma saída, sempre)', () => {
  it('chamar duas vezes devolve exatamente o mesmo título', () => {
    const ex: ExamExtractionLike = {
      examType: 'Ultrassonografia das mamas',
      biomarkers: [{ name: 'Nódulo', sourceExamName: 'Ultrassonografia das mamas e axilas' }],
    }
    expect(title(ex)).toBe(title({ ...ex, biomarkers: [...ex.biomarkers] }))
  })
})

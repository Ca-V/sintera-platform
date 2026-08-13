import { describe, it, expect } from 'vitest'
import { structuredPossibleFor, parseUnderstanding } from '@/lib/capture/document-understanding'

// FUNC — Document Understanding Engine (DUE): responde "o que EXISTE no documento?" (FATOS + evidências) e produz
// um RELATÓRIO AUDITÁVEL por atributo (origem · confiança · razão de ausência). O NOME canônico é do Terminology
// Service (ver FUNC-terminology-service).

describe('FUNC · DUE — structuredPossible por modalidade (document_only)', () => {
  it('imagem/oftalmologia → document_only; laboratorial/desconhecido → estruturável', () => {
    expect(structuredPossibleFor('imaging')).toBe(false)
    expect(structuredPossibleFor('ophthalmology')).toBe(false)
    expect(structuredPossibleFor('laboratory')).toBe(true)
    expect(structuredPossibleFor(null)).toBe(true)
  })
})

describe('FUNC · DUE — relatório AUDITÁVEL (origem/confiança + razão de ausência)', () => {
  it('campos por objeto → report com origem/confiança; ausência traz RAZÃO (não só null)', () => {
    const du = parseUnderstanding({
      document_type: 'ophthalmology', document_language: 'pt', evidence: ['Pentacam', 'Topografia'],
      fields: {
        exam_name: { value: 'Topografia da córnea', confidence: 'high', absence_reason: null },
        device: { value: 'OCULUS Pentacam', confidence: 'high' },
        exam_date: { value: null, confidence: null, absence_reason: 'illegible' },
        patient_name: { value: null, absence_reason: 'not_found' },
        issuer: { value: 'OCULUS', confidence: 'medium' },
      },
    }, 'vision')
    // fatos achatados p/ consumidores
    expect(du.examName).toBe('Topografia da córnea')
    expect(du.device).toBe('OCULUS Pentacam')
    expect(du.examDate).toBeNull()
    // relatório auditável
    expect(du.report.examNameCandidate).toEqual({ value: 'Topografia da córnea', source: 'vision', confidence: 'high', absenceReason: null })
    expect(du.report.examDate).toEqual({ value: null, source: 'none', confidence: null, absenceReason: 'illegible' })
    expect(du.report.patientName.absenceReason).toBe('not_found')
    expect(du.report.device.source).toBe('vision')
    expect(du.report.evidence).toEqual(['Pentacam', 'Topografia'])
    expect(du.report.documentLanguage).toBe('pt')
  })

  it('data presente mas fora do formato ISO → tratada como ILEGÍVEL (auditável), não silenciada', () => {
    const du = parseUnderstanding({ document_type: 'laboratory', fields: { exam_date: { value: '18/03/2026', confidence: 'high' } } }, 'vision')
    expect(du.examDate).toBeNull()
    expect(du.report.examDate.absenceReason).toBe('illegible')
  })

  it('compat: campos como string simples ainda parseiam; ausente → absenceReason not_found', () => {
    const du = parseUnderstanding({ document_type: 'laboratory', fields: { exam_name: 'Hemograma completo' } }, 'vision')
    expect(du.examName).toBe('Hemograma completo')
    expect(du.report.examNameCandidate.value).toBe('Hemograma completo')
    expect(du.report.device.absenceReason).toBe('not_found')  // não informado → razão, não só null
    expect(du.structuredPossible).toBe(true)
  })
})

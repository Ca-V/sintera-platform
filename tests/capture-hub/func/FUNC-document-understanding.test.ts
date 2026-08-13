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
    expect(du.report.examNameCandidate).toMatchObject({ value: 'Topografia da córnea', source: 'vision', confidence: 'high', absenceReason: null })
    expect(du.report.examDate).toMatchObject({ value: null, source: 'none', confidence: null, absenceReason: 'illegible' })
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

  it('NOTA diagnóstica é capturada (o relatório se explica sozinho)', () => {
    const du = parseUnderstanding({
      document_type: 'ophthalmology',
      fields: { exam_date: { value: null, absence_reason: 'not_found', note: 'nenhuma data visível no laudo' } },
    }, 'vision')
    expect(du.report.examDate.absenceReason).toBe('not_found')
    expect(du.report.examDate.note).toBe('nenhuma data visível no laudo')
  })

  it('ROBUSTEZ — nota longa de datas NÃO é truncada em 200 (raciocínio preservado; corta só além de 600)', () => {
    const longNote = 'Datas vistas: ' + '12/2025 (calibração), 22/07/2026 (aquisição), 03/1980 (nascimento). '.repeat(6)
    const du = parseUnderstanding({ document_type: 'ophthalmology', fields: { exam_date: { value: null, absence_reason: 'low_confidence', note: longNote } } }, 'vision')
    expect((du.report.examDate.note ?? '').length).toBeGreaterThan(200)   // não trunca mais em 200
    expect((du.report.examDate.note ?? '').length).toBeLessThanOrEqual(600)
  })

  it('ROBUSTEZ — entrada adversa: tipo desconhecido, evidência não-array, campos ausentes → defaults seguros', () => {
    const du = parseUnderstanding({ document_type: 42 as unknown as string, evidence: { x: 1 } as unknown as unknown[], fields: {} }, 'vision')
    expect(du.documentType).toBe('unknown')
    expect(du.evidence).toEqual([])
    expect(du.examName).toBeNull()
    expect(du.report.examDate.absenceReason).toBe('not_found')  // ausência sempre tem razão
    expect(du.structuredPossible).toBe(true)
  })

  it('compat: campos como string simples ainda parseiam; ausente → absenceReason not_found', () => {
    const du = parseUnderstanding({ document_type: 'laboratory', fields: { exam_name: 'Hemograma completo' } }, 'vision')
    expect(du.examName).toBe('Hemograma completo')
    expect(du.report.examNameCandidate.value).toBe('Hemograma completo')
    expect(du.report.device.absenceReason).toBe('not_found')  // não informado → razão, não só null
    expect(du.structuredPossible).toBe(true)
  })
})

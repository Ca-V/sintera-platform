import { describe, it, expect } from 'vitest'
import { structuredPossibleFor, parseUnderstanding } from '@/lib/capture/document-understanding'

// FUNC — Document Understanding Engine (DUE): responde "o que EXISTE no documento?" (FATOS + evidências).
// O NOME do exame NÃO é decidido aqui (é do Terminology Service — ver FUNC-terminology-service).

describe('FUNC · DUE — structuredPossible por modalidade (document_only)', () => {
  it('imagem/oftalmologia → document_only; laboratorial/desconhecido → estruturável', () => {
    expect(structuredPossibleFor('imaging')).toBe(false)
    expect(structuredPossibleFor('ophthalmology')).toBe(false)
    expect(structuredPossibleFor('laboratory')).toBe(true)
    expect(structuredPossibleFor('')).toBe(true)
    expect(structuredPossibleFor(null)).toBe(true)
  })
})

describe('FUNC · DUE — parseUnderstanding (fatos + evidências; determinístico)', () => {
  it('separa equipamento (device) de nome; valida data ISO; coleta evidências; deriva structuredPossible', () => {
    const parsed = parseUnderstanding({
      document_type: 'ophthalmology', original_title: 'OCULUS Pentacam', exam_name: null,
      device: 'OCULUS Pentacam HR', exam_category: 'Oftalmologia', exam_date: '2026-03-18',
      evidence: ['Pentacam', 'Scheimpflug'], patient_name: 'Fulana', confidence: 'medium',
    })
    expect(parsed.device).toBe('OCULUS Pentacam HR')
    expect(parsed.examName).toBeNull()               // equipamento não vira exam_name
    expect(parsed.structuredPossible).toBe(false)    // derivado do tipo, não confia no modelo
    expect(parsed.examDate).toBe('2026-03-18')
    expect(parsed.evidence).toEqual(['Pentacam', 'Scheimpflug'])
    expect(parsed.patientName).toBe('Fulana')
  })
  it('data inválida e "null" textual viram null; evidência não-array → []; confidence desconhecida → medium', () => {
    const parsed = parseUnderstanding({ document_type: 'laboratory', exam_date: '18/03/2026', issuer: 'null', evidence: 'x', confidence: 'xxx' })
    expect(parsed.examDate).toBeNull()
    expect(parsed.issuer).toBeNull()
    expect(parsed.evidence).toEqual([])
    expect(parsed.confidence).toBe('medium')
    expect(parsed.structuredPossible).toBe(true)
  })
})

import { describe, it, expect } from 'vitest'
import { resolveDocumentIdentity, normalizeExamName, structuredPossibleFor, parseUnderstanding } from '@/lib/capture/document-understanding'

// FUNC — Document Understanding Engine (DUE): regras PURAS e permanentes.
// Trava a ARQUITETURA (fundadora 13/08): EQUIPAMENTO ≠ EXAME; o nome canônico vem da Base de Conhecimento,
// nunca do equipamento nem de uma linha do laudo; document_only por modalidade.

const base = { device: null, originalTitle: null, examModality: null, examName: null, examCategory: null, confidence: 'medium' as const }

describe('FUNC · DUE — nome canônico (Base de Conhecimento; equipamento ≠ exame)', () => {
  it('Pentacam (equipamento) → nome GENÉRICO do segmento anterior + confiança média — NUNCA "OCULUS Pentacam"', () => {
    const r = normalizeExamName({ ...base, device: 'OCULUS Pentacam HR', originalTitle: 'OCULUS Pentacam' })
    expect(r.name).toBe('Exame do segmento anterior (Pentacam)')
    expect(r.confidence).toBe('medium')
    expect(r.name).not.toBe('OCULUS Pentacam HR')   // equipamento não é o nome
    expect(r.name).not.toBe('OCULUS Pentacam')
  })
  it('equipamentos reconhecidos → nome canônico da taxonomia', () => {
    expect(normalizeExamName({ ...base, device: 'Humphrey Field Analyzer' }).name).toBe('Campo visual computadorizado')
    expect(normalizeExamName({ ...base, device: 'Zeiss Cirrus OCT' }).name).toBe('Tomografia de coerência óptica (OCT)')
    expect(normalizeExamName({ ...base, device: 'CEM-530', originalTitle: 'Specular Microscopy' }).name).toBe('Microscopia especular da córnea')
  })
  it('sem KB: usa o nome EXPLÍCITO do documento; nunca o equipamento', () => {
    expect(normalizeExamName({ ...base, examName: 'Hemograma completo' }).name).toBe('Hemograma completo')
    // só modalidade → usa modalidade; só categoria → "Exame de <categoria>" (genérico, baixa confiança)
    expect(normalizeExamName({ ...base, examModality: 'Ultrassonografia das mamas' }).name).toBe('Ultrassonografia das mamas')
    const cat = normalizeExamName({ ...base, examCategory: 'Cardiologia' })
    expect(cat.name).toBe('Exame de Cardiologia'); expect(cat.confidence).toBe('low')
  })
  it('nada identificável → null (o chamador decide o vazio)', () => {
    expect(normalizeExamName(base).name).toBeNull()
  })
  it('resolveDocumentIdentity delega ao nome canônico (não expõe equipamento)', () => {
    expect(resolveDocumentIdentity({ ...base, device: 'OCULUS Pentacam HR' })).toBe('Exame do segmento anterior (Pentacam)')
  })
})

describe('FUNC · DUE — structuredPossible por modalidade (document_only)', () => {
  it('imagem e oftalmologia → document_only; laboratorial/desconhecido → estruturável', () => {
    expect(structuredPossibleFor('imaging')).toBe(false)
    expect(structuredPossibleFor('ophthalmology')).toBe(false)
    expect(structuredPossibleFor('laboratory')).toBe(true)
    expect(structuredPossibleFor('')).toBe(true)
    expect(structuredPossibleFor(null)).toBe(true)
  })
})

describe('FUNC · DUE — parseUnderstanding (normalização determinística)', () => {
  it('separa equipamento (device) de nome; data ISO validada; structuredPossible derivado do tipo', () => {
    const du = parseUnderstanding({
      document_type: 'ophthalmology', original_title: 'OCULUS Pentacam', exam_name: null,
      device: 'OCULUS Pentacam HR', exam_category: 'Oftalmologia', exam_modality: 'Tomografia do segmento anterior',
      exam_date: '2026-03-18', patient_name: 'Fulana', issuer: 'OCULUS', physician: null,
      document_language: 'pt', confidence: 'medium',
    })
    expect(du.device).toBe('OCULUS Pentacam HR')
    expect(du.examName).toBeNull()                          // equipamento não vira exam_name
    expect(du.structuredPossible).toBe(false)               // derivado, não confia no modelo
    expect(du.examDate).toBe('2026-03-18')
    expect(resolveDocumentIdentity(du)).toBe('Exame do segmento anterior (Pentacam)')
  })
  it('data inválida e "null" textual viram null; confidence desconhecida → medium', () => {
    const du = parseUnderstanding({ document_type: 'laboratory', exam_date: '18/03/2026', issuer: 'null', confidence: 'xxx' })
    expect(du.examDate).toBeNull()
    expect(du.issuer).toBeNull()
    expect(du.confidence).toBe('medium')
    expect(du.structuredPossible).toBe(true)
  })
})

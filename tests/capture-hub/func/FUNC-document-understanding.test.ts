import { describe, it, expect } from 'vitest'
import { resolveExamIdentity, resolveDocumentIdentity, structuredPossibleFor, parseUnderstanding } from '@/lib/capture/document-understanding'

// FUNC — Document Understanding Engine (DUE): regras PURAS, baseadas em EVIDÊNCIAS.
// Trava a ARQUITETURA (fundadora 13/08): EQUIPAMENTO ≠ EXAME · IA é fonte de evidência, não decide o nome ·
// nome por FAIXA DE CONFIANÇA (nunca fabrica) · PROVENIÊNCIA auditável (provisório até terminologia oficial).

const du = (over: Record<string, unknown> = {}) => ({
  device: null, originalTitle: null, examModality: null, examName: null, examCategory: null,
  evidence: [] as string[], confidence: 'medium' as const, ...over,
})

describe('FUNC · DUE — identidade por evidências (equipamento ≠ exame; não fabrica)', () => {
  it('Pentacam SEM sinal de protocolo → MÉDIA: nomeia pelo equipamento, não afirma o exame', () => {
    const r = resolveExamIdentity(du({ device: 'OCULUS Pentacam HR', examCategory: 'Oftalmologia', originalTitle: 'OCULUS Pentacam' }))
    expect(r.name).toBe('Exame oftalmológico realizado no equipamento Pentacam')
    expect(r.confidence).toBe('medium')
    expect(r.provisional).toBe(true)          // ainda não ancorado em terminologia oficial
    expect(r.terminology).toBeNull()
    expect(r.basis).toContain('AAO')
    expect(r.equipment).toBe('Pentacam')
    expect(r.name).not.toMatch(/pentacam hr/i) // equipamento cru nunca é o nome
  })
  it('Pentacam COM evidência de tomografia (Scheimpflug/Belin) → ALTA: nome canônico', () => {
    const r = resolveExamIdentity(du({ device: 'OCULUS Pentacam', evidence: ['Pentacam', 'Scheimpflug', 'Belin ABCD', 'Anterior Elevation'] }))
    expect(r.name).toBe('Tomografia da córnea')
    expect(r.confidence).toBe('high')
    expect(r.source).toBe('kb')
  })
  it('equipamento de propósito único → alta pelo defaultName', () => {
    expect(resolveExamIdentity(du({ device: 'Humphrey Field Analyzer' })).name).toBe('Campo visual computadorizado')
    expect(resolveExamIdentity(du({ device: 'Zeiss Cirrus OCT' })).name).toBe('Tomografia de coerência óptica (OCT)')
    expect(resolveExamIdentity(du({ evidence: ['specular microscopy', 'CEM-530'] })).name).toBe('Microscopia especular da córnea')
  })
  it('nome EXPLÍCITO no documento (transcrito) é usado; nunca o equipamento', () => {
    const r = resolveExamIdentity(du({ examName: 'Hemograma completo', confidence: 'high' }))
    expect(r.name).toBe('Hemograma completo'); expect(r.source).toBe('ai')
  })
  it('BAIXA confiança → identificação pendente (NÃO inventa exame)', () => {
    expect(resolveExamIdentity(du({ examCategory: 'Oftalmologia' })).name).toBe('Exame oftalmológico (identificação pendente)')
    expect(resolveExamIdentity(du()).name).toBe('Documento (identificação pendente)')
    expect(resolveExamIdentity(du()).confidence).toBe('low')
  })
  it('resolveDocumentIdentity delega ao nome resolvido', () => {
    expect(resolveDocumentIdentity(du({ device: 'OCULUS Pentacam HR', examCategory: 'Oftalmologia' })))
      .toBe('Exame oftalmológico realizado no equipamento Pentacam')
  })
})

describe('FUNC · DUE — structuredPossible + parseUnderstanding', () => {
  it('imagem/oftalmologia → document_only; laboratorial → estruturável', () => {
    expect(structuredPossibleFor('imaging')).toBe(false)
    expect(structuredPossibleFor('ophthalmology')).toBe(false)
    expect(structuredPossibleFor('laboratory')).toBe(true)
    expect(structuredPossibleFor(null)).toBe(true)
  })
  it('parseUnderstanding separa device de nome, valida data ISO, coleta evidências e deriva structuredPossible', () => {
    const parsed = parseUnderstanding({
      document_type: 'ophthalmology', original_title: 'OCULUS Pentacam', exam_name: null,
      device: 'OCULUS Pentacam HR', exam_category: 'Oftalmologia', exam_date: '2026-03-18',
      evidence: ['Pentacam', 'Scheimpflug'], confidence: 'medium',
    })
    expect(parsed.device).toBe('OCULUS Pentacam HR')
    expect(parsed.examName).toBeNull()
    expect(parsed.structuredPossible).toBe(false)
    expect(parsed.examDate).toBe('2026-03-18')
    expect(parsed.evidence).toEqual(['Pentacam', 'Scheimpflug'])
    // Com essas evidências, a identidade resolvida é a tomografia (alta confiança).
    expect(resolveDocumentIdentity(parsed)).toBe('Tomografia da córnea')
  })
  it('data inválida e "null" textual viram null; evidência não-array → []', () => {
    const parsed = parseUnderstanding({ document_type: 'laboratory', exam_date: '18/03/2026', issuer: 'null', evidence: 'x', confidence: 'xxx' })
    expect(parsed.examDate).toBeNull()
    expect(parsed.issuer).toBeNull()
    expect(parsed.evidence).toEqual([])
    expect(parsed.confidence).toBe('medium')
  })
})

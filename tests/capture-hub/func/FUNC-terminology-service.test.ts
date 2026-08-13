import { describe, it, expect } from 'vitest'
import { resolveTerminology, resolveExamName } from '@/lib/terminology/terminology-service'

// FUNC — Terminology Service: resolve a NOMENCLATURA a partir dos FATOS do DUE (ADR-CK-001).
// Trava: EQUIPAMENTO ≠ EXAME · IA só sugere/evidencia, a Terminologia decide · nome por FAIXA DE CONFIANÇA
// (nunca fabrica) · PROVENIÊNCIA (provisório enquanto terminology=null).

const facts = (over: Record<string, unknown> = {}) => ({
  device: null, originalTitle: null, examModality: null, examName: null, examCategory: null,
  evidence: [] as string[], confidence: 'medium' as const, ...over,
})

describe('FUNC · Terminology Service — resolução por evidências (equipamento ≠ exame; não fabrica)', () => {
  it('Pentacam SEM sinal de protocolo → MÉDIA: nomeia pelo equipamento, não afirma o exame; provisório', () => {
    const r = resolveTerminology(facts({ device: 'OCULUS Pentacam HR', examCategory: 'Oftalmologia', originalTitle: 'OCULUS Pentacam' }))
    expect(r.name).toBe('Exame oftalmológico realizado no equipamento Pentacam')
    expect(r.confidence).toBe('medium')
    expect(r.provisional).toBe(true)
    expect(r.terminology).toBeNull()
    expect(r.basis).toContain('AAO')
    expect(r.equipment).toBe('Pentacam')
    expect(r.name).not.toMatch(/pentacam hr/i)
  })
  it('Pentacam COM evidência de tomografia (Scheimpflug/Belin) → ALTA: nome canônico + decision log', () => {
    const r = resolveTerminology(facts({ device: 'OCULUS Pentacam', evidence: ['Pentacam', 'Scheimpflug', 'Belin ABCD', 'Anterior Elevation'] }))
    expect(r.name).toBe('Tomografia da córnea')
    expect(r.confidence).toBe('high')
    expect(r.source).toBe('terminology-catalog')  // value-set provisório da Terminologia (não "KB clínica")
    expect(r.provisional).toBe(true)
    // A trilha de decisões é registrada (auditoria).
    expect(r.decisionLog.length).toBeGreaterThanOrEqual(3)
    expect(r.decisionLog.join(' ')).toMatch(/sinal de protocolo/i)
    expect(r.decisionLog.join(' ')).toMatch(/PROVISÓRIO/i)
  })
  it('equipamento de propósito único → alta pelo defaultName', () => {
    expect(resolveExamName(facts({ device: 'Humphrey Field Analyzer' }))).toBe('Campo visual computadorizado')
    expect(resolveExamName(facts({ device: 'Zeiss Cirrus OCT' }))).toBe('Tomografia de coerência óptica (OCT)')
    expect(resolveExamName(facts({ evidence: ['specular microscopy', 'CEM-530'] }))).toBe('Microscopia especular da córnea')
  })
  it('nome EXPLÍCITO no documento (transcrito) é usado; nunca o equipamento cru', () => {
    const r = resolveTerminology(facts({ examName: 'Hemograma completo', confidence: 'high' }))
    expect(r.name).toBe('Hemograma completo'); expect(r.source).toBe('document')
  })
  it('BAIXA confiança → identificação pendente (NÃO inventa exame)', () => {
    expect(resolveExamName(facts({ examCategory: 'Oftalmologia' }))).toBe('Exame oftalmológico (identificação pendente)')
    expect(resolveExamName(facts())).toBe('Documento (identificação pendente)')
    expect(resolveTerminology(facts()).confidence).toBe('low')
  })
})

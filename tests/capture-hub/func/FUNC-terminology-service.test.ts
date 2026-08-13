import { describe, it, expect } from 'vitest'
import { resolveFromCatalog } from '@/lib/clinical-pipeline/internal-clinical-catalog'
import { resolveClinicalIdentity } from '@/lib/clinical-pipeline/clinical-pipeline'
import { parseUnderstanding } from '@/lib/capture/document-understanding'

// FUNC — Clinical Pipeline (ADR-CP-001): Internal Clinical Catalog (lacuna, ≠ Terminologia) + Orquestração
// (Clinical Identity + Decision Log estruturado + confiança global). Contratos CONGELADOS.

const facts = (over: Record<string, unknown> = {}) => ({
  device: null, originalTitle: null, examModality: null, examName: null, examCategory: null,
  evidence: [] as string[], confidence: 'medium' as const, ...over,
})

describe('FUNC · Internal Clinical Catalog (não é Terminologia; equipamento ≠ exame)', () => {
  it('Pentacam SEM sinal → MÉDIA pelo equipamento; matched; passos estruturados', () => {
    const r = resolveFromCatalog(facts({ device: 'OCULUS Pentacam HR', examCategory: 'Oftalmologia' }))
    expect(r.name).toBe('Exame oftalmológico realizado no equipamento Pentacam')
    expect(r.confidence).toBe('medium'); expect(r.matched).toBe(true); expect(r.equipment).toBe('Pentacam')
    expect(r.steps[0]).toMatchObject({ step: 'internal_catalog', rule: 'CAT-OPHTH-PENTACAM', status: 'equipment_only' })
    expect(r.name).not.toMatch(/pentacam hr/i)
  })
  it('Pentacam COM tomografia (Scheimpflug/Belin) → ALTA "Tomografia da córnea"', () => {
    const r = resolveFromCatalog(facts({ device: 'OCULUS Pentacam', evidence: ['Pentacam', 'Scheimpflug', 'Belin ABCD'] }))
    expect(r.name).toBe('Tomografia da córnea'); expect(r.confidence).toBe('high')
    expect(r.steps[0].status).toBe('matched')
  })
  it('equipamento de propósito único e nome explícito e pendente', () => {
    expect(resolveFromCatalog(facts({ device: 'Humphrey Field Analyzer' })).name).toBe('Campo visual computadorizado')
    expect(resolveFromCatalog(facts({ examName: 'Hemograma completo', confidence: 'high' })).matched).toBe(false)
    expect(resolveFromCatalog(facts({ examName: 'Hemograma completo' })).name).toBe('Hemograma completo')
    expect(resolveFromCatalog(facts()).name).toBe('Documento (identificação pendente)')
  })
})

describe('FUNC · Clinical Pipeline — Clinical Identity + Decision Log + confiança global', () => {
  const ctx = { resolutionId: 'RES-TEST-00000001', startedAt: '2026-08-13T00:00:00.000Z', finishedAt: '2026-08-13T00:00:01.000Z' }

  it('Pentacam com tomografia → Clinical Identity provisória (sem código oficial) + decisão auditável', () => {
    const du = parseUnderstanding({
      document_type: 'ophthalmology', evidence: ['Pentacam', 'Scheimpflug'],
      fields: { device: { value: 'OCULUS Pentacam', confidence: 'high' }, exam_category: { value: 'Oftalmologia' },
        exam_date: { value: null, absence_reason: 'illegible' }, patient_name: { value: 'Fulana', confidence: 'high' } },
    }, 'vision')
    const { identity, audit } = resolveClinicalIdentity(du, ctx)

    expect(identity.name).toBe('Tomografia da córnea')
    expect(identity.equipment).toBe('Pentacam')        // guardado à parte, nunca é o nome
    expect(identity.provisional).toBe(true)
    expect(identity.nameSource).toBe('internal-catalog')
    expect(identity.codes).toEqual([])                 // sem terminologia oficial ainda
    expect(identity.resolutionId).toBe('RES-TEST-00000001')

    // confiança global (perfil): nome alto, data 0 (ilegível), paciente alto…
    expect(identity.confidence.attributes.name).toBe(0.9)
    expect(identity.confidence.attributes.date).toBe(0)
    expect(typeof identity.confidence.overall).toBe('number')
    expect(identity.confidence).toHaveProperty('autoAcceptable')

    // Decision Log ESTRUTURADO (não textual): detector de data ilegível · terminologia indisponível · catálogo · pendentes
    const steps = audit.pipeline.decisionLog
    expect(steps.find(s => s.step === 'due' && s.detector === 'date')?.status).toBe('illegible')
    expect(steps.find(s => s.step === 'terminology')?.status).toBe('not_available')
    expect(steps.find(s => s.step === 'internal_catalog')?.status).toBe('matched')
    expect(steps.some(s => s.step === 'knowledge' && s.status === 'pending')).toBe(true)
    expect(audit.pipeline.finalStatus).toBe('provisional')
    expect(audit.pipeline.versions.due).toMatch(/^due-/)
  })
})

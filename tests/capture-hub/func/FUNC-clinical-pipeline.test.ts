import { describe, it, expect } from 'vitest'
import { resolveClinicalMapping } from '@/lib/clinical-pipeline/clinical-mapping-service'
import { resolveClinicalIdentity, buildFailedAudit } from '@/lib/clinical-pipeline/clinical-pipeline'
import { parseUnderstanding } from '@/lib/capture/document-understanding'

// FUNC — Clinical Pipeline (ADR-CP-001/CP-002): Clinical Mapping Service (RESOLVE conceito, ≠ terminologia própria)
// + Orquestração (Clinical Identity + Decision Log estruturado + confiança global). Contratos CONGELADOS.

const facts = (over: Record<string, unknown> = {}) => ({
  device: null, originalTitle: null, examModality: null, examName: null, examCategory: null,
  evidence: [] as string[], confidence: 'medium' as const, ...over,
})

describe('FUNC · Clinical Mapping Service (dono dos mapeamentos, não da terminologia; equipamento ≠ exame)', () => {
  it('Pentacam SEM sinal → MÉDIA pelo equipamento; matched; passo estruturado (regra MAP-…)', () => {
    const r = resolveClinicalMapping(facts({ device: 'OCULUS Pentacam HR', examCategory: 'Oftalmologia' }))
    expect(r.name).toBe('Exame oftalmológico realizado no equipamento Pentacam')
    expect(r.confidence).toBe('medium'); expect(r.matched).toBe(true); expect(r.equipment).toBe('Pentacam')
    expect(r.steps[0]).toMatchObject({ step: 'mapping', rule: 'MAP-OPHTH-PENTACAM', status: 'equipment_only' })
    expect(r.name).not.toMatch(/pentacam hr/i)
  })
  it('Pentacam COM tomografia (Scheimpflug/Belin) → ALTA "Tomografia da córnea"', () => {
    const r = resolveClinicalMapping(facts({ device: 'OCULUS Pentacam', evidence: ['Pentacam', 'Scheimpflug', 'Belin ABCD'] }))
    expect(r.name).toBe('Tomografia da córnea'); expect(r.confidence).toBe('high')
    expect(r.steps[0].status).toBe('matched')
  })
  it('equipamento de propósito único · nome explícito · pendente', () => {
    expect(resolveClinicalMapping(facts({ device: 'Humphrey Field Analyzer' })).name).toBe('Campo visual computadorizado')
    expect(resolveClinicalMapping(facts({ examName: 'Hemograma completo' })).matched).toBe(false)
    expect(resolveClinicalMapping(facts({ examName: 'Hemograma completo' })).name).toBe('Hemograma completo')
    expect(resolveClinicalMapping(facts()).name).toBe('Documento (identificação pendente)')
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
    expect(identity.equipment).toBe('Pentacam')          // guardado à parte, nunca é o nome
    expect(identity.provisional).toBe(true)
    expect(identity.nameSource).toBe('internal-mapping')
    expect(identity.codes).toEqual([])                   // sem terminologia oficial ainda
    expect(identity.resolutionId).toBe('RES-TEST-00000001')

    expect(identity.confidence.attributes.name).toBe(0.9)
    expect(identity.confidence.attributes.date).toBe(0)  // ilegível → não conta
    expect(typeof identity.confidence.overall).toBe('number')
    expect(identity.confidence).toHaveProperty('autoAcceptable')

    const steps = audit.pipeline.decisionLog
    expect(steps.find(s => s.step === 'due' && s.detector === 'date')?.status).toBe('illegible')
    expect(steps.find(s => s.step === 'terminology')?.status).toBe('not_available')
    expect(steps.find(s => s.step === 'mapping')?.status).toBe('matched')
    expect(steps.some(s => s.step === 'knowledge' && s.status === 'pending')).toBe(true)
    expect(audit.pipeline.finalStatus).toBe('provisional')
    expect(audit.mapping.matched).toBe(true)
    expect(audit.pipeline.versions.due).toMatch(/^due-/)
  })

  it('data resolvida por OUTRA leitura (DUE ilegível) → Audit reflete a data REAL, não "illegible"', () => {
    // Regressão do defeito de homologação (CEM-530): exam_date persistida ≠ audit. O Audit deve refletir a
    // data efetivamente resolvida (ok + valor), explicando a divergência com a leitura do DUE.
    const du = parseUnderstanding({
      document_type: 'ophthalmology', evidence: ['CEM-530'],
      fields: { device: { value: 'CEM-530' }, exam_date: { value: null, absence_reason: 'illegible' } },
    }, 'vision')
    const { identity, audit } = resolveClinicalIdentity(du, { ...ctx, resolved: { examDate: '2026-03-18', patientName: 'Fulana' } })
    expect(identity.examDate).toBe('2026-03-18')
    expect(identity.patientName).toBe('Fulana')
    const dateStep = audit.pipeline.decisionLog.find(s => s.step === 'due' && s.detector === 'date')
    expect(dateStep?.status).toBe('ok')
    expect(dateStep?.output).toBe('2026-03-18')
    expect(dateStep?.reason).toMatch(/leitura do DUE/i)   // explica de onde veio (auditoria)
    expect(identity.confidence.attributes.date).toBeGreaterThan(0)
  })

  it('DUE falho → audit de FALHA (documento SEMPRE explicável; nunca sem registro nem regride)', () => {
    const audit = buildFailedAudit(ctx, 'DUE retornou null após retry')
    expect(audit.pipeline.finalStatus).toBe('pending')
    expect(audit.due).toBeNull()
    expect(audit.pipeline.resolutionId).toBe('RES-TEST-00000001')
    const dueStep = audit.pipeline.decisionLog.find(s => s.step === 'due')
    expect(dueStep?.status).toBe('failed')
    expect(dueStep?.reason).toMatch(/null após retry/i)
    expect(audit.pipeline.versions.due).toMatch(/^due-/)   // rastreabilidade preservada mesmo na falha
  })
})

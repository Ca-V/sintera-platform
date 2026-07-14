import { describe, it, expect } from 'vitest'
import { validateRepresentation } from '@/lib/capture/representation-validator'
import { getClinicalModel } from '@/lib/capture/clinical-processors/models'
import { processClinical } from '@/lib/capture/clinical-processing-engine'
import type { ProcessorResult } from '@/lib/capture/clinical-processors/types'
import type { CertifiedCDU } from '@/lib/capture/identity-validator'

// FUNC — Representation Validator (4ª camada, CEF §4.1): "posso confiar nesta ESTRUTURA?". Separado do
// processador (Validação entre Camadas). "rotula, não oculta"; nunca falsa completude; certified × complete
// são medidas separadas (reprodutivelmente incompleto é estado válido e explícito).

const corneal = getClinicalModel('corneal-tomography')!

const parametric = (params: { name: string; value: string; region?: string }[]): ProcessorResult => ({
  output: { kind: 'parametric', parameters: params },
  clinicalModel: 'corneal-tomography', contractVersion: 'v1', extractedUnits: params.length, notes: [],
})

const ALL = ['K1', 'K2', 'Kmax', 'Espessura mínima', 'BAD-D', 'Elevação anterior', 'Elevação posterior']
const fullEye = (region: string) => ALL.map(name => ({ name, value: '1', region }))

describe('FUNC · validateRepresentation', () => {
  it('sem parâmetros → não certificável (empty), preserva o documento', () => {
    const v = validateRepresentation(parametric([]), corneal)
    expect(v.certified).toBe(false)
    expect(v.completeness).toBe('empty')
  })

  it('esqueleto completo em OD e OE → certified + complete', () => {
    const v = validateRepresentation(parametric([...fullEye('OD'), ...fullEye('OE')]), corneal)
    expect(v.certified).toBe(true)
    expect(v.completeness).toBe('complete')
    expect(v.regions.sort()).toEqual(['OD', 'OE'])
    expect(v.missing).toHaveLength(0)
  })

  it('faltando campos → certified mas partial (reprodutivelmente incompleto); "rotula, não oculta"', () => {
    const v = validateRepresentation(parametric([
      { name: 'K1', value: '43', region: 'OD' },
      { name: 'K2', value: '44', region: 'OD' },
    ]), corneal)
    expect(v.certified).toBe(true)          // estrutura íntegra a seguir
    expect(v.completeness).toBe('partial')  // nunca alega completude falsa
    const od = v.missing.find(m => m.region === 'OD')
    expect(od?.fields).toContain('Kmax')    // ausência é ROTULADA, não escondida
    expect(v.presentFields).toContain('K1')
  })

  it('um olho completo mas o outro faltando → partial (grupo quebrado nunca vira completo)', () => {
    const v = validateRepresentation(parametric([...fullEye('OD'), { name: 'K1', value: '42', region: 'OE' }]), corneal)
    expect(v.completeness).toBe('partial')
    expect(v.missing.some(m => m.region === 'OE')).toBe(true)
  })

  it('é DETERMINÍSTICO', () => {
    const r = parametric([...fullEye('OD'), ...fullEye('OE')])
    expect(JSON.stringify(validateRepresentation(r, corneal))).toBe(JSON.stringify(validateRepresentation(r, corneal)))
  })
})

// Integração: a fachada processClinical devolve o verdict junto do resultado.
const cdu = (text: string): CertifiedCDU => ({
  content: { format: 'text', text, pageCount: 1 },
  contractVersion: 'v1', index: 1, pages: [1], documentalModality: 'narrative',
  title: 'OCULUS Pentacam', discoveredUnits: 1, date: null, issuer: 'oculus',
  fingerprint: 'x', status: 'certified', confidence: 'high', issues: [],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  structure: {} as any,
})

describe('FUNC · processClinical inclui o verdict (4ª camada)', () => {
  it('Pentacam parcial → verdict certified + partial', () => {
    const r = processClinical(cdu('OCULUS Pentacam OD K1 43,2 K2 44,1 Kmax 45,0 BAD-D 1,2'))
    expect(r.result.output?.kind).toBe('parametric')
    expect(r.verdict.certified).toBe(true)
    expect(r.verdict.completeness).toBe('partial')
  })

  it('documento sem identidade → verdict empty (document_only)', () => {
    const r = processClinical(cdu('documento genérico sem sinais'))
    expect(r.verdict.completeness).toBe('empty')
    expect(r.verdict.certified).toBe(false)
  })
})

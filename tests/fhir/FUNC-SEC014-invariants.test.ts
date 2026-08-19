// FUNC · SEC-014 — gate de invariantes internas (rejeição). Prova que payloads canônicos que violam invariantes
// JÁ DEFINIDAS são rejeitados. NÃO valida perfis oficiais FHIR/BR-Core (fora de escopo). Dados 100% sintéticos.
import { describe, it, expect } from 'vitest'
import {
  validateInvariants,
  invariantViolations,
  hasHonestIdentifiers,
} from '@/lib/fhir/canonical/validate'
import type { FhirBundle } from '@/lib/fhir/canonical/projector'

const bundle = (resources: unknown[]): FhirBundle =>
  ({ resourceType: 'Bundle', type: 'collection', entry: resources.map(r => ({ resource: r })) } as unknown as FhirBundle)

// Bundle íntegro mínimo: Patient com identificador honesto, sem refs/coding.
const valid = bundle([
  { resourceType: 'Patient', id: 'p1', identifier: [{ system: 'urn:sintera:local', value: 'p1' }] },
])

describe('SEC-014 · gate de invariantes internas', () => {
  it('bundle íntegro → ok, sem violações', () => {
    expect(validateInvariants(valid)).toEqual({ ok: true, violations: [] })
  })

  it('referência não resolvida → rejeitado', () => {
    const b = bundle([
      { resourceType: 'Observation', id: 'o1', subject: { reference: 'Patient/inexistente' } },
    ])
    const r = validateInvariants(b)
    expect(r.ok).toBe(false)
    expect(r.violations.some(v => v.includes('não resolvidas'))).toBe(true)
  })

  it('DiagnosticReport com id duplicado → rejeitado', () => {
    const b = bundle([
      { resourceType: 'DiagnosticReport', id: 'dup' },
      { resourceType: 'DiagnosticReport', id: 'dup' },
    ])
    expect(validateInvariants(b).ok).toBe(false)
    expect(invariantViolations(b).some(v => v.includes('duplicado'))).toBe(true)
  })

  it('acoplamento RNDS no grafo → rejeitado', () => {
    const b = bundle([{ resourceType: 'Patient', id: 'p1', meta: { note: 'enviar ao RNDS' } }])
    expect(validateInvariants(b).ok).toBe(false)
    expect(invariantViolations(b).some(v => v.toLowerCase().includes('rnds'))).toBe(true)
  })

  it('coding desonesto (system sem code) → rejeitado', () => {
    const b = bundle([
      { resourceType: 'Observation', id: 'o1', code: { coding: [{ system: 'http://loinc.org' }] } },
    ])
    expect(validateInvariants(b).ok).toBe(false)
    expect(invariantViolations(b).some(v => v.includes('Coding'))).toBe(true)
  })

  it('identifier desonesto (value sem system) → rejeitado', () => {
    const b = bundle([{ resourceType: 'Patient', id: 'p1', identifier: [{ value: '000' }] }])
    expect(hasHonestIdentifiers(b)).toBe(false)
    expect(validateInvariants(b).ok).toBe(false)
    expect(invariantViolations(b).some(v => v.includes('Identifier'))).toBe(true)
  })
})

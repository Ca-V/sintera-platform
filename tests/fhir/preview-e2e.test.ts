// Fase C — E2E do preview sintético: input EXTRAÍDO do Supabase (branch de preview, dados 100% sintéticos) →
// projetor FHIR canônico → validação estrutural. Fecha o fluxo Supabase→CanonicalSource→canônico→projetor→validação.
import { describe, it, expect } from 'vitest'
import previewInput from './fixtures/preview-input.json'
import { projectCanonicalToFhir, type CanonProjectionInput, type FhirResource } from '@/lib/fhir/canonical/projector'
import { validateStructural, requisitionGroups } from '@/lib/fhir/canonical/validate'

const find = (b: { entry: { resource: FhirResource }[] }, t: string) => b.entry.map(e => e.resource).filter(r => r.resourceType === t)

describe('Fase C · E2E preview sintético (dados extraídos do Supabase)', () => {
  const bundle = projectCanonicalToFhir(previewInput as CanonProjectionInput)

  it('grafo estrutural válido (refs resolvem, sem RNDS, coding honesto)', () => {
    const rep = validateStructural(bundle)
    expect(rep.unresolved).toEqual([])
    expect(rep.ok).toBe(true)
  })
  it('bilateral: 2 ServiceRequest, mesmo requisition, lateralidade distinta', () => {
    expect(find(bundle, 'ServiceRequest')).toHaveLength(2)
    const groups = requisitionGroups(bundle)
    expect([...groups.values()][0]).toHaveLength(2)
    const sites = find(bundle, 'ServiceRequest').map(s => (s.bodySite as { text?: string }[] | undefined)?.[0]?.text)
    expect(new Set(sites)).toEqual(new Set(['esquerdo', 'direito']))
  })
  it('resultado parcial: basedOn só do lado esquerdo (confirmado)', () => {
    const dr = find(bundle, 'DiagnosticReport')[0]
    expect((dr.basedOn as { reference: string }[]).map(r => r.reference)).toEqual(['ServiceRequest/50000000-0000-0000-0000-0000000000a1'])
  })
  it('status derivado do documento final; Provenance por documento; derivedFrom', () => {
    expect(find(bundle, 'DiagnosticReport')[0].status).toBe('final')     // laudo_final
    expect(find(bundle, 'Provenance')).toHaveLength(1)
    expect((find(bundle, 'Observation')[0].derivedFrom as { reference: string }[])[0].reference).toBe('DocumentReference/d0000000-0000-0000-0000-0000000000a1')
  })
  it('terminologia confirmada aplica coding (LOINC); [NC] (Patient CPF sem system) omitido', () => {
    expect((find(bundle, 'Observation')[0].code as { coding?: { code: string }[] }).coding?.[0].code).toBe('1')
    const ids = find(bundle, 'Patient')[0].identifier as { system: string }[]
    expect(ids.map(i => i.system)).toEqual(['urn:sintera:local'])          // CPF sem system → omitido
  })
})

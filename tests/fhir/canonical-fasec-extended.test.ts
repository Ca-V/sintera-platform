// Fase C (preparações read-only) — Provenance, status preliminar/final, terminologia confirmada, source/loader,
// preview runner. DADOS SINTÉTICOS; puro; sem DB/rede/RNDS.
import { describe, it, expect } from 'vitest'
import { projectCanonicalToFhir, type CanonProjectionInput, type FhirResource } from '@/lib/fhir/canonical/projector'
import { createFakeSource, loadCanonicalModel } from '@/lib/fhir/canonical/source'
import { runCanonicalPreview } from '@/lib/fhir/canonical/preview'

const find = (b: { entry: { resource: FhirResource }[] }, t: string) => b.entry.map(e => e.resource).filter(r => r.resourceType === t)

describe('Fase C · Provenance por documento', () => {
  it('emite Provenance prov-<doc> com target, agente (origem) e entidade (extração)', () => {
    const b = projectCanonicalToFhir({
      resultEvents: [{ examId: 'ex1' }],
      documents: [{ id: 'd1', examId: 'ex1', fileUrl: 'synthetic://x.pdf', role: 'laudo_final', uploadedAt: '2026-08-01T10:00:00Z', source: 'upload_usuario', extractionRef: 'ev-9' }],
    })
    const prov = find(b, 'Provenance')
    expect(prov).toHaveLength(1)
    expect(prov[0].id).toBe('prov-d1')
    expect((prov[0].target as { reference: string }[])[0].reference).toBe('DocumentReference/d1')
    expect((prov[0].agent as { who: { display: string } }[])[0].who.display).toBe('upload_usuario')
    expect(prov[0].recorded).toBe('2026-08-01T10:00:00Z')
    const ent = prov[0].entity as { what: { identifier: { system: string; value: string } } }[]
    expect(ent[0].what.identifier).toMatchObject({ system: 'urn:sintera:extraction_version', value: 'ev-9' })
  })
})

describe('Fase C · status preliminar/final (sem sobrescrever o evento)', () => {
  it('preliminar + final coexistem: status=final, 2 presentedForm, 2 DocumentReference preservados', () => {
    const b = projectCanonicalToFhir({
      resultEvents: [{ examId: 'ex1', code: 'Doppler venoso MI' }],
      documents: [
        { id: 'dp', examId: 'ex1', fileUrl: 'synthetic://prelim.pdf', role: 'laudo_preliminar', uploadedAt: '2026-08-01T10:00:00Z' },
        { id: 'df', examId: 'ex1', fileUrl: 'synthetic://final.pdf', role: 'laudo_final', uploadedAt: '2026-08-03T10:00:00Z' },
      ],
    })
    const dr = find(b, 'DiagnosticReport')[0]
    expect(dr.status).toBe('final')                                   // final > preliminar
    expect((dr.presentedForm as unknown[]).length).toBe(2)           // ambos preservados (N presentedForm)
    expect(find(b, 'DocumentReference')).toHaveLength(2)             // preliminar NÃO sobrescrito
  })
  it('só preliminar → status=preliminary; sem documento → registered', () => {
    const prelim = projectCanonicalToFhir({ resultEvents: [{ examId: 'e' }], documents: [{ id: 'x', examId: 'e', fileUrl: 'u', role: 'laudo_preliminar' }] })
    expect(find(prelim, 'DiagnosticReport')[0].status).toBe('preliminary')
    const none = projectCanonicalToFhir({ resultEvents: [{ examId: 'e' }] })
    expect(find(none, 'DiagnosticReport')[0].status).toBe('registered')
  })
})

describe('Fase C · terminologia: coding só de binding CONFIRMADO (nunca [NC]/inferido)', () => {
  const base = (bindingStatus: string): CanonProjectionInput => ({
    resultEvents: [{ examId: 'ex1' }],
    observations: [{ id: 'o1', examId: 'ex1', name: 'Hemoglobina', valueNum: 13.5, unit: 'g/dL' }], // sem coding direto
    terminologyBindings: [{ targetType: 'observation_code', targetId: 'o1', system: 'http://loinc.org', code: '718-7', display: 'Hemoglobin', status: bindingStatus }],
  })
  it('binding confirmado → coding aplicado', () => {
    const b = projectCanonicalToFhir(base('confirmed'))
    const code = find(b, 'Observation')[0].code as { coding?: { system: string; code: string }[] }
    expect(code.coding?.[0]).toMatchObject({ system: 'http://loinc.org', code: '718-7' })
  })
  it('binding NÃO confirmado (proposed) → coding OMITIDO (só text)', () => {
    const b = projectCanonicalToFhir(base('proposed'))
    const code = find(b, 'Observation')[0].code as { coding?: unknown[]; text?: string }
    expect(code.coding).toBeUndefined()
    expect(code.text).toBe('Hemoglobina')
  })
  it('binding de OUTRO alvo não vaza para este', () => {
    const b = projectCanonicalToFhir({ ...base('confirmed'), terminologyBindings: [{ targetType: 'observation_code', targetId: 'OUTRO', system: 'http://loinc.org', code: '999', status: 'confirmed' }] })
    expect((find(b, 'Observation')[0].code as { coding?: unknown[] }).coding).toBeUndefined()
  })
})

describe('Fase C · read-model source (porta abstrata + fake) e preview runner', () => {
  const data: CanonProjectionInput = {
    patients: [{ id: 'p', name: 'Sintético' }],
    organizations: [{ id: 'o', name: 'Lab' }],
    serviceRequests: [
      { id: 'sE', requisitionId: 'REQ', codeText: 'Doppler', laterality: 'esquerdo', subjectPatientId: 'p' },
      { id: 'sD', requisitionId: 'REQ', codeText: 'Doppler', laterality: 'direito', subjectPatientId: 'p' },
    ],
    serviceRequestResults: [{ serviceRequestId: 'sE', resultExamId: 'ex1', confirmed: true }],
    resultEvents: [{ examId: 'ex1', performerOrganizationId: 'o' }],
    observations: [{ id: 'ob', examId: 'ex1', name: 'Fluxo', valueText: 'normal' }],
    documents: [{ id: 'd', examId: 'ex1', fileUrl: 'synthetic://x.pdf', role: 'laudo_final' }],
  }

  it('loadCanonicalModel compõe o input a partir da fonte fake', async () => {
    const input = await loadCanonicalModel(createFakeSource(data), { userId: 'u' })
    expect(input.serviceRequests).toHaveLength(2)
    expect(input.documents).toHaveLength(1)
  })

  it('runCanonicalPreview projeta+valida sobre a fonte sintética (approved estrutural)', async () => {
    const report = await runCanonicalPreview(createFakeSource(data), { userId: 'u' })
    expect(report.approved).toBe(true)
    expect(report.structural.unresolved).toEqual([])
    expect(report.requisitionGroups).toBe(1)               // bilateral agrupado
    expect(report.counts.ServiceRequest).toBe(2)
    expect(report.counts.Provenance).toBe(1)
    expect(report.counts.DiagnosticReport).toBe(1)
  })
})

// Fase C — projetor FHIR canônico (137→143) sobre DADOS SINTÉTICOS. Puro; sem DB/rede/RNDS.
import { describe, it, expect } from 'vitest'
import { projectCanonicalToFhir, type CanonProjectionInput, type FhirResource } from '@/lib/fhir/canonical/projector'
import { validateStructural, requisitionGroups, hasHonestCoding, unresolvedReferences } from '@/lib/fhir/canonical/validate'

const REQ = 'req-1'
const SR_E = 'sr-esq', SR_D = 'sr-dir'
const PAT = 'pat-1', PRAC = 'prac-1', ORG = 'org-1'
const RES = 'exam-res-1', DOC = 'doc-1'

// Documento concreto: Doppler venoso MI esquerdo + direito → 2 ServiceRequest agrupados por requisition,
// resultado só do lado esquerdo (parcial), execução do lado esquerdo, documento original preservado.
function bilateralInput(): CanonProjectionInput {
  return {
    patients: [{ id: PAT, name: 'Paciente Sintético', identifiers: [{ kind: 'cpf', value: '000', system: null }] }], // system NULL ⇒ oficial omitido
    practitioners: [{ id: PRAC, name: 'Solicitante' }],
    organizations: [{ id: ORG, name: 'Executante' }],
    serviceRequests: [
      { id: SR_E, requisitionId: REQ, codeText: 'Doppler colorido venoso de membro inferior', laterality: 'esquerdo', subjectPatientId: PAT, requesterPractitionerId: PRAC, performerOrganizationId: ORG },
      { id: SR_D, requisitionId: REQ, codeText: 'Doppler colorido venoso de membro inferior', laterality: 'direito',  subjectPatientId: PAT, requesterPractitionerId: PRAC, performerOrganizationId: ORG },
    ],
    serviceRequestResults: [{ serviceRequestId: SR_E, resultExamId: RES, confirmed: true }], // só o esquerdo
    resultEvents: [{ examId: RES, code: 'Doppler venoso MI', performerOrganizationId: ORG }],
    observations: [
      { id: 'obs-1', examId: RES, examDocumentId: DOC, name: 'Fluxo venoso', valueText: 'sem sinais de trombose' },
      { id: 'obs-2', examId: RES, name: 'Refluxo', valueText: 'ausente' },
    ],
    procedures: [{ id: 'proc-1', basedOnServiceRequestId: SR_E, codeText: 'Doppler venoso MI', subjectPatientId: PAT, performerOrganizationId: ORG, reportExamId: RES, laterality: 'esquerdo' }],
    documents: [{ id: DOC, examId: RES, fileUrl: 'synthetic://res.pdf', sha256: 'abc', role: 'laudo_final' }],
  }
}

const find = (b: { entry: { resource: FhirResource }[] }, t: string) => b.entry.map(e => e.resource).filter(r => r.resourceType === t)

describe('Fase C · projetor FHIR canônico (dados sintéticos)', () => {
  it('projeta todos os recursos canônicos e o grafo valida estruturalmente', () => {
    const b = projectCanonicalToFhir(bilateralInput())
    for (const t of ['Patient', 'Practitioner', 'Organization', 'ServiceRequest', 'DiagnosticReport', 'Observation', 'Procedure', 'DocumentReference']) {
      expect(find(b, t).length, `deve haver ${t}`).toBeGreaterThan(0)
    }
    expect(find(b, 'ServiceRequest')).toHaveLength(2)
    expect(find(b, 'Observation')).toHaveLength(2)
    const rep = validateStructural(b)
    expect(rep.unresolved).toEqual([])
    expect(rep.ok).toBe(true)
  })

  it('bilateral: 2 ServiceRequest agrupados pelo MESMO requisition, lateralidade individual', () => {
    const b = projectCanonicalToFhir(bilateralInput())
    const groups = requisitionGroups(b)
    expect(groups.get(REQ)).toHaveLength(2)
    const sites = find(b, 'ServiceRequest').map(s => (s.bodySite as { text?: string }[] | undefined)?.[0]?.text)
    expect(new Set(sites)).toEqual(new Set(['esquerdo', 'direito']))
  })

  it('basedOn: DiagnosticReport referencia SÓ a solicitação do lado com resultado confirmado (parcial)', () => {
    const b = projectCanonicalToFhir(bilateralInput())
    const dr = find(b, 'DiagnosticReport')[0]
    const based = (dr.basedOn as { reference: string }[]).map(r => r.reference)
    expect(based).toEqual([`ServiceRequest/${SR_E}`])       // esquerdo confirmado
    expect(based).not.toContain(`ServiceRequest/${SR_D}`)   // direito pendente → não vinculado
  })

  it('[NC]: nenhum coding é inventado (system NULL ⇒ code sem coding, só text); identificador oficial omitido', () => {
    const b = projectCanonicalToFhir(bilateralInput())
    const sr = find(b, 'ServiceRequest')[0]
    const code = sr.code as { text?: string; coding?: unknown[] }
    expect(code.text).toContain('Doppler')
    expect(code.coding).toBeUndefined()                     // não inventar coding
    const pat = find(b, 'Patient')[0]
    const ids = pat.identifier as { system: string }[]
    expect(ids.map(i => i.system)).toEqual(['urn:sintera:local']) // oficial (CPF sem system) omitido
    expect(hasHonestCoding(b)).toBe(true)
  })

  it('Procedure e DocumentReference: vínculos resolvem (basedOn/report/derivedFrom)', () => {
    const b = projectCanonicalToFhir(bilateralInput())
    const proc = find(b, 'Procedure')[0]
    expect((proc.basedOn as { reference: string }[])[0].reference).toBe(`ServiceRequest/${SR_E}`)
    expect((proc.report as { reference: string }[])[0].reference).toBe(`DiagnosticReport/${RES}`)
    const obsWithDoc = find(b, 'Observation').find(o => Array.isArray(o.derivedFrom))
    expect((obsWithDoc?.derivedFrom as { reference: string }[])[0].reference).toBe(`DocumentReference/${DOC}`)
    expect(unresolvedReferences(b)).toEqual([])
  })

  it('coding HONESTO: com system+code confirmados, o coding É emitido; validação permanece OK', () => {
    const input = bilateralInput()
    input.observations = [{ id: 'obs-x', examId: RES, name: 'Hemoglobina', valueNum: 13.5, unit: 'g/dL', codeSystem: 'http://loinc.org', codeValue: '718-7', codeDisplay: 'Hemoglobin' }]
    const b = projectCanonicalToFhir(input)
    const obs = find(b, 'Observation')[0]
    const coding = (obs.code as { coding?: { system: string; code: string }[] }).coding
    expect(coding?.[0]).toMatchObject({ system: 'http://loinc.org', code: '718-7' })
    expect(validateStructural(b).ok).toBe(true)
  })

  it('sem acoplamento RNDS no grafo', () => {
    const b = projectCanonicalToFhir(bilateralInput())
    expect(validateStructural(b).rndsDecoupled).toBe(true)
  })
})

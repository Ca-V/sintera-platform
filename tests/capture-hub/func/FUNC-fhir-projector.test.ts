/* eslint-disable @typescript-eslint/no-explicit-any -- teste faz asserções sobre JSON FHIR dinâmico */
import { describe, it, expect } from 'vitest'
import { projectToFhir, type FhirProjectionInput, type FhirResource } from '@/lib/fhir/projector'

// FHIR-002 — Projetor FHIR R4 da SINTERA. Caso ponta a ponta: o Doppler (pedido bilateral +
// laudo preliminar + laudo formal + resultado), decoupled da RNDS. Prova a separação
// Evento(DiagnosticReport)/Documento(DocumentReference)/Proveniência(Provenance)/Pedido(ServiceRequest).

const DOPPLER: FhirProjectionInput = {
  patient: { localId: 'pat-1', name: 'Carina Soares de Paiva Leite' },
  order: {
    localId: 'ord-ab5b5816',
    code: 'Doppler colorido venoso de membro inferior — bilateral',
    laterality: 'bilateral',
    requester: { localId: 'prac-lucas', name: 'Lucas Rezende Gomes' },
    date: '2026-03-25',
  },
  event: {
    localId: 'evt-doppler',
    code: 'Ultrassom Doppler venoso de membro inferior esquerdo',
    category: 'imaging',
    status: 'preliminary',
    date: '2026-03-27',
    performer: { localId: 'org-axial', name: 'AXIAL Medicina Diagnóstica' },
  },
  documents: [
    { localId: 'doc-preliminar', role: 'laudo_preliminar', url: 'https://x/preliminar.jpg', contentType: 'image/jpeg', date: '2026-03-27', source: 'upload_usuario', extractionRef: 'ext-1' },
    { localId: 'doc-formal', role: 'laudo_final', url: 'https://x/formal.pdf', contentType: 'application/pdf', date: '2026-04-02', source: 'lab_api', extractionRef: 'ext-2' },
  ],
  results: [
    { localId: 'obs-diam', documentLocalId: 'doc-preliminar', code: 'Diâmetro v. safena magna', valueNum: 3.9, unit: 'mm', bodySite: 'membro inferior esquerdo' },
  ],
}

const byType = (b: ReturnType<typeof projectToFhir>, t: string): FhirResource[] =>
  b.entry.map(e => e.resource).filter(r => r.resourceType === t)
const one = (b: ReturnType<typeof projectToFhir>, t: string): FhirResource => {
  const rs = byType(b, t); expect(rs.length, `1 ${t}`).toBe(1); return rs[0]
}

describe('FHIR-002 · projetor — caso Doppler ponta a ponta', () => {
  const bundle = projectToFhir(DOPPLER)

  it('Bundle collection com o grafo completo', () => {
    expect(bundle.resourceType).toBe('Bundle')
    expect(bundle.type).toBe('collection')
    expect(byType(bundle, 'Patient').length).toBe(1)
    expect(byType(bundle, 'Practitioner').length).toBe(1)
    expect(byType(bundle, 'Organization').length).toBe(1)
    expect(byType(bundle, 'ServiceRequest').length).toBe(1)
    expect(byType(bundle, 'DiagnosticReport').length).toBe(1)
    expect(byType(bundle, 'Observation').length).toBe(1)
    expect(byType(bundle, 'DocumentReference').length).toBe(2)
    expect(byType(bundle, 'Provenance').length).toBe(2)
  })

  it('DiagnosticReport: status preliminar, basedOn→ServiceRequest, presentedForm com 2 documentos, result→Observation', () => {
    const dr = one(bundle, 'DiagnosticReport') as Record<string, any>
    expect(dr.status).toBe('preliminary')
    expect(dr.code.text).toBe('Ultrassom Doppler venoso de membro inferior esquerdo')
    expect(dr.basedOn).toEqual([{ reference: 'ServiceRequest/ord-ab5b5816' }])
    expect(dr.performer).toEqual([{ reference: 'Organization/org-axial' }])
    expect(dr.result).toEqual([{ reference: 'Observation/obs-diam' }])
    expect(dr.presentedForm.map((a: any) => a.url)).toEqual(['https://x/preliminar.jpg', 'https://x/formal.pdf'])
    expect(dr.presentedForm.map((a: any) => a.title)).toEqual(['laudo_preliminar', 'laudo_final'])
  })

  it('DocumentReference: um por documento, com proveniência própria (Provenance por documento)', () => {
    const docs = byType(bundle, 'DocumentReference') as Record<string, any>[]
    expect(docs.map(d => d.type.text).sort()).toEqual(['laudo_final', 'laudo_preliminar'])
    for (const d of docs) {
      expect(d.content[0].attachment.url).toMatch(/^https:\/\/x\//)
      expect(d.context.related).toEqual([{ reference: 'DiagnosticReport/evt-doppler' }])
    }
    const provs = byType(bundle, 'Provenance') as Record<string, any>[]
    const targets = provs.map(p => p.target[0].reference).sort()
    expect(targets).toEqual(['DocumentReference/doc-formal', 'DocumentReference/doc-preliminar'])
    const prelim = provs.find(p => p.target[0].reference === 'DocumentReference/doc-preliminar')!
    expect(prelim.agent[0].who.display).toBe('upload_usuario')
    expect(prelim.entity[0].what.identifier.value).toBe('ext-1')  // rastreabilidade da extração
  })

  it('Observation: valor com unidade, bodySite e proveniência do documento (derivedFrom)', () => {
    const obs = one(bundle, 'Observation') as Record<string, any>
    expect(obs.status).toBe('final')
    expect(obs.valueQuantity).toEqual({ value: 3.9, unit: 'mm' })
    expect(obs.bodySite.text).toBe('membro inferior esquerdo')
    expect(obs.derivedFrom).toEqual([{ reference: 'DocumentReference/doc-preliminar' }])
  })

  it('ServiceRequest: pedido consolidado bilateral, subject/requester', () => {
    const sr = one(bundle, 'ServiceRequest') as Record<string, any>
    expect(sr.status).toBe('active'); expect(sr.intent).toBe('order')
    expect(sr.code.text).toBe('Doppler colorido venoso de membro inferior — bilateral')
    expect(sr.subject).toEqual({ reference: 'Patient/pat-1' })
    expect(sr.requester).toEqual({ reference: 'Practitioner/prac-lucas' })
  })

  it('DESACOPLADO da RNDS: nenhum perfil/terminologia RNDS embutido', () => {
    const json = JSON.stringify(bundle).toLowerCase()
    expect(json).not.toContain('rnds')
    expect(json).not.toContain('meta') // sem meta.profile de perfil RNDS
    // identificação é LOCAL (sem exigir CPF/CNS/CNES na representação FHIR)
    const patient = one(bundle, 'Patient') as Record<string, any>
    expect(patient.identifier[0].system).toBe('urn:sintera:local')
  })
})

describe('FHIR-002 · projetor — variações mínimas', () => {
  it('sem pedido → DiagnosticReport sem basedOn; sem ServiceRequest', () => {
    const b = projectToFhir({ ...DOPPLER, order: null })
    const dr = b.entry.map(e => e.resource).find(r => r.resourceType === 'DiagnosticReport') as Record<string, any>
    expect(dr.basedOn).toBeUndefined()
    expect(b.entry.some(e => e.resource.resourceType === 'ServiceRequest')).toBe(false)
  })

  it('laudo final único → status final; 1 documento; 1 proveniência', () => {
    const b = projectToFhir({
      ...DOPPLER,
      event: { ...DOPPLER.event, status: 'final' },
      documents: [DOPPLER.documents[1]],
      results: [],
    })
    const dr = b.entry.map(e => e.resource).find(r => r.resourceType === 'DiagnosticReport') as Record<string, any>
    expect(dr.status).toBe('final')
    expect(dr.result).toEqual([])
    expect(b.entry.filter(e => e.resource.resourceType === 'DocumentReference').length).toBe(1)
    expect(b.entry.filter(e => e.resource.resourceType === 'Provenance').length).toBe(1)
  })
})

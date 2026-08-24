/* eslint-disable @typescript-eslint/no-explicit-any -- asserções sobre JSON FHIR dinâmico */
import { describe, it, expect } from 'vitest'
import { loadExamReadModel } from '@/lib/fhir/examReadModelLoader'
import { mapReadModelToFhirInput } from '@/lib/fhir/readModelMapper'
import { projectToFhir } from '@/lib/fhir/projector'
import { unresolvedReferences, hasSingleClinicalEvent, isRndsDecoupled } from '@/lib/fhir/validate'
import { makeReadModel, makeOrder, makeDoc, makeResult, fakeSource } from './fixtures/examReadModel'

const project = (rm: Parameters<typeof mapReadModelToFhirInput>[0]) => projectToFhir(mapReadModelToFhirInput(rm))
const count = (b: ReturnType<typeof projectToFhir>, t: string) => b.entry.filter(e => e.resource.resourceType === t).length
const drStatus = (b: ReturnType<typeof projectToFhir>) =>
  (b.entry.map(e => e.resource).find(r => r.resourceType === 'DiagnosticReport') as Record<string, any>).status

// FHIR-004 — Loader (fonte abstrata, sem banco) + casos-limite + validação do contrato FHIR.

describe('FHIR-004 · loader (fonte em memória, sem banco)', () => {
  it('monta ExamReadModel e resolve o pedido via fulfills_order_id', async () => {
    const rm = makeReadModel({ exam: { fulfills_order_id: 'ord-1' }, order: makeOrder(), documents: [makeDoc()] })
    const loaded = await loadExamReadModel(fakeSource(rm), 'exam-1')
    expect(loaded?.exam.id).toBe('exam-1')
    expect(loaded?.order?.id).toBe('ord-1')
    expect(loaded?.documents.length).toBe(1)
  })
  it('exame inexistente → null', async () => {
    const rm = makeReadModel()
    expect(await loadExamReadModel(fakeSource(rm), 'nao-existe')).toBeNull()
  })
})

describe('FHIR-004 · casos-limite (mapeador + projetor)', () => {
  it('exame SEM documento → 1 evento, status registered, 0 DocumentReference/Provenance', () => {
    const b = project(makeReadModel({ documents: [] }))
    expect(count(b, 'DiagnosticReport')).toBe(1)
    expect(drStatus(b)).toBe('registered')
    expect(count(b, 'DocumentReference')).toBe(0)
    expect(count(b, 'Provenance')).toBe(0)
  })

  it('preliminar SEM final → status preliminary; 1 documento', () => {
    const b = project(makeReadModel({ documents: [makeDoc({ id: 'd1', document_role: 'laudo_preliminar' })] }))
    expect(drStatus(b)).toBe('preliminary')
    expect(count(b, 'DocumentReference')).toBe(1)
  })

  it('preliminar + final → status final; 2 documentos preservados (nenhum substitui o outro)', () => {
    const b = project(makeReadModel({ documents: [
      makeDoc({ id: 'd1', document_role: 'laudo_preliminar', file_url: 'https://x/p.jpg' }),
      makeDoc({ id: 'd2', document_role: 'laudo_final', file_url: 'https://x/f.pdf' }),
    ] }))
    expect(drStatus(b)).toBe('final')
    expect(count(b, 'DocumentReference')).toBe(2)
    expect(count(b, 'Provenance')).toBe(2)
    const urls = b.entry.map(e => e.resource).filter(r => r.resourceType === 'DocumentReference').map(d => (d as any).content[0].attachment.url)
    expect(urls).toEqual(expect.arrayContaining(['https://x/p.jpg', 'https://x/f.pdf']))
  })

  it('N documentos (preliminar + final + complementar) → 1 evento, 3 documentos, 3 proveniências', () => {
    const b = project(makeReadModel({ documents: [
      makeDoc({ id: 'd1', document_role: 'laudo_preliminar' }),
      makeDoc({ id: 'd2', document_role: 'laudo_final' }),
      makeDoc({ id: 'd3', document_role: 'complementar', file_url: 'https://x/c.pdf' }),
    ] }))
    expect(count(b, 'DiagnosticReport')).toBe(1)
    expect(count(b, 'DocumentReference')).toBe(3)
    expect(count(b, 'Provenance')).toBe(3)
  })

  it('resultado associado ao documento CORRETO (derivedFrom)', () => {
    const b = project(makeReadModel({
      documents: [makeDoc({ id: 'd1' }), makeDoc({ id: 'd2', document_role: 'laudo_final' })],
      results: [makeResult({ id: 'r1', exam_document_id: 'd2' })],
    }))
    const obs = b.entry.map(e => e.resource).find(r => r.resourceType === 'Observation') as Record<string, any>
    expect(obs.derivedFrom).toEqual([{ reference: 'DocumentReference/d2' }])
  })

  it('ausência de identificadores opcionais → sem Organization/Practitioner/ServiceRequest; Patient com id local', () => {
    const b = project(makeReadModel({
      exam: { issuer: null, patient_name: null }, order: null, patient: null,
      documents: [makeDoc()],
    }))
    expect(count(b, 'Organization')).toBe(0)   // sem issuer
    expect(count(b, 'Practitioner')).toBe(0)   // sem pedido/requester
    expect(count(b, 'ServiceRequest')).toBe(0) // sem pedido
    const patient = b.entry.map(e => e.resource).find(r => r.resourceType === 'Patient') as Record<string, any>
    expect(patient.identifier[0].system).toBe('urn:sintera:local')
    expect(patient.identifier[0].value).toBe('user-1')  // cai para user_id
  })
})

describe('FHIR-004 · validação do contrato FHIR produzido', () => {
  const rm = makeReadModel({
    exam: { fulfills_order_id: 'ord-1' }, order: makeOrder(),
    documents: [
      makeDoc({ id: 'd1', document_role: 'laudo_preliminar', file_url: 'https://x/p.jpg' }),
      makeDoc({ id: 'd2', document_role: 'laudo_final', file_url: 'https://x/f.pdf' }),
    ],
    results: [makeResult({ id: 'r1', exam_document_id: 'd1' })],
  })
  const bundle = project(rm)

  it('um DiagnosticReport por evento clínico', () => {
    expect(hasSingleClinicalEvent(bundle)).toBe(true)
  })
  it('status correto (final) e basedOn correto', () => {
    const dr = bundle.entry.map(e => e.resource).find(r => r.resourceType === 'DiagnosticReport') as Record<string, any>
    expect(dr.status).toBe('final')
    expect(dr.basedOn).toEqual([{ reference: 'ServiceRequest/ord-1' }])
  })
  it('documentos preservados + Provenance por documento', () => {
    expect(count(bundle, 'DocumentReference')).toBe(2)
    expect(count(bundle, 'Provenance')).toBe(2)
  })
  it('referências internas TODAS consistentes (nada órfão)', () => {
    expect(unresolvedReferences(bundle)).toEqual([])
  })
  it('nenhum acoplamento RNDS', () => {
    expect(isRndsDecoupled(bundle)).toBe(true)
  })
})

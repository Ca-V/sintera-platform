/* eslint-disable @typescript-eslint/no-explicit-any -- asserções sobre JSON FHIR dinâmico */
import { describe, it, expect } from 'vitest'
import { mapReadModelToFhirInput, deriveEventStatus, type ExamReadModel } from '@/lib/fhir/readModelMapper'
import { projectToFhir } from '@/lib/fhir/projector'

// FHIR-003 — Mapeador read-model → FhirProjectionInput. Caso Doppler ponta a ponta (pedido +
// laudo preliminar + laudo final + múltiplos documentos + resultado). Invariante central:
// UM exame permanece UM evento clínico (DiagnosticReport) mesmo com N documentos.

// Read-model do exame REALIZADO (com pedido vinculado). Ids neutros (fixture; NÃO toca dados reais).
const realized = (documents: ExamReadModel['documents']): ExamReadModel => ({
  exam: {
    id: 'exam-doppler', user_id: 'user-1',
    display_title: 'Ultrassom Doppler venoso de membro inferior esquerdo',
    document_type: 'imaging', exam_date: '2026-03-27',
    issuer: 'AXIAL Medicina Diagnóstica', patient_name: 'Carina Soares de Paiva Leite',
    requesting_physician: null, fulfills_order_id: 'ord-pedido',
    primary_document_id: documents.find(d => d.is_primary)?.id ?? null, status: 'processed',
  },
  documents,
  results: [
    { id: 'res-diam', exam_id: 'exam-doppler', exam_document_id: 'doc-prelim',
      name: 'Diâmetro v. safena magna', value_num: 3.9, value_text: null, unit: 'mm',
      reference_text: null, body_site: 'membro inferior esquerdo' },
  ],
  order: {
    id: 'ord-pedido', user_id: 'user-1',
    display_title: 'Doppler colorido venoso de membro inferior — bilateral',
    document_type: 'medical_order', exam_date: '2026-03-25', issuer: 'Unimed',
    patient_name: 'Carina Soares de Paiva Leite', requesting_physician: 'Lucas Rezende Gomes',
    fulfills_order_id: null, primary_document_id: null, status: 'processed',
  },
  patient: { id: 'pat-1', name: 'Carina Soares de Paiva Leite' },
})

const docPrelim: ExamReadModel['documents'][number] = {
  id: 'doc-prelim', exam_id: 'exam-doppler', file_url: 'https://x/preliminar.jpg', document_sha256: 'sha-p',
  document_role: 'laudo_preliminar', source: 'upload_usuario', uploaded_at: '2026-03-27',
  current_extraction_version_id: 'ext-1', exam_date: '2026-03-27', issuer: 'AXIAL', is_primary: true, status: 'processed',
}
const docFinal: ExamReadModel['documents'][number] = {
  id: 'doc-final', exam_id: 'exam-doppler', file_url: 'https://x/formal.pdf', document_sha256: 'sha-f',
  document_role: 'laudo_final', source: 'lab_api', uploaded_at: '2026-04-02',
  current_extraction_version_id: 'ext-2', exam_date: '2026-04-02', issuer: 'AXIAL', is_primary: false, status: 'processed',
}

describe('FHIR-003 · mapeador — Doppler ponta a ponta (pedido + preliminar + final)', () => {
  const input = mapReadModelToFhirInput(realized([docPrelim, docFinal]))

  it('mapeia exame→evento, pedido→ServiceRequest, documentos e resultados', () => {
    expect(input.event.localId).toBe('exam-doppler')
    expect(input.event.code).toBe('Ultrassom Doppler venoso de membro inferior esquerdo')
    expect(input.event.status).toBe('final')                 // final presente
    expect(input.event.performer).toEqual({ localId: 'org-exam-doppler', name: 'AXIAL Medicina Diagnóstica' })
    expect(input.order?.code).toBe('Doppler colorido venoso de membro inferior — bilateral')
    expect(input.order?.requester).toEqual({ localId: 'prac-ord-pedido', name: 'Lucas Rezende Gomes' })
    expect(input.documents.map(d => d.role)).toEqual(['laudo_preliminar', 'laudo_final'])
    expect(input.documents.map(d => d.contentType)).toEqual(['image/jpeg', 'application/pdf'])
    expect(input.documents[0].extractionRef).toBe('ext-1')   // rastreabilidade
    expect(input.results[0].documentLocalId).toBe('doc-prelim')
  })

  it('INVARIANTE: um exame = UM DiagnosticReport, mesmo com 2 documentos', () => {
    const bundle = projectToFhir(input)
    const reports = bundle.entry.map(e => e.resource).filter(r => r.resourceType === 'DiagnosticReport')
    expect(reports.length).toBe(1)                            // um evento clínico
    const dr = reports[0] as Record<string, any>
    expect(dr.status).toBe('final')
    expect(dr.presentedForm.length).toBe(2)                   // dois documentos no MESMO evento
    expect(dr.basedOn).toEqual([{ reference: 'ServiceRequest/ord-pedido' }])
    // não-overwrite: ambos os documentos preservados como DocumentReference + Provenance próprios
    expect(bundle.entry.filter(e => e.resource.resourceType === 'DocumentReference').length).toBe(2)
    expect(bundle.entry.filter(e => e.resource.resourceType === 'Provenance').length).toBe(2)
  })

  it('rastreabilidade: Observation.derivedFrom aponta o documento de origem; Provenance por documento', () => {
    const bundle = projectToFhir(input)
    const obs = bundle.entry.map(e => e.resource).find(r => r.resourceType === 'Observation') as Record<string, any>
    expect(obs.derivedFrom).toEqual([{ reference: 'DocumentReference/doc-prelim' }])
    const provs = bundle.entry.map(e => e.resource).filter(r => r.resourceType === 'Provenance') as Record<string, any>[]
    expect(provs.map(p => p.target[0].reference).sort()).toEqual(['DocumentReference/doc-final', 'DocumentReference/doc-prelim'])
    expect(provs.find(p => p.target[0].reference === 'DocumentReference/doc-final')!.entity[0].what.identifier.value).toBe('ext-2')
  })
})

describe('FHIR-003 · invariante não-overwrite: adicionar o laudo final NÃO cria novo evento', () => {
  it('preliminar sozinho → 1 evento status preliminary, 1 documento', () => {
    const b = projectToFhir(mapReadModelToFhirInput(realized([docPrelim])))
    const reports = b.entry.map(e => e.resource).filter(r => r.resourceType === 'DiagnosticReport')
    expect(reports.length).toBe(1)
    expect((reports[0] as Record<string, any>).status).toBe('preliminary')
    expect(b.entry.filter(e => e.resource.resourceType === 'DocumentReference').length).toBe(1)
  })

  it('depois de anexar o final → AINDA 1 evento (mesmo id), status vira final, preliminar PRESERVADO', () => {
    const before = projectToFhir(mapReadModelToFhirInput(realized([docPrelim])))
    const after  = projectToFhir(mapReadModelToFhirInput(realized([docPrelim, docFinal])))
    const idOf = (b: typeof before) => (b.entry.map(e => e.resource).find(r => r.resourceType === 'DiagnosticReport') as Record<string, any>).id
    expect(idOf(before)).toBe('exam-doppler')
    expect(idOf(after)).toBe('exam-doppler')                 // MESMO evento (não duplicou)
    const drAfter = after.entry.map(e => e.resource).find(r => r.resourceType === 'DiagnosticReport') as Record<string, any>
    expect(drAfter.status).toBe('final')
    const docUrls = after.entry.map(e => e.resource).filter(r => r.resourceType === 'DocumentReference').map(d => (d as any).content[0].attachment.url)
    expect(docUrls).toContain('https://x/preliminar.jpg')    // preliminar continua presente
    expect(docUrls).toContain('https://x/formal.pdf')
  })
})

describe('FHIR-003 · deriveEventStatus', () => {
  it('final > preliminar > registrado', () => {
    expect(deriveEventStatus([docFinal, docPrelim])).toBe('final')
    expect(deriveEventStatus([docPrelim])).toBe('preliminary')
    expect(deriveEventStatus([{ ...docPrelim, document_role: 'outro' }])).toBe('registered')
  })
})

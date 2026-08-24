import { describe, it, expect } from 'vitest'
import {
  createSupabaseExamSource, mapExamRow, mapDocumentRow, mapResultFromBiomarker, mapResultFromClinical,
  type FhirDbClient, type FhirDbQuery, type FhirDbResult,
} from '@/lib/fhir/supabaseExamSource'

// FHIR-005 — Adaptador Supabase de ExamReadModelSource. Testado com um cliente FAKE (sem banco real):
// prova o wiring (tabelas certas) e os mappers puros (linha crua → tipo do read-model).

// Cliente fake: devolve os dados pré-carregados por tabela; suporta maybeSingle() e await (thenable).
function fakeDb(byTable: Record<string, unknown>): FhirDbClient {
  const make = (table: string): FhirDbQuery => {
    const res: FhirDbResult = { data: byTable[table] ?? null, error: null }
    const q: FhirDbQuery = {
      select: () => q, eq: () => q, order: () => q,
      maybeSingle: async () => res,
      then: (onf) => Promise.resolve(res).then(onf),
    }
    return q
  }
  return { from: make }
}

describe('FHIR-005 · mappers puros (linha crua → read-model)', () => {
  it('mapExamRow', () => {
    const r = mapExamRow({ id: 'e1', user_id: 'u1', display_title: 'Hemograma', document_type: 'laboratory',
      exam_date: '2026-01-01', issuer: 'Fleury', patient_name: 'X', requesting_physician: null,
      fulfills_order_id: null, primary_document_id: 'd1', status: 'processed' })
    expect(r).toMatchObject({ id: 'e1', document_type: 'laboratory', issuer: 'Fleury', primary_document_id: 'd1' })
  })
  it('mapDocumentRow normaliza document_role inválido para "outro"', () => {
    expect(mapDocumentRow({ id: 'd1', exam_id: 'e1', file_url: 'https://x/a.pdf', document_role: 'xpto', is_primary: true }).document_role).toBe('outro')
    expect(mapDocumentRow({ id: 'd1', exam_id: 'e1', file_url: 'https://x/a.pdf', document_role: 'laudo_final', is_primary: false }).document_role).toBe('laudo_final')
  })
  it('mapResultFromBiomarker: faixa min/max → reference_text; value numérico', () => {
    const r = mapResultFromBiomarker({ id: 'b1', exam_id: 'e1', exam_document_id: 'd1', name: 'Hb', value: 14.2, unit: 'g/dL', reference_min: 12, reference_max: 16 })
    expect(r.name).toBe('Hb'); expect(r.value_num).toBe(14.2); expect(r.unit).toBe('g/dL')
    expect(r.reference_text).toBe('12 - 16'); expect(r.body_site).toBeNull(); expect(r.exam_document_id).toBe('d1')
  })
  it('mapResultFromClinical: body_site = anatomy ?? region', () => {
    expect(mapResultFromClinical({ id: 'c1', exam_id: 'e1', name: 'Achado', value_text: 'normal', anatomy: 'fígado', region: null }).body_site).toBe('fígado')
    expect(mapResultFromClinical({ id: 'c2', exam_id: 'e1', name: 'Achado', region: 'RID', anatomy: null }).body_site).toBe('RID')
  })
})

describe('FHIR-005 · createSupabaseExamSource (wiring, cliente fake)', () => {
  it('getExam mapeia a linha de exams', async () => {
    const src = createSupabaseExamSource(fakeDb({ exams: { id: 'e1', user_id: 'u1', display_title: 'Hemograma', document_type: 'laboratory', status: 'processed' } }))
    const exam = await src.getExam('e1')
    expect(exam?.id).toBe('e1'); expect(exam?.document_type).toBe('laboratory')
  })
  it('getExam devolve null quando não há linha', async () => {
    const src = createSupabaseExamSource(fakeDb({}))
    expect(await src.getExam('nope')).toBeNull()
  })
  it('getDocuments mapeia array', async () => {
    const src = createSupabaseExamSource(fakeDb({ exam_documents: [
      { id: 'd1', exam_id: 'e1', file_url: 'https://x/a.jpg', document_role: 'laudo_preliminar', is_primary: true },
    ] }))
    const docs = await src.getDocuments('e1')
    expect(docs.length).toBe(1); expect(docs[0].document_role).toBe('laudo_preliminar')
  })
  it('getResults unifica biomarkers + clinical_results', async () => {
    const src = createSupabaseExamSource(fakeDb({
      biomarkers: [{ id: 'b1', exam_id: 'e1', name: 'Hb', value: 14, unit: 'g/dL' }],
      clinical_results: [{ id: 'c1', exam_id: 'e1', name: 'Achado', value_text: 'normal', anatomy: 'fígado' }],
    }))
    const rs = await src.getResults('e1')
    expect(rs.length).toBe(2)
    expect(rs.map(r => r.name).sort()).toEqual(['Achado', 'Hb'])
  })
  it('getPatient mapeia profiles', async () => {
    const src = createSupabaseExamSource(fakeDb({ profiles: { id: 'u1', name: 'Carina' } }))
    expect(await src.getPatient('u1')).toEqual({ id: 'u1', name: 'Carina' })
  })
})

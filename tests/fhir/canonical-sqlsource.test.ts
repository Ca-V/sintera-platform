// Fase C (B+) — adapter CanonicalSource read-only (sqlSource) com executor FAKE. Sintético; sem DB/rede/produção.
import { describe, it, expect } from 'vitest'
import { createSqlCanonicalSource, Q, type SqlExecutor } from '@/lib/fhir/canonical/sqlSource'
import { loadCanonicalModel } from '@/lib/fhir/canonical/source'
import { projectCanonicalToFhir, type FhirResource } from '@/lib/fhir/canonical/projector'
import { validateStructural, unresolvedReferences } from '@/lib/fhir/canonical/validate'

type Row = Record<string, unknown>
interface DB { [table: string]: Row[] }

// Executor FAKE: roteia por tabela, filtra por user_id ($1), registra SQL (para provar read-only).
function makeExec(db: DB, log: string[]): SqlExecutor {
  return async (text, params) => {
    log.push(text.trim())
    const uid = params[0]
    const own = (rows: Row[] = []) => rows.filter(r => r.user_id === uid)
    if (text.includes('from public.service_request_results')) return own(db.service_request_results)
    if (text.includes('from public.service_requests')) return own(db.service_requests)
    if (text.includes('from public.party_identifiers')) return own(db.party_identifiers)
    if (text.includes('from public.patients')) return own(db.patients)
    if (text.includes('from public.practitioners')) return own(db.practitioners)
    if (text.includes('from public.organizations')) return own(db.organizations)
    if (text.includes('from public.procedures')) return own(db.procedures)
    if (text.includes('from public.exam_documents')) return own(db.exam_documents)
    if (text.includes('from public.terminology_bindings')) return own(db.terminology_bindings).filter(r => r.status === 'confirmed')
    if (text.includes('from public.consents')) return own(db.consents)
    if (text.includes('from public.audit_events')) return own(db.audit_events)
    if (text.includes('from public.exams')) return own(db.exams).filter(r => r.document_type == null || !['medical_order', 'insurance_guide'].includes(String(r.document_type)))
    if (text.includes('from public.biomarkers')) {
      const owned = new Set(own(db.exams).map(e => e.id))
      return (db.biomarkers ?? []).filter(b => owned.has(b.exam_id))
    }
    return []
  }
}

const A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
const Buser = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'

function baseDB(): DB {
  return {
    patients: [{ id: 'pA', user_id: A, name: 'Paciente A', birth_date: '1990-01-01', gender: 'female' }, { id: 'pB', user_id: Buser, name: 'Paciente B' }],
    practitioners: [{ id: 'prA', user_id: A, name: 'Dra. A' }],
    organizations: [{ id: 'orgA', user_id: A, name: 'Lab A' }],
    party_identifiers: [{ patient_id: 'pA', practitioner_id: null, organization_id: null, user_id: A, kind: 'cpf', value: '000', system: null, use: null }],
    service_requests: [
      { id: 'sE', user_id: A, requisition_id: 'REQ', status: 'active', intent: 'order', code_text: 'Doppler', code_system: null, code_value: null, code_display: null, body_site_text: null, body_site_system: null, body_site_code: null, laterality: 'esquerdo', subject_patient_id: 'pA', requester_practitioner_id: 'prA', performer_organization_id: 'orgA', authored_on: null },
      { id: 'sD', user_id: A, requisition_id: 'REQ', status: 'active', intent: 'order', code_text: 'Doppler', code_system: null, code_value: null, code_display: null, body_site_text: null, body_site_system: null, body_site_code: null, laterality: 'direito', subject_patient_id: 'pA', requester_practitioner_id: 'prA', performer_organization_id: 'orgA', authored_on: null },
    ],
    service_request_results: [{ service_request_id: 'sE', result_exam_id: 'exR', user_id: A, confirmed: true }],
    exams: [{ id: 'exR', user_id: A, document_type: null, display_title: 'Doppler venoso', exam_date: '2026-08-01' }, { id: 'exPed', user_id: A, document_type: 'medical_order', display_title: 'pedido.pdf', exam_date: null }],
    biomarkers: [{ id: 'obA', exam_id: 'exR', exam_document_id: 'dA', name: 'Fluxo', value: null, unit: null }],
    procedures: [{ id: 'pcA', user_id: A, based_on_service_request_id: 'sE', status: 'completed', code_text: 'Doppler', code_system: null, code_value: null, subject_patient_id: 'pA', performer_organization_id: 'orgA', report_exam_id: 'exR', laterality: 'esquerdo', performed_start: null }],
    exam_documents: [{ id: 'dA', user_id: A, exam_id: 'exR', file_url: 'synthetic://x.pdf', document_sha256: 'h', document_role: 'laudo_final', content_type: null, uploaded_at: '2026-08-01T10:00:00Z', source: 'upload_usuario', current_extraction_version_id: 'ev1' }],
    terminology_bindings: [{ target_type: 'observation_code', target_id: 'obA', user_id: A, concept_text: 'Fluxo', system: 'http://loinc.org', code: '1', display: 'Fluxo', status: 'confirmed' }],
    consents: [{ id: 'cA', user_id: A, purpose: 'assistencial', status: 'active', recipient: null }],
    audit_events: [{ id: 'aA', user_id: A, action: 'read', entity_type: 'exams', occurred_at: '2026-08-01T10:00:00Z' }],
  }
}

describe('Fase C · sqlSource (adapter read-only) — executor fake', () => {
  it('mapeia as tabelas 137→143 para os tipos canônicos', async () => {
    const src = createSqlCanonicalSource(makeExec(baseDB(), []))
    const input = await loadCanonicalModel(src, { userId: A })
    expect(input.patients?.[0]).toMatchObject({ id: 'pA', name: 'Paciente A', birthDate: '1990-01-01', gender: 'female' })
    expect(input.patients?.[0].identifiers?.[0]).toMatchObject({ kind: 'cpf', value: '000', system: null })
    expect(input.serviceRequests).toHaveLength(2)
    expect(input.serviceRequestResults?.[0]).toMatchObject({ serviceRequestId: 'sE', resultExamId: 'exR', confirmed: true })
    expect(input.resultEvents?.map(e => e.examId)).toEqual(['exR'])              // pedido (medical_order) excluído dos resultEvents
    expect(input.observations?.[0]).toMatchObject({ id: 'obA', examId: 'exR', examDocumentId: 'dA' })
    expect(input.procedures?.[0]).toMatchObject({ id: 'pcA', basedOnServiceRequestId: 'sE', reportExamId: 'exR' })
    expect(input.documents?.[0]).toMatchObject({ id: 'dA', role: 'laudo_final', extractionRef: 'ev1' })
    expect(input.terminologyBindings?.[0]).toMatchObject({ targetId: 'obA', system: 'http://loinc.org', code: '1', status: 'confirmed' })
  })

  it('lê também Consent e AuditEvent (read-set de governança)', async () => {
    const src = createSqlCanonicalSource(makeExec(baseDB(), []))
    expect(await src.consents({ userId: A })).toHaveLength(1)
    expect(await src.auditEvents({ userId: A })).toHaveLength(1)
  })

  it('ISOLAMENTO: usuário B não enxerga dados de A', async () => {
    const src = createSqlCanonicalSource(makeExec(baseDB(), []))
    const inputB = await loadCanonicalModel(src, { userId: Buser })
    expect(inputB.patients?.map(p => p.id)).toEqual(['pB'])
    expect(inputB.serviceRequests).toEqual([])
    expect(inputB.observations).toEqual([])
    expect(inputB.procedures).toEqual([])
  })

  it('ZERO ESCRITA: toda SQL emitida é SELECT e escopada por $1', async () => {
    const log: string[] = []
    const src = createSqlCanonicalSource(makeExec(baseDB(), log))
    await loadCanonicalModel(src, { userId: A })
    await src.consents({ userId: A }); await src.auditEvents({ userId: A })
    expect(log.length).toBeGreaterThan(0)
    for (const sql of log) {
      expect(sql.toLowerCase().startsWith('select'), `não-SELECT: ${sql}`).toBe(true)
      expect(/\$1/.test(sql), `sem escopo $1: ${sql}`).toBe(true)
      expect(/insert|update|delete|drop|alter|truncate|create/i.test(sql), `verbo de escrita: ${sql}`).toBe(false)
    }
    // as constantes exportadas também são só SELECT
    for (const q of Object.values(Q)) expect(q.toLowerCase().trim().startsWith('select')).toBe(true)
  })

  it('COMPATÍVEL com o projetor: input do adapter projeta e valida OK', async () => {
    const src = createSqlCanonicalSource(makeExec(baseDB(), []))
    const bundle = projectCanonicalToFhir(await loadCanonicalModel(src, { userId: A }))
    const rep = validateStructural(bundle)
    expect(rep.unresolved).toEqual([])
    expect(rep.ok).toBe(true)
    const find = (t: string) => bundle.entry.map(e => e.resource as FhirResource).filter(r => r.resourceType === t)
    expect(find('ServiceRequest')).toHaveLength(2)
    expect(find('Provenance')).toHaveLength(1)
    // coding do binding confirmado aplicado
    expect((find('Observation')[0].code as { coding?: unknown[] }).coding).toBeDefined()
  })
})

describe('Fase C · sqlSource — dados ausentes, vínculo ambíguo, referência inválida', () => {
  it('DADOS AUSENTES: campos null mapeiam para null e são omitidos no FHIR', async () => {
    const db = baseDB(); db.patients = [{ id: 'pA', user_id: A, name: null, birth_date: null, gender: null }]; db.party_identifiers = []
    const src = createSqlCanonicalSource(makeExec(db, []))
    const input = await loadCanonicalModel(src, { userId: A })
    expect(input.patients?.[0]).toMatchObject({ name: null, birthDate: null, gender: null })
    const pat = projectCanonicalToFhir(input).entry.map(e => e.resource).find(r => r.resourceType === 'Patient')!
    expect(pat.name).toBeUndefined(); expect(pat.birthDate).toBeUndefined()   // omitidos
  })

  it('VÍNCULO AMBÍGUO: 2 sugestões NÃO confirmadas → nenhum basedOn projetado', async () => {
    const db = baseDB()
    db.service_request_results = [
      { service_request_id: 'sE', result_exam_id: 'exR', user_id: A, confirmed: false },
      { service_request_id: 'sD', result_exam_id: 'exR', user_id: A, confirmed: false },
    ]
    const bundle = projectCanonicalToFhir(await loadCanonicalModel(createSqlCanonicalSource(makeExec(db, [])), { userId: A }))
    const dr = bundle.entry.map(e => e.resource).find(r => r.resourceType === 'DiagnosticReport')!
    expect(dr.basedOn).toBeUndefined()                                          // sem vínculo silencioso
  })

  it('REFERÊNCIA INVÁLIDA: Observation.derivedFrom para documento inexistente é detectada', async () => {
    const db = baseDB(); db.exam_documents = []                                  // remove o documento dA
    const bundle = projectCanonicalToFhir(await loadCanonicalModel(createSqlCanonicalSource(makeExec(db, [])), { userId: A }))
    expect(unresolvedReferences(bundle)).toContain('DocumentReference/dA')       // referência não resolvida flagrada
    expect(validateStructural(bundle).ok).toBe(false)
  })
})

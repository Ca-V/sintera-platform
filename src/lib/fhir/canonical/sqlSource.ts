// Fase C (B+) — Adapter CanonicalSource READ-ONLY sobre o schema canônico (137→143), via uma porta SqlExecutor.
// SÓ SELECT (nenhuma escrita). Escopado por user_id ($1) = minimização; RLS é defesa-em-profundidade no banco.
// Executável contra qualquer Postgres (isolado/sintético em teste; Supabase autenticado em produção — GATE C).
// NÃO acessa produção aqui; a fonte é injetada. As queries são constantes exportadas (inspecionáveis/testáveis).
import type {
  CanonicalSource, CanonScope,
} from './source'
import type {
  CanonPatient, CanonPractitioner, CanonOrganization, CanonIdentifier, CanonServiceRequest,
  CanonServiceRequestResult, CanonResultEvent, CanonObservation, CanonProcedure, CanonDocument, CanonTerminologyBinding,
} from './projector'

/** Porta de execução de SQL de LEITURA. Retorna linhas como objetos. Implementações: pg/Supabase/fake. */
export type SqlExecutor = (text: string, params: readonly unknown[]) => Promise<Record<string, unknown>[]>

const S = (v: unknown): string | null => (v === null || v === undefined ? null : String(v))
const N = (v: unknown): number | null => (v === null || v === undefined ? null : Number(v))
const B = (v: unknown): boolean => v === true || v === 't' || v === 'true'

// ── Queries READ-ONLY (só SELECT), escopadas por user_id = $1 (minimização) ─────────────────────────────────────
export const Q = {
  patients: `select id, name, birth_date, gender from public.patients where user_id = $1`,
  practitioners: `select id, name from public.practitioners where user_id = $1`,
  organizations: `select id, name from public.organizations where user_id = $1`,
  partyIdentifiers: `select patient_id, practitioner_id, organization_id, kind, value, system, use from public.party_identifiers where user_id = $1`,
  serviceRequests: `select id, requisition_id, status, intent, code_text, code_system, code_value, code_display, body_site_text, body_site_system, body_site_code, laterality, subject_patient_id, requester_practitioner_id, performer_organization_id, authored_on from public.service_requests where user_id = $1`,
  serviceRequestResults: `select service_request_id, result_exam_id, confirmed from public.service_request_results where user_id = $1`,
  // Resultados (DiagnosticReport): exames que NÃO são pedido (order). effectiveDate = exam_date.
  resultEvents: `select id, display_title, exam_date from public.exams where user_id = $1 and (document_type is null or document_type not in ('medical_order','insurance_guide'))`,
  // Observations: escopadas pelo dono do exame (join), sem exigir user_id na tabela de biomarcadores.
  observations: `select b.id, b.exam_id, b.exam_document_id, b.name, b.value, b.unit from public.biomarkers b join public.exams e on e.id = b.exam_id where e.user_id = $1`,
  procedures: `select id, based_on_service_request_id, status, code_text, code_system, code_value, subject_patient_id, performer_organization_id, report_exam_id, laterality, performed_start from public.procedures where user_id = $1`,
  // NB: content_type NÃO consta da 137 (é a migração 144, diferida) → não selecionar; contentType fica null.
  documents: `select id, exam_id, file_url, document_sha256, document_role, uploaded_at, source, current_extraction_version_id from public.exam_documents where user_id = $1`,
  terminologyBindings: `select target_type, target_id, concept_text, system, code, display, status from public.terminology_bindings where user_id = $1 and status = 'confirmed'`,
  // Read-set adicional (não projetado ainda; leitura para completude/governança — sem PII exportada).
  consents: `select id, purpose, status, recipient from public.consents where user_id = $1`,
  auditEvents: `select id, action, entity_type, occurred_at from public.audit_events where user_id = $1`,
} as const

function identifiersFor(rows: Record<string, unknown>[], key: 'patient_id' | 'practitioner_id' | 'organization_id', id: string): CanonIdentifier[] {
  return rows.filter(r => S(r[key]) === id).map(r => ({ kind: String(r.kind), value: String(r.value), system: S(r.system), use: S(r.use) }))
}

/** Cria um CanonicalSource read-only sobre a porta SqlExecutor. Nenhuma escrita é emitida. */
export function createSqlCanonicalSource(exec: SqlExecutor): CanonicalSource & {
  consents(scope: CanonScope): Promise<Record<string, unknown>[]>
  auditEvents(scope: CanonScope): Promise<Record<string, unknown>[]>
} {
  const run = (text: string, scope: CanonScope) => exec(text, [scope.userId])
  return {
    async patients(scope) {
      const [rows, ids] = await Promise.all([run(Q.patients, scope), run(Q.partyIdentifiers, scope)])
      return rows.map((r): CanonPatient => ({ id: String(r.id), name: S(r.name), birthDate: S(r.birth_date), gender: S(r.gender), identifiers: identifiersFor(ids, 'patient_id', String(r.id)) }))
    },
    async practitioners(scope) {
      const [rows, ids] = await Promise.all([run(Q.practitioners, scope), run(Q.partyIdentifiers, scope)])
      return rows.map((r): CanonPractitioner => ({ id: String(r.id), name: S(r.name), identifiers: identifiersFor(ids, 'practitioner_id', String(r.id)) }))
    },
    async organizations(scope) {
      const [rows, ids] = await Promise.all([run(Q.organizations, scope), run(Q.partyIdentifiers, scope)])
      return rows.map((r): CanonOrganization => ({ id: String(r.id), name: S(r.name), identifiers: identifiersFor(ids, 'organization_id', String(r.id)) }))
    },
    async serviceRequests(scope) {
      return (await run(Q.serviceRequests, scope)).map((r): CanonServiceRequest => ({
        id: String(r.id), requisitionId: String(r.requisition_id), status: S(r.status), intent: S(r.intent),
        codeText: String(r.code_text), codeSystem: S(r.code_system), codeValue: S(r.code_value), codeDisplay: S(r.code_display),
        bodySiteText: S(r.body_site_text), bodySiteSystem: S(r.body_site_system), bodySiteCode: S(r.body_site_code), laterality: S(r.laterality),
        subjectPatientId: S(r.subject_patient_id), requesterPractitionerId: S(r.requester_practitioner_id), performerOrganizationId: S(r.performer_organization_id),
        authoredOn: S(r.authored_on),
      }))
    },
    async serviceRequestResults(scope) {
      return (await run(Q.serviceRequestResults, scope)).map((r): CanonServiceRequestResult => ({ serviceRequestId: String(r.service_request_id), resultExamId: S(r.result_exam_id), confirmed: B(r.confirmed) }))
    },
    async resultEvents(scope) {
      return (await run(Q.resultEvents, scope)).map((r): CanonResultEvent => ({ examId: String(r.id), code: S(r.display_title), effectiveDate: S(r.exam_date) }))
    },
    async observations(scope) {
      return (await run(Q.observations, scope)).map((r): CanonObservation => ({ id: String(r.id), examId: String(r.exam_id), examDocumentId: S(r.exam_document_id), name: String(r.name), valueNum: N(r.value), unit: S(r.unit) }))
    },
    async procedures(scope) {
      return (await run(Q.procedures, scope)).map((r): CanonProcedure => ({
        id: String(r.id), basedOnServiceRequestId: S(r.based_on_service_request_id), status: S(r.status), codeText: String(r.code_text),
        codeSystem: S(r.code_system), codeValue: S(r.code_value), subjectPatientId: S(r.subject_patient_id), performerOrganizationId: S(r.performer_organization_id),
        reportExamId: S(r.report_exam_id), laterality: S(r.laterality), performedStart: S(r.performed_start),
      }))
    },
    async documents(scope) {
      return (await run(Q.documents, scope)).map((r): CanonDocument => ({
        id: String(r.id), examId: String(r.exam_id), fileUrl: String(r.file_url), sha256: S(r.document_sha256), role: S(r.document_role),
        contentType: null, uploadedAt: S(r.uploaded_at), source: S(r.source), extractionRef: S(r.current_extraction_version_id),
      }))
    },
    async terminologyBindings(scope) {
      return (await run(Q.terminologyBindings, scope)).map((r): CanonTerminologyBinding => ({ targetType: S(r.target_type), targetId: S(r.target_id), conceptText: S(r.concept_text), system: String(r.system), code: String(r.code), display: S(r.display), status: String(r.status) }))
    },
    // Read-set adicional (governança) — leitura crua, sem projeção FHIR ainda.
    consents: (scope) => run(Q.consents, scope),
    auditEvents: (scope) => run(Q.auditEvents, scope),
  }
}

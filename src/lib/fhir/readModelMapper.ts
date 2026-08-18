// FHIR-003 — Mapeador read-model (SINTERA, pós-Fase 0 / EXDOC-002) → FhirProjectionInput (FHIR-002).
//
// PURO/determinístico. Traduz as LINHAS do read-model (exame agregado + exam_documents + resultados +
// pedido) para o CONTRATO em memória do projetor. NÃO lê banco, NÃO toca RNDS. É a "cola fina" entre o
// schema (EXDOC-002) e o projetor (projector.ts). Invariante central: UM exame = UM evento clínico
// (DiagnosticReport), com N documentos (DocumentReference/presentedForm) — nunca N eventos por N documentos.
import type {
  FhirProjectionInput, ProjectionParty, ProjectionDocument, ProjectionResult, DocumentRole, ReportStatus,
} from './projector'

// ── Linhas do read-model (subconjunto relevante do schema pós-Fase 0) ───────────────────────────────
export interface ExamRow {                 // agregado / evento clínico (public.exams)
  id: string
  user_id: string
  display_title: string | null
  document_type: string | null             // 'imaging' | 'laboratory' | 'medical_order' | …
  exam_date: string | null
  issuer: string | null
  patient_name: string | null
  requesting_physician: string | null
  fulfills_order_id: string | null
  primary_document_id: string | null
  status: string | null
}

export interface ExamDocumentRow {         // public.exam_documents
  id: string
  exam_id: string
  file_url: string
  document_sha256: string | null
  document_role: DocumentRole
  source: string | null
  uploaded_at: string | null
  current_extraction_version_id: string | null
  exam_date: string | null
  issuer: string | null
  is_primary: boolean
  status: string | null
}

export interface ResultRow {               // biomarkers / clinical_results (unificado p/ Observation)
  id: string
  exam_id: string
  exam_document_id: string | null          // proveniência por documento
  name: string
  value_num: number | null
  value_text: string | null
  unit: string | null
  reference_text: string | null
  body_site: string | null
}

export interface ExamReadModel {
  exam: ExamRow                             // o exame REALIZADO (vira DiagnosticReport)
  documents: ExamDocumentRow[]
  results: ResultRow[]
  order?: ExamRow | null                    // o PEDIDO (exams medical_order alvo de fulfills_order_id)
  patient?: { id: string; name?: string | null } | null
}

// ── Regras ──────────────────────────────────────────────────────────────────────────────────────────
function contentTypeFromUrl(url: string): string | null {
  const u = url.toLowerCase()
  if (/\.png(\?|$)/.test(u))  return 'image/png'
  if (/\.jpe?g(\?|$)/.test(u)) return 'image/jpeg'
  if (/\.webp(\?|$)/.test(u)) return 'image/webp'
  if (/\.pdf(\?|$)/.test(u))  return 'application/pdf'
  return null
}

/** Status do EVENTO derivado dos documentos: final > preliminar > registrado. Um único status por evento. */
export function deriveEventStatus(docs: ExamDocumentRow[]): ReportStatus {
  if (docs.some(d => d.document_role === 'laudo_final')) return 'final'
  if (docs.some(d => d.document_role === 'laudo_preliminar')) return 'preliminary'
  return 'registered'
}

/** Traduz o read-model do exame → entrada do projetor FHIR. Puro. */
export function mapReadModelToFhirInput(rm: ExamReadModel): FhirProjectionInput {
  const { exam } = rm

  const patient: ProjectionParty = {
    localId: rm.patient?.id ?? exam.user_id,
    name: rm.patient?.name ?? exam.patient_name ?? null,
  }

  const performer: ProjectionParty | null = exam.issuer
    ? { localId: `org-${exam.id}`, name: exam.issuer }
    : null

  const order = rm.order
    ? {
        localId: rm.order.id,
        code: rm.order.display_title ?? 'Pedido de exame',
        requester: rm.order.requesting_physician
          ? { localId: `prac-${rm.order.id}`, name: rm.order.requesting_physician }
          : null,
        date: rm.order.exam_date ?? null,
      }
    : null

  const documents: ProjectionDocument[] = rm.documents.map(d => ({
    localId: d.id,
    role: d.document_role,
    url: d.file_url,
    contentType: contentTypeFromUrl(d.file_url),
    date: d.uploaded_at ?? d.exam_date ?? null,
    source: d.source ?? null,
    extractionRef: d.current_extraction_version_id ?? null,
  }))

  const results: ProjectionResult[] = rm.results.map(r => ({
    localId: r.id,
    documentLocalId: r.exam_document_id ?? null,   // rastreabilidade: qual documento originou o resultado
    code: r.name,
    valueNum: r.value_num,
    valueText: r.value_text,
    unit: r.unit,
    referenceText: r.reference_text,
    bodySite: r.body_site,
  }))

  return {
    patient,
    order,
    event: {
      localId: exam.id,                            // UM evento por exame (mesmo com N documentos)
      code: exam.display_title ?? 'Exame',
      category: exam.document_type ?? null,
      status: deriveEventStatus(rm.documents),
      date: exam.exam_date ?? null,
      performer,
    },
    documents,
    results,
  }
}

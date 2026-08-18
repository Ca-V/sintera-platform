// FHIR-005 — Adaptador Supabase de ExamReadModelSource (ISOLADO — sem conexão/execução aqui).
// Implementa a fonte de dados do loader (FHIR-004) sobre um cliente mínimo (subset do PostgREST), para
// ser LIGADO só quando a Fase 0 estiver em preview (gated). Os MAPPERS de linha são PUROS e testados sem
// banco. Nada é executado ao importar este módulo. Não toca RNDS.
import type { ExamRow, ExamDocumentRow, ResultRow } from './readModelMapper'
import type { DocumentRole } from './projector'
import type { ExamReadModelSource } from './examReadModelLoader'

// ── Cliente mínimo (o SupabaseClient real é passado com cast no wiring gated) ────────────────────────
export interface FhirDbResult { data: unknown; error: unknown }
export interface FhirDbQuery {
  select(cols: string): FhirDbQuery
  eq(col: string, val: string): FhirDbQuery
  order(col: string, opts?: { ascending?: boolean }): FhirDbQuery
  maybeSingle(): Promise<FhirDbResult>
  then<R>(onfulfilled: (r: FhirDbResult) => R): Promise<R>
}
export interface FhirDbClient { from(table: string): FhirDbQuery }

type Row = Record<string, unknown>
const str = (v: unknown): string | null => (typeof v === 'string' && v ? v : null)
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)
const bool = (v: unknown): boolean => v === true

const VALID_ROLES: DocumentRole[] = ['laudo_preliminar', 'laudo_final', 'complementar', 'outro']
const asRole = (v: unknown): DocumentRole => (VALID_ROLES.includes(v as DocumentRole) ? (v as DocumentRole) : 'outro')

const EXAM_COLS = 'id, user_id, display_title, document_type, exam_date, issuer, patient_name, requesting_physician, fulfills_order_id, primary_document_id, status'

// ── Mappers PUROS (linha crua → tipo do read-model) ─────────────────────────────────────────────────
export function mapExamRow(r: Row): ExamRow {
  return {
    id: String(r.id), user_id: String(r.user_id),
    display_title: str(r.display_title), document_type: str(r.document_type),
    exam_date: str(r.exam_date), issuer: str(r.issuer), patient_name: str(r.patient_name),
    requesting_physician: str(r.requesting_physician), fulfills_order_id: str(r.fulfills_order_id),
    primary_document_id: str(r.primary_document_id), status: str(r.status),
  }
}

export function mapDocumentRow(r: Row): ExamDocumentRow {
  return {
    id: String(r.id), exam_id: String(r.exam_id), file_url: String(r.file_url),
    document_sha256: str(r.document_sha256), document_role: asRole(r.document_role),
    source: str(r.source), uploaded_at: str(r.uploaded_at),
    current_extraction_version_id: str(r.current_extraction_version_id),
    exam_date: str(r.exam_date), issuer: str(r.issuer), is_primary: bool(r.is_primary), status: str(r.status),
  }
}

/** biomarkers → ResultRow. Faixa numérica (min/max) vira reference_text; sem body_site. */
export function mapResultFromBiomarker(r: Row): ResultRow {
  const min = num(r.reference_min), max = num(r.reference_max)
  const refText = (min !== null || max !== null) ? `${min ?? ''} - ${max ?? ''}`.trim() : null
  return {
    id: String(r.id), exam_id: String(r.exam_id), exam_document_id: str(r.exam_document_id),
    name: String(r.name ?? ''), value_num: num(r.value), value_text: str(r.value_text),
    unit: str(r.unit), reference_text: refText, body_site: null,
  }
}

/** clinical_results → ResultRow. body_site = anatomy ?? region. */
export function mapResultFromClinical(r: Row): ResultRow {
  return {
    id: String(r.id), exam_id: String(r.exam_id), exam_document_id: str(r.exam_document_id),
    name: String(r.name ?? ''), value_num: num(r.value_num), value_text: str(r.value_text),
    unit: str(r.unit), reference_text: str(r.reference_text), body_site: str(r.anatomy) ?? str(r.region),
  }
}

// ── Adaptador (wiring; executado apenas quando LIGADO no gate) ───────────────────────────────────────
export function createSupabaseExamSource(db: FhirDbClient): ExamReadModelSource {
  return {
    async getExam(id) {
      const { data } = await db.from('exams').select(EXAM_COLS).eq('id', id).maybeSingle()
      return data ? mapExamRow(data as Row) : null
    },
    async getDocuments(examId) {
      const { data } = await db.from('exam_documents').select('*').eq('exam_id', examId).order('uploaded_at', { ascending: true })
      return ((data as Row[] | null) ?? []).map(mapDocumentRow)
    },
    async getResults(examId) {
      const bm = await db.from('biomarkers')
        .select('id, exam_id, exam_document_id, name, value, value_text, unit, reference_min, reference_max').eq('exam_id', examId)
      const cr = await db.from('clinical_results')
        .select('id, exam_id, exam_document_id, name, value_num, value_text, unit, reference_text, region, anatomy').eq('exam_id', examId)
      return [
        ...((bm.data as Row[] | null) ?? []).map(mapResultFromBiomarker),
        ...((cr.data as Row[] | null) ?? []).map(mapResultFromClinical),
      ]
    },
    async getPatient(userId) {
      const { data } = await db.from('profiles').select('id, name').eq('id', userId).maybeSingle()
      if (!data) return null
      const p = data as Row
      return { id: String(p.id), name: str(p.name) }
    },
  }
}

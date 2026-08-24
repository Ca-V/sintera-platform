// Fixtures do schema Fase 0 (EXDOC-002) para os testes FHIR. Ids neutros — NÃO tocam dados reais.
import type { ExamRow, ExamDocumentRow, ResultRow, ExamReadModel } from '@/lib/fhir/readModelMapper'
import type { ExamReadModelSource } from '@/lib/fhir/examReadModelLoader'

export function makeExam(over: Partial<ExamRow> = {}): ExamRow {
  return {
    id: 'exam-1', user_id: 'user-1', display_title: 'Ultrassom Doppler venoso de membro inferior esquerdo',
    document_type: 'imaging', exam_date: '2026-03-27', issuer: 'AXIAL Medicina Diagnóstica',
    patient_name: 'Carina Soares de Paiva Leite', requesting_physician: null,
    fulfills_order_id: null, primary_document_id: null, status: 'processed', ...over,
  }
}

export function makeOrder(over: Partial<ExamRow> = {}): ExamRow {
  return makeExam({
    id: 'ord-1', display_title: 'Doppler colorido venoso de membro inferior — bilateral',
    document_type: 'medical_order', exam_date: '2026-03-25', issuer: 'Unimed',
    requesting_physician: 'Lucas Rezende Gomes', ...over,
  })
}

export function makeDoc(over: Partial<ExamDocumentRow> = {}): ExamDocumentRow {
  return {
    id: 'doc-1', exam_id: 'exam-1', file_url: 'https://x/doc.jpg', document_sha256: 'sha',
    document_role: 'laudo_preliminar', source: 'upload_usuario', uploaded_at: '2026-03-27',
    current_extraction_version_id: 'ext-1', exam_date: '2026-03-27', issuer: 'AXIAL',
    is_primary: false, status: 'processed', ...over,
  }
}

export function makeResult(over: Partial<ResultRow> = {}): ResultRow {
  return {
    id: 'res-1', exam_id: 'exam-1', exam_document_id: null, name: 'Diâmetro v. safena magna',
    value_num: 3.9, value_text: null, unit: 'mm', reference_text: null, body_site: 'membro inferior esquerdo', ...over,
  }
}

export interface ReadModelParts {
  exam?: Partial<ExamRow>
  documents?: ExamDocumentRow[]
  results?: ResultRow[]
  order?: ExamRow | null
  patient?: { id: string; name?: string | null } | null
}

export function makeReadModel(parts: ReadModelParts = {}): ExamReadModel {
  return {
    exam: makeExam(parts.exam),
    documents: parts.documents ?? [],
    results: parts.results ?? [],
    order: parts.order ?? null,
    // distinguir "não informado" (default) de null explícito (paciente ausente → cai para user_id)
    patient: parts.patient === undefined ? { id: 'pat-1', name: 'Carina Soares de Paiva Leite' } : parts.patient,
  }
}

/** Fonte em memória para o loader — SEM banco. Indexa exames por id (inclui o pedido). */
export function fakeSource(rm: ExamReadModel): ExamReadModelSource {
  const exams = new Map<string, ExamRow>()
  exams.set(rm.exam.id, rm.exam)
  if (rm.order) exams.set(rm.order.id, rm.order)
  return {
    getExam: async (id) => exams.get(id) ?? null,
    getDocuments: async (examId) => (examId === rm.exam.id ? rm.documents : []),
    getResults: async (examId) => (examId === rm.exam.id ? rm.results : []),
    getPatient: async () => rm.patient ?? null,
  }
}

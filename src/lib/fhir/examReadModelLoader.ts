// FHIR-004 — Loader do read-model do exame (contrato/adaptador). Monta um ExamReadModel a partir de uma
// FONTE ABSTRATA de dados (não do Supabase diretamente), o que o torna testável SEM banco. O binding real
// (Supabase, pós-Fase 0 em preview) implementa `ExamReadModelSource` — NÃO incluído aqui (gated).
// Puro quanto à orquestração; a única dependência é a `source` injetada.
import type { ExamRow, ExamDocumentRow, ResultRow, ExamReadModel } from './readModelMapper'

/** Fonte de dados do read-model (implementada depois por um adaptador Supabase — não neste arquivo). */
export interface ExamReadModelSource {
  getExam(examId: string): Promise<ExamRow | null>
  getDocuments(examId: string): Promise<ExamDocumentRow[]>
  getResults(examId: string): Promise<ResultRow[]>
  /** Paciente do usuário dono do exame (perfil). Pode devolver null (cai para patient_name do exame). */
  getPatient(userId: string): Promise<{ id: string; name?: string | null } | null>
}

/**
 * Monta o ExamReadModel de um exame. Determinístico dada a `source`. Devolve null se o exame não existe.
 * O PEDIDO é buscado via `fulfills_order_id` (a mesma tabela `exams`), reusando `getExam`.
 */
export async function loadExamReadModel(
  source: ExamReadModelSource,
  examId: string,
): Promise<ExamReadModel | null> {
  const exam = await source.getExam(examId)
  if (!exam) return null

  const [documents, results, patient] = await Promise.all([
    source.getDocuments(examId),
    source.getResults(examId),
    source.getPatient(exam.user_id),
  ])

  const order = exam.fulfills_order_id ? await source.getExam(exam.fulfills_order_id) : null

  return { exam, documents, results, order, patient }
}

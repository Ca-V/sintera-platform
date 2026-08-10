// @sintera/api-client — helpers internos do domínio Exames (mapeamento). Erro uniforme vem de ../net/errors.
import type { ExamDTO, ExamDetailDTO } from './types'

/** Projeta a linha do banco no DTO central (só os campos do contrato; ignora extras internos/financeiros). */
export function toExamDTO(row: Record<string, unknown>): ExamDTO {
  return {
    id: row.id as string,
    exam_date: (row.exam_date as string | null) ?? null,
    display_title: (row.display_title as string | null) ?? null,
    type: (row.type as string | null) ?? null,
    document_type: (row.document_type as string | null) ?? null,
    clinical_family: (row.clinical_family as string | null) ?? null,
    status: (row.status as string | null) ?? null,
    issuer: (row.issuer as string | null) ?? null,
    requesting_physician: (row.requesting_physician as string | null) ?? null,
    file_url: (row.file_url as string | null) ?? null,
    extraction_completeness: (row.extraction_completeness as string | null) ?? null,
    patient_name: (row.patient_name as string | null) ?? null,
    order_status: (row.order_status as string | null) ?? null,
    fulfills_order_id: (row.fulfills_order_id as string | null) ?? null,
    created_at: (row.created_at as string | null) ?? null,
  }
}

/** Projeta a linha no DTO de DETALHE (centrais + campos extras do detalhe). */
export function toExamDetailDTO(row: Record<string, unknown>): ExamDetailDTO {
  return {
    ...toExamDTO(row),
    page_count: (row.page_count as number | null) ?? null,
    document_scope: (row.document_scope as string | null) ?? null,
    error_reason: (row.error_reason as string | null) ?? null,
    text_truncated: (row.text_truncated as boolean | null) ?? null,
    expense_amount_cents: (row.expense_amount_cents as number | null) ?? null,
    expense_doc_type: (row.expense_doc_type as string | null) ?? null,
    expense_doc_url: (row.expense_doc_url as string | null) ?? null,
  }
}

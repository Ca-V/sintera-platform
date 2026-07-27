// @sintera/api-client — helpers internos do domínio Exames (mapeamento + normalização de erro).
import type { ExamDTO } from './types'

export function asError(e: unknown): Error {
  return e instanceof Error ? e : new Error(typeof e === 'string' ? e : 'Erro desconhecido')
}

/** Projeta a linha do banco no DTO central (só os campos do contrato; ignora extras internos/financeiros). */
export function toExamDTO(row: Record<string, unknown>): ExamDTO {
  return {
    id: row.id as string,
    exam_date: (row.exam_date as string | null) ?? null,
    display_title: (row.display_title as string | null) ?? null,
    document_type: (row.document_type as string | null) ?? null,
    clinical_family: (row.clinical_family as string | null) ?? null,
    status: (row.status as string | null) ?? null,
    issuer: (row.issuer as string | null) ?? null,
    requesting_physician: (row.requesting_physician as string | null) ?? null,
    file_url: (row.file_url as string | null) ?? null,
    created_at: (row.created_at as string | null) ?? null,
  }
}

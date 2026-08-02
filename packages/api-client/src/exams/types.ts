// @sintera/api-client — Contratos do DOMÍNIO Exames (leitura). Só os campos CENTRAIS de exibição de `exams`;
// campos internos (extração/bundle/processamento) e financeiros (FIN-001, projeção) NÃO vazam para o DTO.
// Convenção do pacote: leitura → `T | null` / `T[]`; LANÇA em falha operacional (rede/timeout/DB/auth).

/** Exame como LIDO para exibição (lista/detalhe). Escopo enxuto — não é a linha inteira de `exams`. */
export interface ExamDTO {
  id: string
  exam_date: string | null        // data do exame (YYYY-MM-DD)
  display_title: string | null    // nome de exibição derivado (document-naming; null até a extração)
  type: string | null             // rótulo bruto (nome do arquivo no upload) — fallback antes de display_title
  document_type: string | null    // categoria/mídia do documento
  clinical_family: string | null  // família clínica (aberta)
  status: string | null           // estado de processamento (exibição)
  issuer: string | null           // emissor (laboratório/clínica)
  requesting_physician: string | null // solicitante
  file_url: string | null         // referência ao documento original (fonte da verdade)
  created_at: string | null       // quando entrou na plataforma
}

import type { PageRequest, DateRange } from '@sintera/types'

/** Filtros/paginação da lista de exames (todos opcionais; sem paginação = todos).
 *  Reusa os contratos compartilhados `DateRange` (from/to) e `PageRequest` (limit/offset) de @sintera/types. */
export interface ExamsQuery extends PageRequest, DateRange {
  type?: string        // document_type
  family?: string      // clinical_family
}

/** API pública do domínio Exames — leitura. Web/Mobile consomem via ApiClient.exams (nunca Supabase direto). */
export interface ExamsApi {
  /** Lista os exames do usuário (mais recentes primeiro), com filtros/paginação. `[]` se não houver. LANÇA em falha. */
  listExams(query?: ExamsQuery, signal?: AbortSignal): Promise<ExamDTO[]>
  /** Lê um exame por id. `null` se não existir/for de outro usuário (RLS). LANÇA em falha. */
  getExam(id: string, signal?: AbortSignal): Promise<ExamDTO | null>
}

/** Colunas centrais lidas do banco (explícitas — não `*` — para não trazer campos internos/financeiros). */
export const EXAM_COLUMNS =
  'id, exam_date, display_title, type, document_type, clinical_family, status, issuer, requesting_physician, file_url, created_at' as const

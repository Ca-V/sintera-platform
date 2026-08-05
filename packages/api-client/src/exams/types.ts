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

/** Exame no DETALHE — estende o DTO enxuto com os campos que só o detalhe exibe/edita (paridade com a Web).
 *  A LISTA permanece enxuta (ExamDTO); só `getExam` traz estes campos extras. */
export interface ExamDetailDTO extends ExamDTO {
  patient_name: string | null     // nome do paciente no laudo (conferência de identidade)
  page_count: number | null       // nº de páginas do documento
  document_scope: string | null   // escopo do documento (single/bundle…)
  extraction_completeness: string | null // 'document_only' etc. (CEF) — dirige o estado da tela de resultados
  error_reason: string | null     // motivo do erro de extração (exibição)
  text_truncated: boolean | null  // documento processado parcialmente (aviso)
  fulfills_order_id: string | null // vínculo ao pedido de ORIGEM (Q1)
  // Financeiro do exame (FB-008: atributo do próprio exame, não Evento separado)
  expense_amount_cents: number | null
  expense_doc_type: string | null
  expense_doc_url: string | null
}

import type { PageRequest, DateRange } from '@sintera/types'
import type { BiomarkerDTO } from './biomarkers'
import type { ClinicalResultRow, ExamExpenseRow, BiomarkerRow } from '@sintera/core'

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
  /** Lê um exame por id (DETALHE — inclui campos extras). `null` se não existir/for de outro usuário (RLS). LANÇA. */
  getExam(id: string, signal?: AbortSignal): Promise<ExamDetailDTO | null>
  /** Lê os RESULTADOS estruturados (biomarcadores) de um exame. `[]` se não houver. LANÇA em falha. */
  getExamBiomarkers(examId: string, signal?: AbortSignal): Promise<BiomarkerDTO[]>
  /** Lê os RESULTADOS clínicos não-laboratoriais (CPE) de um exame — linhas de clinical_results (→ UCDA no core). */
  getExamClinicalResults(examId: string, signal?: AbortSignal): Promise<ClinicalResultRow[]>
  /** Lê os EXAMES-com-valor do usuário (Despesas, FB-008). `[]` se não houver. LANÇA em falha. */
  listExamExpenses(signal?: AbortSignal): Promise<ExamExpenseRow[]>
  /** Lê TODOS os biomarcadores numéricos (com data do laudo) — visão longitudinal/tendência. LANÇA em falha. */
  getAllBiomarkers(signal?: AbortSignal): Promise<BiomarkerRow[]>
}

/** Colunas centrais lidas do banco (explícitas — não `*` — para não trazer campos internos/financeiros). */
export const EXAM_COLUMNS =
  'id, exam_date, display_title, type, document_type, clinical_family, status, issuer, requesting_physician, file_url, created_at' as const

/** Colunas do DETALHE — as centrais + os campos extras (paciente, páginas, financeiro, vínculo…). Só `getExam`. */
export const EXAM_DETAIL_COLUMNS =
  `${EXAM_COLUMNS}, patient_name, page_count, document_scope, extraction_completeness, error_reason, text_truncated, fulfills_order_id, expense_amount_cents, expense_doc_type, expense_doc_url` as const

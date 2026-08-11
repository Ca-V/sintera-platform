// Camada de MODELO/LEITURA do domínio Exames — regra de domínio + mapeador row→domínio.
// Espelha o gabarito da Agenda (`lib/agenda/event.ts`: rowToHealthEvent + regras puras).
//
// REGRA DE DOMÍNIO "data efetiva do exame": um exame tem `exam_date` (data do laudo,
// pode faltar) e `created_at` (envio). A data que representa o exame na linha do tempo é
// `exam_date ?? created_at`. Essa regra estava reimplementada inline em ~9 arquivos
// (páginas, adapters, biomarcadores, medidas) — cada superfície re-derivando o mesmo
// conceito. Aqui é o dono único; qualquer origem futura de laudo (labs/FHIR/wearables)
// entra por este modelo e todos herdam a mesma regra.

/** Forma mínima da linha de `exams` necessária às regras/projeções (snake_case). */
export interface ExamRow {
  id: string
  type?: string | null
  status?: string | null
  exam_date?: string | null
  created_at?: string | null
  file_url?: string | null
}

/** Exame no formato de domínio (camelCase) — a UI consome isto, não a linha crua. */
export interface Exam {
  id: string
  type: string
  status: string
  /** data efetiva ('YYYY-MM-DD' ou timestamp) = exam_date ?? created_at */
  date: string
  fileUrl: string | null
}

/**
 * REGRA DE DOMÍNIO: data efetiva do exame. `exam_date` (laudo) tem precedência sobre
 * `created_at` (envio). Pura e tolerante — aceita qualquer objeto com esses campos.
 */
export function effectiveExamDate(row: { exam_date?: string | null; created_at?: string | null }): string {
  return row.exam_date ?? row.created_at ?? ''
}

/** Converte uma linha de `exams` no domínio. Pura e tolerante a valores inesperados. */
export function rowToExam(row: ExamRow): Exam {
  return {
    id: row.id,
    type: row.type || 'Exame',
    status: row.status ?? 'pending',
    date: effectiveExamDate(row),
    fileUrl: row.file_url ?? null,
  }
}

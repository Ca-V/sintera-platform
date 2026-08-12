// ============================================================
// SINTERA — Exames: serviço de domínio (ESCRITAS de CRUD do exame)
// ============================================================
// Conclui a propagação da fundação de serviço+rota (api/http · api/db · api/errors)
// ao domínio Exames — o único domínio de lista que ainda escrevia client-direct.
// Dono das escritas de ciclo do exame: criar (upload já feito → registro pendente),
// renomear/editar (type/exam_date) e marcar status.
//
// FRONTEIRA: NÃO abrange (a) o pipeline de ANÁLISE/extração (transições internas
// status→processing/processed/error, qualidade, biomarcadores) — isso vive em
// `api/exams/[id]/analyze` e é o domínio do processamento, não do CRUD; (b) o DELETE,
// já servido por `api/exams/[id]` com ownership + limpeza admin. A regra de LEITURA
// (data efetiva, row→domínio) vive em `lib/exams/model.ts`.
//
// Isomórfico (recebe o SupabaseClient): a rota `/api/exams` (Web cookie · Mobile Bearer)
// e o processador de captura server-side chamam as MESMAS funções.
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import { fromTable, selectUserRows, updateUserRow } from '@/lib/api/db'
import { ValidationError } from '@/lib/api/errors'

const TABLE = 'exams'

/** Lista os exames da usuária (linha completa; a página projeta o que precisa). */
export async function listExams(supabase: SupabaseClient, userId: string): Promise<Record<string, unknown>[]> {
  return selectUserRows(supabase, TABLE, userId, { columns: '*', orderBy: 'created_at', ascending: false })
}

export interface ExamDraft { type: string; fileUrl?: string | null; examDate?: string | null }
export interface ExamPatch { type?: string; examDate?: string | null; status?: string }

/** PURO — monta o patch de update de `exams` (camelCase → coluna), validando. */
export function buildExamUpdate(patch: ExamPatch): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  if (patch.type !== undefined) {
    const t = (patch.type ?? '').trim()
    if (!t) throw new ValidationError('O nome do exame não pode ficar vazio.')
    row.type = t
  }
  if (patch.examDate !== undefined) row.exam_date = patch.examDate || null
  if (patch.status !== undefined) row.status = patch.status
  return row
}

/** Cria um exame (status 'pending') e devolve o id. O arquivo já foi persistido
 *  (uploadUserDocument) e o `fileUrl` (signed URL) é passado aqui. */
export async function createExam(supabase: SupabaseClient, userId: string, draft: ExamDraft): Promise<string> {
  const type = (draft.type ?? '').trim()
  if (!type) throw new ValidationError('Informe o tipo do exame.')
  const id = crypto.randomUUID()
  const { error } = await fromTable(supabase, TABLE).insert({
    id, user_id: userId, type, exam_date: draft.examDate ?? null,
    file_url: draft.fileUrl ?? null, status: 'pending',
  })
  if (error) throw new Error(error.message || 'Falha ao criar o exame.')
  return id
}

/** Atualiza campos do exame (escopado por usuária). No-op se o patch for vazio. */
export async function updateExam(supabase: SupabaseClient, userId: string, id: string, patch: ExamPatch): Promise<void> {
  const row = buildExamUpdate(patch)
  if (Object.keys(row).length === 0) return
  await updateUserRow(supabase, TABLE, userId, id, row)
}

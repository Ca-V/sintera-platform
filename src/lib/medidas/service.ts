// ============================================================
// SINTERA — Medidas corporais: serviço de domínio
// ============================================================
// Peso, altura, circunferência e composição corporal (bioimpedância). Série
// temporal autorrelatada sobre body_metrics — COMPARTILHADA com Sinais vitais —,
// por isso o acesso é escopado ao conjunto MEASURES (nunca cruza para sinais vitais
// e nunca misclassifica um vital como "outra medida").
//
// Base compartilhada (antes o CRUD vivia na página, client-direct): serviço
// tipado sobre SupabaseClient injetado, consumido por UM caminho único
// (/api/medidas → Web cookie + Mobile Bearer). Registro factual, sem juízo clínico.
// Cast das tabelas não-tipadas CONTIDO no repositório.
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import { selectUserRows, insertRows, deleteUserRow } from '@/lib/api/db'
import { ValidationError } from '@/lib/api/http'

export type Metric =
  | 'peso' | 'altura' | 'circunferencia_cintura'
  | 'imc' | 'gordura_corporal' | 'massa_muscular' | 'agua_corporal'
  | 'gordura_visceral' | 'massa_ossea' | 'taxa_metabolica'
  | 'outro'

/** Conjunto canônico de medidas corporais — escopa o acesso a body_metrics. */
export const MEASURES: Metric[] = [
  'peso', 'altura', 'circunferencia_cintura', 'imc', 'gordura_corporal',
  'massa_muscular', 'agua_corporal', 'gordura_visceral', 'massa_ossea', 'taxa_metabolica', 'outro',
]

const MEASURE_SET = new Set<string>(MEASURES)
function toMetric(v: unknown): Metric {
  return typeof v === 'string' && MEASURE_SET.has(v) ? (v as Metric) : 'outro'
}

/** Medida corporal no formato de domínio (camelCase), consumida por UI e API. */
export interface MeasureEntry {
  id: string
  metric: Metric
  label: string | null
  valueText: string
  unit: string | null
  measuredOn: string
  notes: string | null
  examId: string | null
}

/** Referência a um laudo (Exames) para vínculo opcional da medida. */
export interface ExamRef {
  id: string
  type: string
  examDate: string | null
  fileUrl: string | null
}

/** Entrada de criação vinda da UI/API (single ou item de lote). */
export interface MeasureInput {
  metric: Metric
  label?: string | null
  value: string
  unit?: string | null
  measuredOn: string
  notes?: string | null
  examId?: string | null
}

const TABLE = 'body_metrics'
const COLUMNS = 'id, metric, label, value_text, unit, measured_on, notes, exam_id'

interface MeasureRow {
  id: string
  metric: string | null
  label: string | null
  value_text: string | null
  unit: string | null
  measured_on: string
  notes: string | null
  exam_id: string | null
}

interface ExamRow {
  id: string
  type: string | null
  exam_date: string | null
  file_url: string | null
}

interface MeasurePayload {
  user_id: string
  metric: Metric
  label: string | null
  value_text: string
  unit: string | null
  measured_on: string
  notes: string | null
  exam_id: string | null
}

function toDomain(r: MeasureRow): MeasureEntry {
  return {
    id: r.id,
    metric: toMetric(r.metric),
    label: r.label ?? null,
    valueText: r.value_text ?? '',
    unit: r.unit ?? null,
    measuredOn: r.measured_on,
    notes: r.notes ?? null,
    examId: r.exam_id ?? null,
  }
}

/**
 * PURO — valida e normaliza (regras idênticas ao comportamento anterior da página):
 * `value` e `measuredOn` obrigatórios; `label` só existe em 'outro' (default 'Medida');
 * strings vazias viram null; `examId` vazio vira null.
 */
export function buildMeasurePayload(userId: string, input: MeasureInput): MeasurePayload {
  const metric = toMetric(input.metric)
  const valueText = (input.value ?? '').trim()
  if (!valueText) throw new ValidationError('Informe o valor da medida.')
  const measuredOn = (input.measuredOn ?? '').trim()
  if (!measuredOn) throw new ValidationError('Informe a data da medição.')
  return {
    user_id: userId,
    metric,
    label: metric === 'outro' ? ((input.label ?? '').trim() || 'Medida') : null,
    value_text: valueText,
    unit: (input.unit ?? '').trim() || null,
    measured_on: measuredOn,
    notes: (input.notes ?? '').trim() || null,
    exam_id: (input.examId ?? '').trim() || null,
  }
}

// ── Repositório (I/O) — pela fundação, escopado a MEASURES ────────────────────

export async function listMeasures(supabase: SupabaseClient, userId: string): Promise<MeasureEntry[]> {
  const rows = await selectUserRows<MeasureRow>(supabase, TABLE, userId, {
    columns: COLUMNS, scopeIn: { column: 'metric', values: MEASURES }, orderBy: 'measured_on',
  })
  return rows.map(toDomain)
}

/** Laudos da usuária para o vínculo opcional (dropdown). */
export async function listExamRefs(supabase: SupabaseClient, userId: string): Promise<ExamRef[]> {
  const rows = await selectUserRows<ExamRow>(supabase, 'exams', userId, {
    columns: 'id, type, exam_date, file_url', orderBy: 'created_at',
  })
  return rows.map(e => ({
    id: e.id, type: e.type || 'Exame', examDate: e.exam_date ?? null, fileUrl: e.file_url ?? null,
  }))
}

/** Cria uma ou várias medidas (o scan de bioimpedância envia várias de uma vez). */
export async function createMeasures(supabase: SupabaseClient, userId: string, inputs: MeasureInput[]): Promise<void> {
  await insertRows(supabase, TABLE, inputs.map(i => buildMeasurePayload(userId, i)))
}

export async function removeMeasure(supabase: SupabaseClient, userId: string, id: string): Promise<void> {
  // Escopo a MEASURES — impede remover um sinal vital por engano.
  await deleteUserRow(supabase, TABLE, userId, id, { column: 'metric', values: MEASURES })
}

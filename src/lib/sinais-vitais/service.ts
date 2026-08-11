// ============================================================
// SINTERA — Sinais vitais: serviço de domínio
// ============================================================
// Série temporal autorrelatada (pressão, FC, glicemia, saturação, temperatura).
// Reaproveita a tabela body_metrics — COMPARTILHADA com Medidas —, por isso todo
// acesso é escopado ao conjunto VITALS (nunca cruza para métricas corporais).
//
// Base compartilhada (antes o CRUD vivia na página, client-direct): serviço
// tipado sobre SupabaseClient injetado, consumido por UM caminho único
// (/api/sinais-vitais → Web cookie + Mobile Bearer). Registro factual, sem
// juízo clínico. Cast da tabela não-tipada CONTIDO no repositório.
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import { selectUserRows, insertRows, deleteUserRow } from '@/lib/api/db'
import { ValidationError } from '@/lib/api/errors'

export type Vital =
  | 'pressao_arterial'
  | 'frequencia_cardiaca'
  | 'glicemia'
  | 'saturacao'
  | 'temperatura'
  | 'outro_sinal'

/** Conjunto canônico de sinais vitais — usado para escopar o acesso a body_metrics. */
export const VITALS: Vital[] = [
  'pressao_arterial', 'frequencia_cardiaca', 'glicemia', 'saturacao', 'temperatura', 'outro_sinal',
]

const VITAL_SET = new Set<string>(VITALS)
function toVital(v: unknown): Vital {
  return typeof v === 'string' && VITAL_SET.has(v) ? (v as Vital) : 'outro_sinal'
}

/** Registro de sinal vital no formato de domínio (camelCase), consumido por UI e API. */
export interface VitalEntry {
  id: string
  metric: Vital
  label: string | null
  valueText: string
  unit: string | null
  measuredOn: string
  notes: string | null
}

/** Entrada de criação vinda da UI/API. */
export interface VitalInput {
  metric: Vital
  label?: string | null
  value: string
  unit?: string | null
  measuredOn: string
  notes?: string | null
}

const TABLE = 'body_metrics'
const COLUMNS = 'id, metric, label, value_text, unit, measured_on, notes'

interface VitalRow {
  id: string
  metric: string | null
  label: string | null
  value_text: string | null
  unit: string | null
  measured_on: string
  notes: string | null
}

interface VitalPayload {
  user_id: string
  metric: Vital
  label: string | null
  value_text: string
  unit: string | null
  measured_on: string
  notes: string | null
}

function toDomain(r: VitalRow): VitalEntry {
  return {
    id: r.id,
    metric: toVital(r.metric),
    label: r.label ?? null,
    valueText: r.value_text ?? '',
    unit: r.unit ?? null,
    measuredOn: r.measured_on,
    notes: r.notes ?? null,
  }
}

/**
 * PURO — valida e normaliza (regras idênticas ao comportamento anterior da página):
 * `value` e `measuredOn` obrigatórios; `label` só existe em 'outro_sinal' (default 'Sinal');
 * strings vazias viram null.
 */
export function buildVitalPayload(userId: string, input: VitalInput): VitalPayload {
  const metric = toVital(input.metric)
  const valueText = (input.value ?? '').trim()
  if (!valueText) throw new ValidationError('Informe o valor do sinal vital.')
  const measuredOn = (input.measuredOn ?? '').trim()
  if (!measuredOn) throw new ValidationError('Informe a data da medição.')
  return {
    user_id: userId,
    metric,
    label: metric === 'outro_sinal' ? ((input.label ?? '').trim() || 'Sinal') : null,
    value_text: valueText,
    unit: (input.unit ?? '').trim() || null,
    measured_on: measuredOn,
    notes: (input.notes ?? '').trim() || null,
  }
}

// ── Repositório (I/O) — pela fundação, sempre escopado a VITALS ───────────────

export async function listVitals(supabase: SupabaseClient, userId: string): Promise<VitalEntry[]> {
  const rows = await selectUserRows<VitalRow>(supabase, TABLE, userId, {
    columns: COLUMNS, scopeIn: { column: 'metric', values: VITALS }, orderBy: 'measured_on',
  })
  return rows.map(toDomain)
}

export async function createVital(supabase: SupabaseClient, userId: string, input: VitalInput): Promise<void> {
  await insertRows(supabase, TABLE, [buildVitalPayload(userId, input)])
}

export async function removeVital(supabase: SupabaseClient, userId: string, id: string): Promise<void> {
  // Escopo a VITALS — impede remover uma métrica corporal (Medidas) por engano.
  await deleteUserRow(supabase, TABLE, userId, id, { column: 'metric', values: VITALS })
}

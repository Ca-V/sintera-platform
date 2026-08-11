// ============================================================
// SINTERA — Hábitos de Vida: serviço de domínio
// ============================================================
// Fatores do dia a dia autorrelatados (atividade, sono, tabagismo, álcool,
// alimentação, hidratação…). Registro factual — a SINTERA organiza, não avalia.
//
// Base sobre a fundação (@/lib/api): CRUD/validação saem da página para cá,
// consumidos por UM caminho único (/api/habitos → Web cookie + Mobile Bearer).
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import { selectUserRows, insertRows, updateUserRow, deleteUserRow } from '@/lib/api/db'
import { ValidationError } from '@/lib/api/errors'

export type HabitCategory =
  | 'atividade_fisica' | 'sono' | 'tabagismo' | 'alcool' | 'alimentacao' | 'hidratacao' | 'outro'

const CATEGORY_SET = new Set<string>([
  'atividade_fisica', 'sono', 'tabagismo', 'alcool', 'alimentacao', 'hidratacao', 'outro',
])
function toCategory(v: unknown): HabitCategory {
  return typeof v === 'string' && CATEGORY_SET.has(v) ? (v as HabitCategory) : 'outro'
}

/** Hábito no formato de domínio (camelCase), consumido por UI e API. */
export interface Habit {
  id: string
  category: HabitCategory
  description: string
  frequency: string | null
  notes: string | null
}

/** Entrada de criação/edição vinda da UI/API. */
export interface HabitInput {
  category: HabitCategory
  description: string
  frequency?: string | null
  notes?: string | null
}

const TABLE = 'life_habits'
const COLUMNS = 'id, category, description, frequency, notes'

interface HabitRow {
  id: string
  category: string | null
  description: string | null
  frequency: string | null
  notes: string | null
}

interface HabitPayload {
  user_id: string
  category: HabitCategory
  description: string
  frequency: string | null
  notes: string | null
}

function toDomain(r: HabitRow): Habit {
  return {
    id: r.id,
    category: toCategory(r.category),
    description: r.description ?? '',
    frequency: r.frequency ?? null,
    notes: r.notes ?? null,
  }
}

/**
 * PURO — valida e normaliza (regras idênticas ao comportamento anterior da página):
 * `description` obrigatória (trim); `frequency`/`notes` vazios viram null.
 */
export function buildHabitPayload(userId: string, input: HabitInput): HabitPayload {
  const description = (input.description ?? '').trim()
  if (!description) throw new ValidationError('Informe a descrição do hábito.')
  return {
    user_id: userId,
    category: toCategory(input.category),
    description,
    frequency: (input.frequency ?? '').trim() || null,
    notes: (input.notes ?? '').trim() || null,
  }
}

// ── Repositório (I/O) — pela fundação (helpers escopados por usuária) ─────────

export async function listHabits(supabase: SupabaseClient, userId: string): Promise<Habit[]> {
  const rows = await selectUserRows<HabitRow>(supabase, TABLE, userId, { columns: COLUMNS, orderBy: 'created_at' })
  return rows.map(toDomain)
}

export async function createHabit(supabase: SupabaseClient, userId: string, input: HabitInput): Promise<void> {
  await insertRows(supabase, TABLE, [buildHabitPayload(userId, input)])
}

export async function updateHabit(supabase: SupabaseClient, userId: string, id: string, input: HabitInput): Promise<void> {
  await updateUserRow(supabase, TABLE, userId, id, buildHabitPayload(userId, input))
}

export async function removeHabit(supabase: SupabaseClient, userId: string, id: string): Promise<void> {
  await deleteUserRow(supabase, TABLE, userId, id)
}

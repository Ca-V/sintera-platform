// @sintera/api-client — domínio Hábitos (life_habits). CRUD do estado permanente + meta divisível. O LEMBRETE
// recorrente do hábito é um Evento Assistencial vinculado (EventLink 'habit') — sincronizado via syncLinkedReminder
// (infra única de lembrete). RLS: dono. Leitura LANÇA; escrita retorna { data?/error }.
import type { SupabaseClient } from '@supabase/supabase-js'
import type { HabitCategory } from '@sintera/core'
import { withTimeout } from '../net/timeout'
import { asError } from '../net/errors'

export interface HabitDTO {
  id: string
  category: HabitCategory
  description: string
  frequency: string | null
  notes: string | null
  goal_amount: number | null
  goal_unit: string | null
  goal_divisions: number | null
  plan_url: string | null
  plan_name: string | null
}

export interface HabitInput {
  id?: string
  category: HabitCategory
  description: string
  frequency?: string | null
  notes?: string | null
  goal_amount?: number | null
  goal_unit?: string | null
  goal_divisions?: number | null
  plan_url?: string | null
  plan_name?: string | null
}

const COLUMNS = 'id, category, description, frequency, notes, goal_amount, goal_unit, goal_divisions, plan_url, plan_name' as const

/** Lista os hábitos do usuário. `[]` se não houver. LANÇA em falha. */
export async function listHabits(client: SupabaseClient, signal?: AbortSignal): Promise<HabitDTO[]> {
  const { signal: s, cleanup } = withTimeout(signal)
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) throw new Error('Não autenticado')
    const { data, error } = await client.from('life_habits').select(COLUMNS)
      .eq('user_id', session.user.id).order('category').abortSignal(s)
    if (error) throw asError(error)
    return (data as HabitDTO[] | null) ?? []
  } finally {
    cleanup()
  }
}

/** Cria (sem id) ou atualiza (com id) um hábito. Retorna o id (para vincular o lembrete). NÃO lança. */
export async function saveHabit(client: SupabaseClient, input: HabitInput): Promise<{ data: { id: string } | null; error: Error | null }> {
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) return { data: null, error: new Error('Não autenticado') }
    if (!input.description?.trim()) return { data: null, error: new Error('Descreva o hábito') }
    const row: Record<string, unknown> = {
      user_id: session.user.id, category: input.category, description: input.description.trim(),
      frequency: input.frequency?.trim() || null, notes: input.notes?.trim() || null,
      goal_amount: input.goal_amount ?? null, goal_unit: input.goal_unit?.trim() || null,
      goal_divisions: input.goal_divisions ?? null, plan_url: input.plan_url ?? null, plan_name: input.plan_name ?? null,
    }
    const table = client.from('life_habits')
    const q = input.id
      ? table.update(row as never).eq('id', input.id).eq('user_id', session.user.id).select('id').single()
      : table.insert(row as never).select('id').single()
    const { data, error } = await q
    if (error) return { data: null, error: asError(error) }
    return { data: { id: (data as { id: string } | null)?.id ?? input.id ?? '' }, error: null }
  } catch (e) {
    return { data: null, error: asError(e) }
  }
}

/** Exclui um hábito (por id, dono via RLS). `{ error }`, NÃO lança. */
export async function deleteHabit(client: SupabaseClient, id: string): Promise<{ error: Error | null }> {
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) return { error: new Error('Não autenticado') }
    const { error } = await client.from('life_habits').delete().eq('id', id).eq('user_id', session.user.id)
    return { error: error ? asError(error) : null }
  } catch (e) {
    return { error: asError(e) }
  }
}

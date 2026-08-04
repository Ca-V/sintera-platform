// @sintera/api-client — domínio Condições de Saúde (health_conditions). CRUD do estado permanente da pessoa
// (e de familiares). RLS: dono. Leitura LANÇA em falha; escrita retorna { error }. FACTUAL (REG-001).
import type { SupabaseClient } from '@supabase/supabase-js'
import { withTimeout } from '../net/timeout'
import { asError } from '../net/errors'

export type ConditionScope = 'propria' | 'familiar'

/** Condição de saúde como lida/editada. `relative` só se `scope='familiar'`. */
export interface ConditionDTO {
  id: string
  scope: ConditionScope
  name: string
  relative: string | null
  since_label: string | null
  notes: string | null
  kind: string | null
  file_url: string | null
}

/** Entrada de gravação (id presente = edição). */
export interface ConditionInput {
  id?: string
  scope: ConditionScope
  name: string
  relative?: string | null
  since_label?: string | null
  notes?: string | null
  kind?: string | null
  file_url?: string | null
}

const COLUMNS = 'id, scope, name, relative, since_label, notes, kind, file_url' as const

/** Lista as condições do usuário (próprias + familiares). `[]` se não houver. LANÇA em falha. */
export async function listConditions(client: SupabaseClient, signal?: AbortSignal): Promise<ConditionDTO[]> {
  const { signal: s, cleanup } = withTimeout(signal)
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) throw new Error('Não autenticado')
    const { data, error } = await client.from('health_conditions').select(COLUMNS)
      .eq('user_id', session.user.id).order('created_at', { ascending: false }).abortSignal(s)
    if (error) throw asError(error)
    return (data as ConditionDTO[] | null) ?? []
  } finally {
    cleanup()
  }
}

/** Cria (sem id) ou atualiza (com id) uma condição. `{ error }`, NÃO lança. */
export async function saveCondition(client: SupabaseClient, input: ConditionInput): Promise<{ error: Error | null }> {
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) return { error: new Error('Não autenticado') }
    if (!input.name?.trim()) return { error: new Error('Informe o nome da condição') }
    const row: Record<string, unknown> = {
      user_id: session.user.id, scope: input.scope, name: input.name.trim(),
      relative: input.scope === 'familiar' ? (input.relative?.trim() || null) : null,
      since_label: input.since_label?.trim() || null, notes: input.notes?.trim() || null,
      kind: input.kind || null, file_url: input.file_url ?? null,
    }
    const table = client.from('health_conditions')
    const { error } = input.id
      ? await table.update(row as never).eq('id', input.id).eq('user_id', session.user.id)
      : await table.insert({ ...row, source: 'manual' } as never)
    return { error: error ? asError(error) : null }
  } catch (e) {
    return { error: asError(e) }
  }
}

/** Exclui uma condição (por id, dono via RLS). `{ error }`, NÃO lança. */
export async function deleteCondition(client: SupabaseClient, id: string): Promise<{ error: Error | null }> {
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) return { error: new Error('Não autenticado') }
    const { error } = await client.from('health_conditions').delete().eq('id', id).eq('user_id', session.user.id)
    return { error: error ? asError(error) : null }
  } catch (e) {
    return { error: asError(e) }
  }
}

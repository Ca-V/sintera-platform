// @sintera/api-client — domínio Recursos de Saúde (health_resources). CRUD do estado permanente + atributos
// por tipo (JSON, ex.: prescrição de correção visual). O LEMBRETE de troca é Evento vinculado (EventLink
// 'resource', via agenda.syncReminder). RLS: dono. Leitura LANÇA; escrita retorna { data?/error }.
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ResourceType, ResourceStatus } from '@sintera/core'
import { withTimeout } from '../net/timeout'
import { asError } from '../net/errors'

export interface ResourceDTO {
  id: string
  resource_type: ResourceType
  name: string
  brand: string | null
  prescriber: string | null
  started_on: string | null
  until_date: string | null
  status: ResourceStatus
  notes: string | null
  file_url: string | null
  attributes: Record<string, unknown> | null
}

export interface ResourceInput {
  id?: string
  resource_type: ResourceType
  name: string
  brand?: string | null
  prescriber?: string | null
  started_on?: string | null
  until_date?: string | null
  status: ResourceStatus
  notes?: string | null
  file_url?: string | null
  attributes?: Record<string, unknown> | null
}

const COLUMNS = 'id, resource_type, name, brand, prescriber, started_on, until_date, status, notes, file_url, attributes' as const

/** Lista os recursos do usuário. `[]` se não houver. LANÇA em falha. */
export async function listResources(client: SupabaseClient, signal?: AbortSignal): Promise<ResourceDTO[]> {
  const { signal: s, cleanup } = withTimeout(signal)
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) throw new Error('Não autenticado')
    const { data, error } = await client.from('health_resources').select(COLUMNS)
      .eq('user_id', session.user.id).order('name').abortSignal(s)
    if (error) throw asError(error)
    return (data as ResourceDTO[] | null) ?? []
  } finally {
    cleanup()
  }
}

/** Cria (sem id) ou atualiza (com id) um recurso. Retorna o id (para vincular o lembrete). NÃO lança. */
export async function saveResource(client: SupabaseClient, input: ResourceInput): Promise<{ data: { id: string } | null; error: Error | null }> {
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) return { data: null, error: new Error('Não autenticado') }
    if (!input.name?.trim()) return { data: null, error: new Error('Informe o nome do recurso') }
    const row: Record<string, unknown> = {
      user_id: session.user.id, resource_type: input.resource_type, name: input.name.trim(),
      brand: input.brand?.trim() || null, prescriber: input.prescriber?.trim() || null,
      started_on: input.started_on || null, until_date: input.until_date || null,
      status: input.status, notes: input.notes?.trim() || null, file_url: input.file_url ?? null,
      attributes: input.attributes ?? {},
    }
    const table = client.from('health_resources')
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

/** Exclui um recurso (por id, dono via RLS). `{ error }`, NÃO lança. */
export async function deleteResource(client: SupabaseClient, id: string): Promise<{ error: Error | null }> {
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) return { error: new Error('Não autenticado') }
    const { error } = await client.from('health_resources').delete().eq('id', id).eq('user_id', session.user.id)
    return { error: error ? asError(error) : null }
  } catch (e) {
    return { error: asError(e) }
  }
}

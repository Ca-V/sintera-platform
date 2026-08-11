// ============================================================
// SINTERA — Condições de Saúde: serviço de domínio
// ============================================================
// Base COMPARTILHADA da lógica de Condições. Antes, o CRUD + validação viviam
// dentro do componente de página (client-direct Supabase), então o Mobile não
// tinha o que reutilizar. Agora a lógica vive aqui e é consumida por UM caminho
// único: a rota /api/condicoes (Web via cookie, Mobile via Bearer).
//
// - `buildConditionPayload` é PURO (validação + normalização) — testável sem banco.
// - As funções de repositório concentram o acesso à tabela num único ponto; o
//   cast `as any` (health_conditions ainda não está nos tipos gerados) fica
//   CONTIDO aqui, em vez de espalhado por cada página.
//
// Registro factual/autorrelatado — NENHUM juízo clínico (a SINTERA organiza,
// não infere condições).
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import { fromTable } from '@/lib/api/db'
import { ValidationError } from '@/lib/api/http'

export type ConditionScope = 'propria' | 'familiar'

/** Condição no formato de domínio (camelCase), consumido pela UI e pela API. */
export interface Condition {
  id: string
  scope: ConditionScope
  name: string
  relative: string | null
  sinceLabel: string | null
  notes: string | null
}

/** Entrada de criação/edição vinda da UI/API. */
export interface ConditionInput {
  scope: ConditionScope
  name: string
  relative?: string | null
  sinceLabel?: string | null
  notes?: string | null
}

const TABLE = 'health_conditions'
const COLUMNS = 'id, scope, name, relative, since_label, notes'

/** Linha crua da tabela (health_conditions ainda não está nos tipos gerados). */
interface ConditionRow {
  id: string
  scope: string | null
  name: string | null
  relative: string | null
  since_label: string | null
  notes: string | null
}

/** Payload persistido (snake_case do banco). */
interface ConditionPayload {
  user_id: string
  scope: ConditionScope
  name: string
  relative: string | null
  since_label: string | null
  notes: string | null
}

function toDomain(r: ConditionRow): Condition {
  return {
    id: r.id,
    scope: r.scope === 'familiar' ? 'familiar' : 'propria',
    name: r.name ?? '',
    relative: r.relative ?? null,
    sinceLabel: r.since_label ?? null,
    notes: r.notes ?? null,
  }
}

/**
 * PURO — valida e normaliza a entrada em payload de banco. Regras (idênticas ao
 * comportamento anterior da página): nome obrigatório (trim); `relative` só existe
 * no escopo familiar; strings vazias viram null.
 */
export function buildConditionPayload(userId: string, input: ConditionInput): ConditionPayload {
  const name = (input.name ?? '').trim()
  if (!name) throw new ValidationError('Informe o nome da condição.')
  const scope: ConditionScope = input.scope === 'familiar' ? 'familiar' : 'propria'
  return {
    user_id: userId,
    scope,
    name,
    relative: scope === 'familiar' ? ((input.relative ?? '').trim() || null) : null,
    since_label: (input.sinceLabel ?? '').trim() || null,
    notes: (input.notes ?? '').trim() || null,
  }
}

// ── Repositório (I/O) — acesso à tabela pela fundação (fromTable) ─────────────

export async function listConditions(supabase: SupabaseClient, userId: string): Promise<Condition[]> {
  const { data, error } = await fromTable(supabase, TABLE)
    .select(COLUMNS)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return ((data ?? []) as ConditionRow[]).map(toDomain)
}

export async function createCondition(supabase: SupabaseClient, userId: string, input: ConditionInput): Promise<void> {
  const payload = buildConditionPayload(userId, input)
  const { error } = await fromTable(supabase, TABLE).insert(payload)
  if (error) throw new Error(error.message)
}

export async function updateCondition(supabase: SupabaseClient, userId: string, id: string, input: ConditionInput): Promise<void> {
  const payload = buildConditionPayload(userId, input)
  // Filtro por user_id além do id — defesa em profundidade sobre a RLS.
  const { error } = await fromTable(supabase, TABLE).update(payload).eq('id', id).eq('user_id', userId)
  if (error) throw new Error(error.message)
}

export async function removeCondition(supabase: SupabaseClient, userId: string, id: string): Promise<void> {
  const { error } = await fromTable(supabase, TABLE).delete().eq('id', id).eq('user_id', userId)
  if (error) throw new Error(error.message)
}

// ============================================================
// SINTERA — Fundação de API: acesso a dados escopado por usuária
// ============================================================
// Duas responsabilidades permanentes, únicas para toda a plataforma:
//  1. `fromTable` — concentra o cast de tabelas ainda não tipadas (health_conditions,
//     body_metrics, …) num único ponto. Tipar aqui, no futuro, propaga a todos.
//  2. Repositório escopado por usuária (`selectUserRows`/`insertRows`/`updateUserRow`/
//     `deleteUserRow`) — elimina o mecanismo de CRUD que cada serviço repetia
//     (filtro por user_id, escopo opcional por conjunto, ordenação, tratamento de
//     erro). Cada serviço mantém só o que é de DOMÍNIO: colunas, mapeamento e
//     validação. Reutilizado por Condições, Medidas, Sinais e por futuras origens
//     escopadas por usuária (ex.: wearable_readings). Não força-se sobre módulos de
//     domínio rico (agenda/exames) — é opcional, para recursos CRUD simples.
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js'

/** Query builder de uma tabela, com o cast não-tipado isolado neste ponto. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fromTable(supabase: SupabaseClient, table: string): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from(table)
}

/** Escopo adicional opcional: restringe a um conjunto de valores de uma coluna. */
export interface ScopeIn {
  column: string
  values: readonly string[]
}

export interface SelectOptions {
  columns?: string
  orderBy?: string
  /** default: false (mais recente primeiro), coerente com o uso atual dos módulos. */
  ascending?: boolean
  scopeIn?: ScopeIn
}

/** SELECT escopado por `user_id` (+ escopo opcional), ordenado. Lança em erro. */
export async function selectUserRows<T = Record<string, unknown>>(
  supabase: SupabaseClient,
  table: string,
  userId: string,
  opts: SelectOptions = {},
): Promise<T[]> {
  let query = fromTable(supabase, table).select(opts.columns ?? '*').eq('user_id', userId)
  if (opts.scopeIn) query = query.in(opts.scopeIn.column, opts.scopeIn.values)
  if (opts.orderBy) query = query.order(opts.orderBy, { ascending: opts.ascending ?? false })
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as T[]
}

/** INSERT de uma ou várias linhas. No-op se vazio. Lança em erro. */
export async function insertRows(supabase: SupabaseClient, table: string, rows: unknown[]): Promise<void> {
  if (rows.length === 0) return
  const { error } = await fromTable(supabase, table).insert(rows)
  if (error) throw new Error(error.message)
}

/** UPDATE de uma linha por `id`, escopado por `user_id` (+ escopo opcional). Lança em erro. */
export async function updateUserRow(
  supabase: SupabaseClient,
  table: string,
  userId: string,
  id: string,
  patch: unknown,
  scopeIn?: ScopeIn,
): Promise<void> {
  let query = fromTable(supabase, table).update(patch).eq('id', id).eq('user_id', userId)
  if (scopeIn) query = query.in(scopeIn.column, scopeIn.values)
  const { error } = await query
  if (error) throw new Error(error.message)
}

/** DELETE de uma linha por `id`, escopado por `user_id` (+ escopo opcional). Lança em erro. */
export async function deleteUserRow(
  supabase: SupabaseClient,
  table: string,
  userId: string,
  id: string,
  scopeIn?: ScopeIn,
): Promise<void> {
  let query = fromTable(supabase, table).delete().eq('id', id).eq('user_id', userId)
  if (scopeIn) query = query.in(scopeIn.column, scopeIn.values)
  const { error } = await query
  if (error) throw new Error(error.message)
}

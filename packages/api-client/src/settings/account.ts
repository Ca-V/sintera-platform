// @sintera/api-client — operações de CONTA (exportar dados · excluir conta). PONTE TRANSITÓRIA (ADR-020): reusam
// as rotas /api/account da Web (MESMA regra), autenticando por Bearer (as rotas aceitam Cookie e Bearer via
// getAuthedSupabase). Excluir é IRREVERSÍVEL. Convenção de escrita: retornam { error } / { data, error }; NÃO lançam.
import type { SupabaseClient } from '@supabase/supabase-js'
import { asError } from '../net/errors'

/** Baixa (exporta) todos os dados do usuário como JSON. `{ data: <json>, error }`. NÃO lança. */
export async function exportAccountData(client: SupabaseClient, webBaseUrl: string | undefined): Promise<{ data: unknown; error: Error | null }> {
  try {
    if (!webBaseUrl) return { data: null, error: new Error('URL não configurada.') }
    const { data: { session } } = await client.auth.getSession()
    if (!session) return { data: null, error: new Error('Não autenticado') }
    const res = await fetch(`${webBaseUrl.replace(/\/+$/, '')}/api/account/export`, { headers: { Authorization: `Bearer ${session.access_token}` } })
    if (!res.ok) return { data: null, error: new Error(`Exportação falhou (${res.status}).`) }
    return { data: await res.json(), error: null }
  } catch (e) {
    return { data: null, error: asError(e) }
  }
}

/** Exclui a conta e TODOS os dados (irreversível). `{ error }`. NÃO lança. */
export async function deleteAccount(client: SupabaseClient, webBaseUrl: string | undefined): Promise<{ error: Error | null }> {
  try {
    if (!webBaseUrl) return { error: new Error('URL não configurada.') }
    const { data: { session } } = await client.auth.getSession()
    if (!session) return { error: new Error('Não autenticado') }
    const res = await fetch(`${webBaseUrl.replace(/\/+$/, '')}/api/account`, { method: 'DELETE', headers: { Authorization: `Bearer ${session.access_token}` } })
    if (!res.ok) return { error: new Error(`Exclusão falhou (${res.status}).`) }
    return { error: null }
  } catch (e) {
    return { error: asError(e) }
  }
}

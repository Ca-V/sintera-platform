// @sintera/api-client — Relatório (Camada de Comunicação): links públicos de compartilhamento (report_shares),
// perfis de comunicação salvos (report_templates) e painéis de ômica (omics_panels, leitura p/ a compilação).
// RLS: dono. Leitura LANÇA; escrita { error }. A MONTAGEM/formatação do relatório vive no @sintera/core.
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Period } from '@sintera/core'
import { withTimeout } from '../net/timeout'
import { asError } from '../net/errors'

export interface ShareDTO { id: string; token: string; expires_at: string }
export interface TemplateDTO { id: string; name: string; selection: Record<string, unknown> }
export interface OmicsPanelDTO { domain: string; laboratory: string | null; total_features: number | null; collected_on: string | null; created_at: string | null }

const DAY_MS = 24 * 60 * 60 * 1000

export async function listShares(client: SupabaseClient, signal?: AbortSignal): Promise<ShareDTO[]> {
  const { signal: s, cleanup } = withTimeout(signal)
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) throw new Error('Não autenticado')
    const { data, error } = await client.from('report_shares')
      .select('id, token, expires_at').eq('user_id', session.user.id).eq('revoked', false)
      .gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false }).abortSignal(s)
    if (error) throw asError(error)
    return (data as ShareDTO[] | null) ?? []
  } finally {
    cleanup()
  }
}

/** Cria um link público (30 dias por padrão) com as seções, o filtro por item (excluded) e o período. Retorna o token. */
export async function createShare(
  client: SupabaseClient,
  input: { sections: string[]; excluded?: Partial<Record<string, string[]>>; period: Period; days?: number },
): Promise<{ data: { token: string } | null; error: Error | null }> {
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) return { data: null, error: new Error('Não autenticado') }
    const expires_at = new Date(Date.now() + (input.days ?? 30) * DAY_MS).toISOString()
    // Token gerado pelo BANCO (default pgcrypto — H-18): sem dependência de Web Crypto no cliente (ausente no
    // Hermes/Expo por padrão). Insere sem token e LÊ o token gerado de volta. Mesmo caminho Web e Mobile.
    const { data, error } = await client.from('report_shares').insert({
      user_id: session.user.id, expires_at, sections: input.sections, excluded: input.excluded ?? {}, period: input.period, revoked: false,
    } as never).select('token').single()
    if (error) return { data: null, error: asError(error) }
    const token = (data as { token: string } | null)?.token
    return token ? { data: { token }, error: null } : { data: null, error: new Error('Falha ao gerar o link.') }
  } catch (e) {
    return { data: null, error: asError(e) }
  }
}

export async function revokeShare(client: SupabaseClient, id: string): Promise<{ error: Error | null }> {
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) return { error: new Error('Não autenticado') }
    const { error } = await client.from('report_shares').update({ revoked: true } as never).eq('id', id).eq('user_id', session.user.id)
    return { error: error ? asError(error) : null }
  } catch (e) {
    return { error: asError(e) }
  }
}

export async function listTemplates(client: SupabaseClient, signal?: AbortSignal): Promise<TemplateDTO[]> {
  const { signal: s, cleanup } = withTimeout(signal)
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) throw new Error('Não autenticado')
    const { data, error } = await client.from('report_templates')
      .select('id, name, selection').eq('user_id', session.user.id).order('created_at', { ascending: false }).abortSignal(s)
    if (error) throw asError(error)
    return ((data as Array<{ id: string; name: string; selection: Record<string, unknown> | null }> | null) ?? [])
      .map(t => ({ id: t.id, name: t.name, selection: t.selection ?? {} }))
  } finally {
    cleanup()
  }
}

export async function saveTemplate(client: SupabaseClient, input: { name: string; selection: Record<string, unknown> }): Promise<{ error: Error | null }> {
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) return { error: new Error('Não autenticado') }
    if (!input.name?.trim()) return { error: new Error('Informe um nome') }
    const { error } = await client.from('report_templates').insert({ user_id: session.user.id, name: input.name.trim(), selection: input.selection } as never)
    return { error: error ? asError(error) : null }
  } catch (e) {
    return { error: asError(e) }
  }
}

export async function deleteTemplate(client: SupabaseClient, id: string): Promise<{ error: Error | null }> {
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) return { error: new Error('Não autenticado') }
    const { error } = await client.from('report_templates').delete().eq('id', id).eq('user_id', session.user.id)
    return { error: error ? asError(error) : null }
  } catch (e) {
    return { error: asError(e) }
  }
}

export async function listOmicsPanels(client: SupabaseClient, signal?: AbortSignal): Promise<OmicsPanelDTO[]> {
  const { signal: s, cleanup } = withTimeout(signal)
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) throw new Error('Não autenticado')
    const { data, error } = await client.from('omics_panels')
      .select('domain, laboratory, total_features, collected_on, created_at')
      .eq('user_id', session.user.id).order('collected_on', { ascending: false, nullsFirst: false }).abortSignal(s)
    if (error) throw asError(error)
    return (data as OmicsPanelDTO[] | null) ?? []
  } finally {
    cleanup()
  }
}

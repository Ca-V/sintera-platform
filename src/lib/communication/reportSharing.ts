// ============================================================
// SINTERA — Camada de Comunicação: LINKS compartilhados + PERFIS (templates)
// ============================================================
// Conclui a propagação da fundação serviço+rota ao sub-domínio de compartilhamento
// do Relatório (antes escrito client-direct na página). Dono das escritas de:
//   • report_shares    — link somente-leitura, temporário e revogável (/r/[token]);
//   • report_templates — "Perfis de Comunicação" (configuração salva de relatório).
// Token e validade são gerados AQUI (servidor), não no cliente. Isomórfico (recebe o
// SupabaseClient); consumido pela página via /api/report/shares e /api/report/templates.
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import { fromTable } from '@/lib/api/db'
import { ValidationError } from '@/lib/api/errors'

const SHARE_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 dias

export interface ReportShare { id: string; token: string; expiresAt: string }
export interface ReportTemplate { id: string; name: string; selection: Record<string, unknown> }

// ── Shares ──────────────────────────────────────────────────────────────────
/** Links ativos (não revogados, não expirados), mais recentes primeiro. */
export async function listShares(supabase: SupabaseClient, userId: string): Promise<ReportShare[]> {
  const { data } = await fromTable(supabase, 'report_shares')
    .select('id, token, expires_at').eq('user_id', userId).eq('revoked', false)
    .gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false })
  return ((data ?? []) as Array<Record<string, unknown>>).map((s) => ({
    id: s.id as string, token: s.token as string, expiresAt: s.expires_at as string,
  }))
}

/** Cria um link (token + validade gerados no servidor). `sections`/`period` = recorte do relatório. */
export async function createShare(
  supabase: SupabaseClient, userId: string,
  input: { sections: string[]; period: unknown },
): Promise<void> {
  const token = (crypto.randomUUID() + crypto.randomUUID()).replace(/-/g, '')
  const expiresAt = new Date(Date.now() + SHARE_TTL_MS).toISOString()
  const { error } = await fromTable(supabase, 'report_shares').insert({
    user_id: userId, token, expires_at: expiresAt, sections: input.sections, period: input.period,
  })
  if (error) throw new Error(error.message || 'Falha ao gerar o link.')
}

/** Revoga um link (soft-delete: revoked=true), escopado por usuária. */
export async function revokeShare(supabase: SupabaseClient, userId: string, id: string): Promise<void> {
  const { error } = await fromTable(supabase, 'report_shares').update({ revoked: true }).eq('id', id).eq('user_id', userId)
  if (error) throw new Error(error.message || 'Falha ao revogar o link.')
}

// ── Templates (Perfis de Comunicação) ─────────────────────────────────────────
export async function listTemplates(supabase: SupabaseClient, userId: string): Promise<ReportTemplate[]> {
  const { data } = await fromTable(supabase, 'report_templates')
    .select('id, name, selection').eq('user_id', userId).order('created_at', { ascending: false })
  return ((data ?? []) as Array<Record<string, unknown>>).map((t) => ({
    id: t.id as string, name: t.name as string, selection: (t.selection as Record<string, unknown>) ?? {},
  }))
}

export async function createTemplate(
  supabase: SupabaseClient, userId: string,
  input: { name: string; selection: unknown },
): Promise<void> {
  const name = (input.name ?? '').trim()
  if (!name) throw new ValidationError('Informe o nome da configuração.')
  const { error } = await fromTable(supabase, 'report_templates').insert({
    user_id: userId, name, selection: input.selection ?? {},
  })
  if (error) throw new Error(error.message || 'Falha ao salvar a configuração.')
}

export async function deleteTemplate(supabase: SupabaseClient, userId: string, id: string): Promise<void> {
  const { error } = await fromTable(supabase, 'report_templates').delete().eq('id', id).eq('user_id', userId)
  if (error) throw new Error(error.message || 'Falha ao excluir a configuração.')
}

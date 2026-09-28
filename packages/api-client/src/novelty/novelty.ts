// @sintera/api-client — NOV-001: o que a pessoa ainda não viu.
//
// PONTE ADR-020. A contagem de novidade mora numa rota da Web, que de passagem sincroniza os conectores
// (com throttle) antes de contar. Reimplementar isso no aplicativo criaria um segundo dono do mesmo conceito
// — e o segundo esqueceria a sincronização, que é justamente o que faz a contagem valer alguma coisa.
//
// AS ROTAS PASSARAM A ACEITAR BEARER em 28/09/2026. Antes eram só de cookie: o NOV-001 declarava
// infraestrutura ÚNICA e canal-agnóstico, mas a porta só abria para a Web, e os selos "novo" nunca poderiam
// existir no aplicativo. A homologação de Composição Corporal foi onde isso apareceu.
import type { SupabaseClient } from '@supabase/supabase-js'
import { withTimeout } from '../net/timeout'

export interface NoveltyEntry { count: number; since: string | null }
export type NoveltyStreams = Record<string, NoveltyEntry>

/**
 * O estado da novidade por fluxo. NUNCA lança: novidade é enfeite informativo, e derrubar a tela de
 * Composição Corporal porque a contagem falhou seria trocar o essencial pelo acessório.
 */
export async function getNovelty(
  client: SupabaseClient, webBaseUrl?: string, signal?: AbortSignal,
): Promise<NoveltyStreams> {
  const { signal: s, cleanup } = withTimeout(signal)
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session || !webBaseUrl) return {}
    const res = await fetch(new URL('/api/novelty', webBaseUrl).toString(), {
      headers: { Authorization: `Bearer ${session.access_token}` },
      signal: s,
    })
    if (!res.ok) return {}
    const corpo = await res.json() as { streams?: NoveltyStreams }
    return corpo.streams ?? {}
  } catch {
    return {}
  } finally {
    cleanup()
  }
}

/**
 * Reconhecimento NATURAL: a tela onde o conteúdo vive marca o fluxo como visto ao abrir. Não há botão de
 * "dispensar", e esta chamada é best-effort — reconhecer nunca bloqueia a navegação.
 */
export async function markNoveltySeen(
  client: SupabaseClient, stream: string, webBaseUrl?: string, signal?: AbortSignal,
): Promise<void> {
  const { signal: s, cleanup } = withTimeout(signal)
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session || !webBaseUrl) return
    await fetch(new URL('/api/novelty/seen', webBaseUrl).toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ stream }),
      signal: s,
    })
  } catch {
    // best-effort, de propósito.
  } finally {
    cleanup()
  }
}

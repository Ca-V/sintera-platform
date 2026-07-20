// ============================================================
// NOV-001 — Infraestrutura de Novidade (fonte ÚNICA, servidor)
// ============================================================
// Responde, para TODA a plataforma, a uma só pergunta: "o usuário já tomou conhecimento deste conteúdo?".
// - Um "fluxo" (stream) é uma categoria de conteúdo incorporado AUTOMATICAMENTE (sem ação direta do usuário):
//   dados de wearable, novos exames, novos documentos, sincronizações… Aberto/extensível.
// - "Visto" é marcado por (usuário × fluxo) na tabela content_seen (SSOT). "Não-visto" = itens do fluxo com
//   created_at posterior à marca de visto — derivado por consulta, nunca duplicado.
// - Banner (Painel Inicial), selos "Novo" (módulo de consumo) e futuras notificações leem TODOS daqui.
// Adicionar um fluxo = acrescentar uma entrada em NOVELTY_STREAMS e apontar sua superfície de consumo (markSeen).
// ============================================================
import type { SupabaseClient } from '@supabase/supabase-js'

/** Um fluxo declara apenas COMO contar o que ainda não foi visto. Nada além disso é específico do domínio. */
export interface NoveltyStream {
  /** identificador estável do fluxo (persistido em content_seen.stream) */
  key: string
  /** conta os itens do fluxo incorporados após `since` (ou todos, se `since` for nulo) */
  countUnseen(admin: SupabaseClient, userId: string, since: string | null): Promise<number>
}

/** Registro central dos fluxos. Ponto único de extensão para exames, documentos, sinais vitais, etc. */
export const NOVELTY_STREAMS: NoveltyStream[] = [
  {
    // Dados corporais vindos de wearable (peso/composição). Superfície de consumo = Composição Corporal.
    key: 'wearable_body',
    async countUnseen(admin, userId, since) {
      let q = admin
        .from('body_metrics')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('source', 'wearable')
      if (since) q = q.gt('created_at', since)
      const { count } = await q
      return count ?? 0
    },
  },
]

export interface NoveltyEntry {
  count: number
  since: string | null
}
export type NoveltyState = Record<string, NoveltyEntry>

const STREAM_BY_KEY = new Map(NOVELTY_STREAMS.map((s) => [s.key, s]))

/** Existe esse fluxo? (validação de entrada para markSeen). */
export function isKnownStream(stream: string): boolean {
  return STREAM_BY_KEY.has(stream)
}

/** Estado de novidade por fluxo: contagem de não-visto + o instante de "visto" (para destacar os novos). Read-only. */
export async function getNovelty(admin: SupabaseClient, userId: string): Promise<NoveltyState> {
  const seen = await admin.from('content_seen').select('stream, seen_at').eq('user_id', userId)
  const sinceByStream = new Map<string, string | null>()
  for (const row of (seen.data ?? []) as { stream: string; seen_at: string }[]) {
    sinceByStream.set(row.stream, row.seen_at)
  }
  const out: NoveltyState = {}
  for (const s of NOVELTY_STREAMS) {
    const since = sinceByStream.get(s.key) ?? null
    out[s.key] = { count: await s.countUnseen(admin, userId, since), since }
  }
  return out
}

/** Reconhecimento NATURAL: ao ver a superfície de consumo, marca o fluxo como visto AGORA. Upsert idempotente. */
export async function markSeen(admin: SupabaseClient, userId: string, stream: string, at?: string): Promise<void> {
  if (!isKnownStream(stream)) return
  await admin
    .from('content_seen')
    .upsert({ user_id: userId, stream, seen_at: at ?? new Date().toISOString() }, { onConflict: 'user_id,stream' })
}

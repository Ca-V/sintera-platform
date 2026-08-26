// WEA-001 / HIP-001 / HIP-014 — implementação REAL (IO) do PersistClient. Fina de propósito: toda a lógica
// determinística vive em `persistence.ts` do core (pura, testada). Aqui só há IO.
//
// ESTE MÓDULO NÃO CONTÉM CREDENCIAL. A credencial vem no cliente que se passa, e é isso que permite os DOIS
// caminhos usarem a MESMA implementação em vez de duas cópias que um dia divergem:
//
//   • servidor da Web → cliente SERVICE-ROLE (conector OAuth do lado do servidor). A chave é resolvida em
//     `src/lib/connectors/runtime.server.ts`, que permanece fora dos pacotes.
//   • aplicativo       → cliente da SESSÃO da pessoa. O Health Connect lê NO APARELHO, e desde a migração 150
//     o dono tem política de INSERT em `wearable_readings` e `connector_sync_runs` (HIP-014 §5/§6).
//
// Escrever privilegiado NUNCA entra em `packages/` — o que entrou aqui foi o código, que é agnóstico. A guarda
// `tests/contracts/conector-fronteira.ARCH.test.ts` verifica exatamente essa fronteira.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { PersistClient, WearableReadingRow, BodyMetricRow } from '@sintera/core'
import type { SyncRunRecorder } from '@sintera/core'

export function createSupabasePersistClient(supabase: SupabaseClient): PersistClient {
  return {
    async upsertReadings(rows: WearableReadingRow[]) {
      if (rows.length === 0) return
      // Idempotente: unique(user_id, provider, metric, recorded_at) (migração 025).
      const { error } = await supabase
        .from('wearable_readings')
        .upsert(rows, { onConflict: 'user_id,provider,metric,recorded_at' })
      if (error) throw new Error(`upsertReadings: ${error.message}`)
    },

    async replaceBodyMetricPoints(userId: string, source: string, points: BodyMetricRow[]) {
      if (points.length === 0) return
      // Substitui SÓ os pontos desta origem nas chaves (métrica, dia) do lote — nunca toca manual/exame.
      // PRESERVA created_at dos pontos INALTERADOS (mesmo valor no mesmo dia): reinserir mudaria a ingestão e
      // quebraria o "novo desde a última visita". Só apaga/insere o que realmente mudou ou entrou (V2 Aha-R3).
      const orFilter = points
        .map((p) => `and(metric.eq.${p.metric},measured_on.eq.${p.measured_on})`)
        .join(',')
      const existing = await supabase
        .from('body_metrics')
        .select('id, metric, measured_on, value_text')
        .eq('user_id', userId)
        .eq('source', source)
        .or(orFilter)
      if (existing.error) throw new Error(`replaceBodyMetricPoints/read: ${existing.error.message}`)
      const key = (m: string, d: string, v: string) => `${m}|${d}|${v}`
      const rows = (existing.data ?? []) as { id: string; metric: string; measured_on: string; value_text: string }[]
      const existingIdByKey = new Map(rows.map((r) => [key(r.metric, r.measured_on, r.value_text), r.id]))
      const preservedIds = new Set<string>()
      const toInsert = points.filter((p) => {
        const id = existingIdByKey.get(key(p.metric, p.measured_on, p.value_text))
        if (id) { preservedIds.add(id); return false } // idêntico → mantém (created_at preservado)
        return true
      })
      const toDeleteIds = [...new Set(rows.map((r) => r.id))].filter((id) => !preservedIds.has(id))
      if (toDeleteIds.length > 0) {
        const del = await supabase.from('body_metrics').delete().in('id', toDeleteIds)
        if (del.error) throw new Error(`replaceBodyMetricPoints/delete: ${del.error.message}`)
      }
      if (toInsert.length > 0) {
        const ins = await supabase.from('body_metrics').insert(toInsert)
        if (ins.error) throw new Error(`replaceBodyMetricPoints/insert: ${ins.error.message}`)
      }
    },
  }
}

/** Leitor da marca d'água (maior recorded_at já gravado) — define o `since` da sync incremental. */
export function createSupabaseWatermarkReader(supabase: SupabaseClient) {
  return {
    async lastRecordedAt(userId: string, source: string): Promise<string | null> {
      const { data, error } = await supabase
        .from('wearable_readings')
        .select('recorded_at')
        .eq('user_id', userId)
        .eq('provider', source)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw new Error(`watermark: ${error.message}`)
      return (data?.recorded_at as string | undefined) ?? null
    },
  }
}

/** Gravador real do histórico de sync (connector_sync_runs). IO fino; usado pelo orquestrador. */
export function createSupabaseSyncRecorder(supabase: SupabaseClient): SyncRunRecorder {
  return {
    async record(run) {
      const { error } = await supabase.from('connector_sync_runs').insert({
        user_id: run.userId,
        source: run.source,
        started_at: run.startedAt,
        finished_at: run.finishedAt,
        status: run.status,
        records_count: run.recordsCount,
        error: run.error,
        last_success_at: run.lastSuccessAt,
      })
      if (error) throw new Error(`recordSyncRun: ${error.message}`)
    },
  }
}

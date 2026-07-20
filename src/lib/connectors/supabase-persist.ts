// WEA-001 / HIP-001 — V2 Épico 1.3: implementação REAL (IO) do PersistClient sobre o cliente service-role.
// Fino de propósito: toda a lógica determinística vive em persistence.ts (puro/testado). Aqui só há IO.
// Deve ser chamado SEMPRE com um cliente service-role (tokens/escrita privilegiada; nunca o cliente do browser).

import type { SupabaseClient } from '@supabase/supabase-js'
import type { PersistClient, WearableReadingRow, BodyMetricRow } from './persistence'

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
      const orFilter = points
        .map((p) => `and(metric.eq.${p.metric},measured_on.eq.${p.measured_on})`)
        .join(',')
      const del = await supabase
        .from('body_metrics')
        .delete()
        .eq('user_id', userId)
        .eq('source', source)
        .or(orFilter)
      if (del.error) throw new Error(`replaceBodyMetricPoints/delete: ${del.error.message}`)
      const ins = await supabase.from('body_metrics').insert(points)
      if (ins.error) throw new Error(`replaceBodyMetricPoints/insert: ${ins.error.message}`)
    },
  }
}

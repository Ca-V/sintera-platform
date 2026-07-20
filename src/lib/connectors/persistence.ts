// WEA-001 / HIP-001 — V2 Épico 1.3: propagação CanonicalSample → persistência canônica.
//
// Decisão de arquitetura (convergência progressiva):
//   • `wearable_readings` = SSOT BRUTO/AUDITÁVEL do que o conector ingeriu (série no tempo + proveniência +
//     idempotência via unique(user_id,provider,metric,recorded_at)).
//   • `body_metrics`      = PROJEÇÃO DE EXIBIÇÃO (BOD-001): a Composição/Monitoramento da V1 já leem
//     `source='wearable'`. Granularidade de DIA (measured_on); último do dia vence (projeção, não a verdade).
//   • UCDA/clinical_results para SÉRIES de wearable fica para a convergência (V3+) — não forçar streams no
//     contrato documental agora (evita abstração antecipada). O núcleo já é vendor-neutral pelo CanonicalSample.
//
// Este módulo é PURO nos mapeadores; a IO fica atrás de `PersistClient` (injetável → testável).

import { dedupWithinSource, type CanonicalSample } from './connector'

/** Métricas canônicas que projetam para body_metrics (constraint body_metrics.metric). 'outro'/'outro_sinal' não. */
export const BODY_METRIC_KEYS: ReadonlySet<string> = new Set([
  'peso', 'altura', 'circunferencia_cintura', 'imc', 'gordura_corporal', 'massa_muscular', 'massa_magra',
  'agua_corporal', 'gordura_visceral', 'massa_ossea', 'taxa_metabolica', 'pressao_arterial',
  'frequencia_cardiaca', 'glicemia', 'saturacao', 'temperatura',
])

/** Rótulo/modalidade de origem em body_metrics para dados de conector (BOD-001 já reconhece 'wearable'). */
export const WEARABLE_SOURCE = 'wearable' as const

/** Linha bruta (SSOT) — espelha a tabela wearable_readings. */
export interface WearableReadingRow {
  user_id: string
  provider: string
  metric: string
  value: number | null
  unit: string | null
  recorded_at: string
  external_id: string | null
  connector_version: string
}

/** Ponto projetado de exibição — espelha o subconjunto usado em body_metrics. */
export interface BodyMetricRow {
  user_id: string
  metric: string
  label: string | null
  value_text: string
  unit: string | null
  measured_on: string // YYYY-MM-DD (UTC, determinístico)
  source: string
}

/** Data (UTC) do instante ISO — determinística (DATE-001: regra de data única/determinística). */
export function utcDateOf(recordedAt: string): string {
  const d = new Date(recordedAt)
  if (Number.isNaN(d.getTime())) throw new Error(`recordedAt inválido: ${recordedAt}`)
  return d.toISOString().slice(0, 10)
}

/** CanonicalSample → linha bruta de wearable_readings (sempre; preserva proveniência). */
export function toWearableReadingRow(sample: CanonicalSample, userId: string): WearableReadingRow {
  return {
    user_id: userId,
    provider: sample.provenance.source,
    metric: sample.metric,
    value: sample.value,
    unit: sample.unit,
    recorded_at: sample.recordedAt,
    external_id: sample.provenance.externalId ?? null,
    connector_version: sample.provenance.connectorVersion,
  }
}

/**
 * CanonicalSample → ponto de body_metrics (projeção de exibição), ou `null` quando:
 *  - a métrica não é uma métrica corporal projetável (fica só no bruto — "degrada, não quebra"); ou
 *  - o valor é nulo (body_metrics.value_text é NOT NULL).
 */
export function toBodyMetricRow(sample: CanonicalSample, userId: string): BodyMetricRow | null {
  if (!BODY_METRIC_KEYS.has(sample.metric)) return null
  if (sample.value == null) return null
  return {
    user_id: userId,
    metric: sample.metric,
    label: null,
    value_text: String(sample.value),
    unit: sample.unit,
    measured_on: utcDateOf(sample.recordedAt),
    source: WEARABLE_SOURCE,
  }
}

/** Chave dia+métrica de um ponto projetado (para o replace idempotente na projeção). */
export function bodyMetricDayKey(row: Pick<BodyMetricRow, 'metric' | 'measured_on'>): string {
  return `${row.metric}|${row.measured_on}`
}

/**
 * Projeta uma lista de amostras (já deduplicadas) em pontos de body_metrics de granularidade de DIA,
 * onde o ÚLTIMO do dia por métrica vence (projeção determinística). Preserva ordem de 1ª aparição.
 */
export function projectBodyMetricPoints(samples: readonly CanonicalSample[], userId: string): BodyMetricRow[] {
  const order: string[] = []
  const byKey = new Map<string, BodyMetricRow>()
  for (const s of samples) {
    const row = toBodyMetricRow(s, userId)
    if (!row) continue
    const k = bodyMetricDayKey(row)
    if (!byKey.has(k)) order.push(k)
    byKey.set(k, row) // último do dia vence
  }
  return order.map((k) => byKey.get(k)!)
}

/** Resultado da propagação (para o histórico de sync e o painel). */
export interface PropagationResult {
  rawCount: number
  projectedCount: number
}

/**
 * Fronteira de IO (injetável). A implementação real usa o cliente service-role.
 * - `upsertReadings`: idempotente por (user_id, provider, metric, recorded_at).
 * - `replaceBodyMetricPoints`: substitui os pontos `source='wearable'` do usuário nas chaves (métrica, dia)
 *   presentes no lote (idempotente sem constraint nova). Não toca pontos de outras origens (manual/exame).
 */
export interface PersistClient {
  upsertReadings(rows: WearableReadingRow[]): Promise<void>
  replaceBodyMetricPoints(userId: string, source: string, points: BodyMetricRow[]): Promise<void>
}

/**
 * Propaga amostras de UMA fonte: grava o bruto (SSOT) e projeta a exibição. Determinística e idempotente:
 * rodar 2× com o mesmo lote produz o mesmo estado final (dedup + upsert + replace por dia).
 */
export async function propagateSamples(
  client: PersistClient,
  userId: string,
  samples: readonly CanonicalSample[],
): Promise<PropagationResult> {
  const deduped = dedupWithinSource(samples)
  const rawRows = deduped.map((s) => toWearableReadingRow(s, userId))
  const points = projectBodyMetricPoints(deduped, userId)
  await client.upsertReadings(rawRows)
  await client.replaceBodyMetricPoints(userId, WEARABLE_SOURCE, points)
  return { rawCount: rawRows.length, projectedCount: points.length }
}

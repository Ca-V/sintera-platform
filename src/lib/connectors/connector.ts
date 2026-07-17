// WEA-001 / HIP-001 — Connector Layer (núcleo puro, VENDOR-NEUTRAL e DOMAIN-NEUTRAL).
// Não conhece Garmin/Strava nem "wearable": modela CONECTOR genérico (fonte externa qualquer) → amostra
// canônica com PROVENIÊNCIA. Reconciliação/deduplicação de múltiplos provedores preserva sempre a origem.
// Puro/determinístico, sem IO. Serve wearables (1ª implementação) e futuros labs/hospitais/EMR/etc.

/** Como o conector adquire os dados. */
export type AcquisitionMode = 'oauth' | 'api' | 'webhook' | 'file' | 'ble'

/** Descriptor de um conector — o núcleo itera sobre isto; nunca conhece nomes de fabricantes. */
export interface ConnectorDescriptor {
  /** Id estável da fonte (ex.: 'strava', 'garmin', 'lab_x'). */
  source: string
  label: string
  /** Domínio de origem — NÃO privilegiado no núcleo (wearable/lab/hospital/emr/pharmacy/insurer/device/api). */
  domain: string
  acquisition: AcquisitionMode
  /** Versão do conector (auditoria/reprodutibilidade). */
  version: string
  /** Métricas que a fonte produz (aberto). */
  capabilities: readonly string[]
}

/** Proveniência auditável de uma amostra — de onde veio, por qual conector/versão, id externo. */
export interface SampleProvenance {
  source: string
  connectorVersion: string
  /** Id do registro na fonte (para idempotência/rastreio), quando existir. */
  externalId?: string | null
}

/** Amostra canônica (medida/valor no tempo) com proveniência. Nunca substitui o dado da fonte. */
export interface CanonicalSample {
  metric: string
  value: number | null
  unit: string | null
  /** Instante do dado na fonte (ISO). */
  recordedAt: string
  provenance: SampleProvenance
}

export type SyncStatus = 'pending' | 'ok' | 'partial' | 'error'

/** Registro de uma sincronização (histórico operacional). */
export interface SyncRun {
  source: string
  startedAt: string
  finishedAt: string | null
  status: SyncStatus
  recordsCount: number
  error: string | null
  /** Última sincronização bem-sucedida conhecida (para o painel). */
  lastSuccessAt: string | null
}

/** Chave de dedup DENTRO de uma fonte: mesma métrica+instante+fonte = mesma leitura (idempotente no re-sync). */
export function sampleKey(s: CanonicalSample): string {
  return `${s.metric}|${s.recordedAt}|${s.provenance.source}`
}

/**
 * Deduplica amostras da MESMA fonte: última leitura vence por (métrica, instante, fonte). Preserva a ordem
 * de 1ª aparição das chaves. Amostras de fontes diferentes NUNCA colidem (proveniência distinta).
 */
export function dedupWithinSource(samples: readonly CanonicalSample[]): CanonicalSample[] {
  const order: string[] = []
  const byKey = new Map<string, CanonicalSample>()
  for (const s of samples) {
    const k = sampleKey(s)
    if (!byKey.has(k)) order.push(k)
    byKey.set(k, s) // last-writer-wins
  }
  return order.map(k => byKey.get(k)!)
}

/**
 * Reconcilia amostras já persistidas (`existing`) com as recém-sincronizadas (`incoming`), PRESERVANDO a
 * proveniência de cada uma. Regra: mesma (métrica, instante, fonte) → a nova substitui (re-sync idempotente);
 * fontes diferentes para a mesma métrica/instante → AMBAS coexistem (multi-provedor, sem perder origem).
 * Determinístico; ordem = existing (na ordem dada) seguido dos incoming novos.
 */
export function reconcileSamples(
  existing: readonly CanonicalSample[],
  incoming: readonly CanonicalSample[],
): CanonicalSample[] {
  const byKey = new Map<string, CanonicalSample>()
  const order: string[] = []
  for (const s of existing) { const k = sampleKey(s); if (!byKey.has(k)) order.push(k); byKey.set(k, s) }
  for (const s of dedupWithinSource(incoming)) { const k = sampleKey(s); if (!byKey.has(k)) order.push(k); byKey.set(k, s) }
  return order.map(k => byKey.get(k)!)
}

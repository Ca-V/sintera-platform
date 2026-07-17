// FUNC · WEA-001/HIP-001 — reconciliação/dedup de amostras preservando proveniência. PURO.
import { describe, it, expect } from 'vitest'
import { sampleKey, dedupWithinSource, reconcileSamples, type CanonicalSample } from '@/lib/connectors/connector'

const s = (metric: string, recordedAt: string, source: string, value: number, externalId?: string): CanonicalSample => ({
  metric, value, unit: null, recordedAt, provenance: { source, connectorVersion: 'v1', externalId },
})

describe('connector · dedup dentro da fonte', () => {
  it('mesma métrica+instante+fonte → última vence (re-sync idempotente)', () => {
    const out = dedupWithinSource([s('hr', '2026-07-17T09:00:00Z', 'strava', 60), s('hr', '2026-07-17T09:00:00Z', 'strava', 62)])
    expect(out).toHaveLength(1)
    expect(out[0].value).toBe(62)
  })
  it('fontes diferentes p/ a mesma métrica/instante NÃO colidem (proveniência distinta)', () => {
    const out = dedupWithinSource([s('hr', '2026-07-17T09:00:00Z', 'strava', 60), s('hr', '2026-07-17T09:00:00Z', 'garmin', 61)])
    expect(out).toHaveLength(2)
    expect(out.map(x => x.provenance.source)).toEqual(['strava', 'garmin'])
  })
  it('sampleKey inclui métrica, instante e fonte', () => {
    expect(sampleKey(s('sleep', '2026-07-17T00:00:00Z', 'oura', 7))).toBe('sleep|2026-07-17T00:00:00Z|oura')
  })
})

describe('connector · reconcileSamples (multi-provedor, preserva origem)', () => {
  it('re-sync da mesma fonte substitui; nunca duplica', () => {
    const existing = [s('hr', '2026-07-17T09:00:00Z', 'strava', 60)]
    const incoming = [s('hr', '2026-07-17T09:00:00Z', 'strava', 65)]
    const out = reconcileSamples(existing, incoming)
    expect(out).toHaveLength(1)
    expect(out[0].value).toBe(65)
  })
  it('dado de novo provedor coexiste com o existente (mesma métrica/instante)', () => {
    const existing = [s('hr', '2026-07-17T09:00:00Z', 'strava', 60)]
    const incoming = [s('hr', '2026-07-17T09:00:00Z', 'garmin', 61)]
    const out = reconcileSamples(existing, incoming)
    expect(out).toHaveLength(2)
    expect(out.map(x => x.provenance.source).sort()).toEqual(['garmin', 'strava'])
  })
  it('preserva ordem: existentes primeiro, depois novos', () => {
    const out = reconcileSamples(
      [s('a', '2026-07-17T09:00:00Z', 'strava', 1)],
      [s('b', '2026-07-17T10:00:00Z', 'garmin', 2)],
    )
    expect(out.map(x => x.metric)).toEqual(['a', 'b'])
  })
})

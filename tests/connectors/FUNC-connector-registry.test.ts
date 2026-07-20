// FUNC · WEA-001/HIP-001 — registro de conectores VENDOR-NEUTRAL. O núcleo só itera; adaptadores se registram.
import { describe, it, expect } from 'vitest'
import { createConnectorRegistry, type Connector, type ConnectorContext } from '@/lib/connectors/registry'
import type { ConnectorDescriptor, CanonicalSample } from '@/lib/connectors/connector'

const descriptor = (source: string, capabilities: string[] = ['peso']): ConnectorDescriptor => ({
  source, label: source, domain: 'wearable', acquisition: 'oauth', version: 'v1', capabilities,
})

const fakeConnector = (source: string, samples: CanonicalSample[] = []): Connector => ({
  descriptor: descriptor(source),
  fetchSamples: async (_ctx: ConnectorContext) => samples,
})

describe('connectorRegistry · vendor-neutral', () => {
  it('registra e recupera um conector por source', () => {
    const reg = createConnectorRegistry()
    reg.register(fakeConnector('withings'))
    expect(reg.has('withings')).toBe(true)
    expect(reg.get('withings')?.descriptor.source).toBe('withings')
    expect(reg.get('inexistente')).toBeUndefined()
  })

  it('lista descriptors sem tocar em IO (para UI/núcleo)', () => {
    const reg = createConnectorRegistry([fakeConnector('withings'), fakeConnector('garmin')])
    expect(reg.descriptors().map((d) => d.source)).toEqual(['withings', 'garmin'])
    expect(reg.list()).toHaveLength(2)
  })

  it('rejeita registro duplicado da mesma source (evita ambiguidade)', () => {
    const reg = createConnectorRegistry([fakeConnector('withings')])
    expect(() => reg.register(fakeConnector('withings'))).toThrow(/já registrado/)
  })

  it('rejeita descriptor sem source', () => {
    const reg = createConnectorRegistry()
    expect(() => reg.register(fakeConnector(''))).toThrow(/source/)
  })

  it('aceita inicialização em lote preservando ordem de registro', () => {
    const reg = createConnectorRegistry([fakeConnector('a'), fakeConnector('b'), fakeConnector('c')])
    expect(reg.list().map((c) => c.descriptor.source)).toEqual(['a', 'b', 'c'])
  })
})

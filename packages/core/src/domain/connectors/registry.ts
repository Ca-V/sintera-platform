// WEA-001 / HIP-001 — Registro de conectores (VENDOR-NEUTRAL).
// O núcleo itera sobre este registro; NUNCA conhece nomes de fabricantes. Cada adaptador (Withings, Garmin,
// lab_x, …) registra a si mesmo aqui. Um Connector = descriptor (o que produz) + fetchSamples (como adquire).
// O fetchSamples é a fronteira de IO/segredo (tokens resolvidos FORA do núcleo); tudo abaixo é determinístico.

import type { ConnectorDescriptor, CanonicalSample } from './connector'

/** Janela temporal de sincronização (instantes ISO). `since=null` => primeira sincronização (histórico). */
export interface SyncWindow {
  since: string | null
  until: string
}

/** Contexto de aquisição — o adaptador recebe já resolvidos usuário, janela e token (segredo nunca logado). */
export interface ConnectorContext {
  userId: string
  window: SyncWindow
  /** Token de acesso já resolvido pela camada de autorização, fora do núcleo. Nunca registrar/logar. */
  accessToken: string
  /** Espaço para dados específicos do adaptador (ex.: escopo), sem vazar para o núcleo. */
  extra?: Record<string, unknown>
}

/** Implementação de um conector: o vendor-específico vive AQUI, jamais no núcleo. */
export interface Connector {
  readonly descriptor: ConnectorDescriptor
  /** Busca amostras canônicas da fonte para a janela pedida. Emite SEMPRE `CanonicalSample` (nunca payload cru). */
  fetchSamples(ctx: ConnectorContext): Promise<CanonicalSample[]>
}

/** Registro sobre o qual o núcleo itera. */
export interface ConnectorRegistry {
  /** Registra um conector. Lança se a `source` já estiver registrada (evita ambiguidade). */
  register(connector: Connector): void
  get(source: string): Connector | undefined
  has(source: string): boolean
  /** Todos os conectores registrados (ordem de registro). */
  list(): Connector[]
  /** Só os descriptors — o que o núcleo/UI precisam para listar fontes sem tocar em IO. */
  descriptors(): ConnectorDescriptor[]
}

/** Cria um registro isolado (usar em testes; a app usa a instância compartilhada abaixo). */
export function createConnectorRegistry(initial?: readonly Connector[]): ConnectorRegistry {
  const bySource = new Map<string, Connector>()
  const registry: ConnectorRegistry = {
    register(connector) {
      const { source } = connector.descriptor
      if (!source) throw new Error('conector sem `source` no descriptor')
      if (bySource.has(source)) throw new Error(`conector já registrado: ${source}`)
      bySource.set(source, connector)
    },
    get: (source) => bySource.get(source),
    has: (source) => bySource.has(source),
    list: () => [...bySource.values()],
    descriptors: () => [...bySource.values()].map((c) => c.descriptor),
  }
  if (initial) for (const c of initial) registry.register(c)
  return registry
}

/**
 * Instância compartilhada da aplicação. Os adaptadores (Withings, etc.) chamam `connectorRegistry.register(...)`
 * no seu próprio módulo; o núcleo e a UI só iteram. Mantém o núcleo vendor-neutral (HIP-001).
 */
export const connectorRegistry = createConnectorRegistry()

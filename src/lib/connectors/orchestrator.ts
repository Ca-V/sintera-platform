// WEA-001 / HIP-001 — V2 Épico 1.4: orquestrador de sincronização VENDOR-NEUTRAL.
// Recebe um Connector (qualquer) + contexto e executa: buscar → propagar (bruto + projeção) → registrar
// o histórico (connector_sync_runs). NÃO conhece Withings/Garmin/etc. — só o contrato Connector.
// IO isolada atrás de dependências injetáveis (PersistClient, SyncRunRecorder, Clock) → testável/determinístico.

import type { Connector, ConnectorContext } from './registry'
import { propagateSamples, type PersistClient } from './persistence'
import type { SyncRun, SyncStatus } from './connector'

/** Registra uma execução de sync (histórico operacional / Painel de Integrações). IO injetável. */
export interface SyncRunRecorder {
  record(run: SyncRun & { userId: string }): Promise<void>
}

/** Relógio injetável — mantém o orquestrador determinístico nos testes. */
export interface Clock {
  now(): string
}

export const systemClock: Clock = { now: () => new Date().toISOString() }

export interface SyncDeps {
  persist: PersistClient
  recorder: SyncRunRecorder
  clock: Clock
}

export interface SyncOutcome {
  source: string
  status: SyncStatus
  recordsCount: number
  error: string | null
}

/**
 * Executa a sincronização de UM conector. Nunca lança: falhas viram um run 'error' registrado + outcome de erro
 * (a queda de um provedor não pode quebrar a experiência — princípio da substituição). Idempotência herdada de
 * `propagateSamples` (rodar 2× = mesmo estado). `last_success_at` só é preenchido no sucesso; o painel deriva a
 * "última sync bem-sucedida" do histórico quando este run falha.
 */
export async function runConnectorSync(
  connector: Connector,
  ctx: ConnectorContext,
  deps: SyncDeps,
): Promise<SyncOutcome> {
  const source = connector.descriptor.source
  const startedAt = deps.clock.now()
  try {
    const samples = await connector.fetchSamples(ctx)
    const { rawCount } = await propagateSamples(deps.persist, ctx.userId, samples)
    const finishedAt = deps.clock.now()
    await deps.recorder.record({
      userId: ctx.userId, source, startedAt, finishedAt,
      status: 'ok', recordsCount: rawCount, error: null, lastSuccessAt: finishedAt,
    })
    return { source, status: 'ok', recordsCount: rawCount, error: null }
  } catch (e) {
    const finishedAt = deps.clock.now()
    const error = e instanceof Error ? e.message : String(e)
    await deps.recorder.record({
      userId: ctx.userId, source, startedAt, finishedAt,
      status: 'error', recordsCount: 0, error, lastSuccessAt: null,
    })
    return { source, status: 'error', recordsCount: 0, error }
  }
}

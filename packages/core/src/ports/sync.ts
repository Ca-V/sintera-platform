// @sintera/core — porta da camada de SINCRONIZAÇÃO (INFRAESTRUTURA, independente da interface).
// A sync deve funcionar SEM qualquer tela aberta (background, notificações, Health Connect/Apple Health, dispositivos
// médicos, integrações futuras). Alinha a arquitetura observacional (HIP-009): push/pull, fila offline, idempotência.
// A IMPLEMENTAÇÃO entra em passos futuros; aqui fica o CONTRATO.

/** Estado de conectividade — a sync é offline-first (funciona sem rede, drena depois). */
export type Connectivity = 'online' | 'offline'

/** Tarefa enfileirada (ex.: lote de Observações a enviar). Idempotente por `idempotencyKey`. */
export interface SyncTask {
  id: string
  kind: string
  idempotencyKey: string
  payload: unknown
  createdAt: string
}

export interface SyncResult {
  synced: number
  failed: number
  skipped: number
}

/** Motor de sincronização — orquestra fila offline + envio idempotente. UI-independent. */
export interface SyncEngine {
  /** Inicia o motor (pode operar em background, sem UI). */
  start(): Promise<void>
  /** Para o motor. */
  stop(): Promise<void>
  /** Enfileira uma tarefa (persistida localmente; sobrevive a offline). */
  enqueue(task: SyncTask): Promise<void>
  /** Executa um ciclo de drenagem da fila; seguro rodar repetidamente (idempotente). */
  runOnce(): Promise<SyncResult>
  readonly isRunning: boolean
  readonly connectivity: Connectivity
}

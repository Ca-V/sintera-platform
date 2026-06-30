// ============================================================
// Centro de Entrada — TELEMETRIA (sink plugável)
// ============================================================
// Registra eventos de captura (tipo, classificação, duração, desfecho) já agora —
// extremamente útil quando a IA de classificação chegar. V1: sink = console (sem
// tabela/banco). Substituir o sink por um coletor real depois NÃO muda as chamadas.
// ============================================================

import type { DocumentKind } from './types'

export interface CaptureTelemetryEvent {
  /** Tipo escolhido (final). null se cancelado antes de escolher. */
  kind: DocumentKind | null
  /** Tipo sugerido pela heurística (para medir acerto). */
  suggested: DocumentKind | null
  outcome: 'success' | 'forwarded' | 'error' | 'cancelled'
  durationMs?: number
  errorReason?: string
}

type Sink = (e: CaptureTelemetryEvent) => void

let sink: Sink = (e) => { try { console.debug('[capture]', e) } catch { /* noop */ } }

/** Troca o destino da telemetria (ex.: coletor real) sem mudar as chamadas. */
export function setCaptureTelemetrySink(s: Sink): void { sink = s }

/** Registra um evento. Telemetria NUNCA quebra o fluxo da usuária. */
export function logCapture(e: CaptureTelemetryEvent): void {
  try { sink(e) } catch { /* silencioso */ }
}

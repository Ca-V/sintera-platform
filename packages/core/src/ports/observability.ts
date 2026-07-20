// @sintera/core — porta de OBSERVABILIDADE (UI-independent). A fundação RESERVA o espaço (logs/telemetria/métricas/
// analytics/crash) sem acoplar ferramenta específica. A implementação real (Sentry, etc.) entra depois, atrás desta porta.
// Princípio: nenhuma camada depende da interface gráfica; observabilidade é infraestrutura de plataforma.

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface Logger {
  log(level: LogLevel, message: string, context?: Record<string, unknown>): void
}
export interface Telemetry {
  event(name: string, props?: Record<string, unknown>): void
}
export interface Metrics {
  increment(name: string, value?: number, tags?: Record<string, string>): void
  timing(name: string, ms: number, tags?: Record<string, string>): void
}
export interface Analytics {
  screen(name: string, props?: Record<string, unknown>): void
  action(name: string, props?: Record<string, unknown>): void
}
export interface CrashReporter {
  capture(error: unknown, context?: Record<string, unknown>): void
}

/** Fachada única de observabilidade (injetável). */
export interface Observability {
  readonly logger: Logger
  readonly telemetry: Telemetry
  readonly metrics: Metrics
  readonly analytics: Analytics
  readonly crash: CrashReporter
}

/** Implementação NO-OP: a fundação funciona sem nenhuma ferramenta configurada (nada quebra). */
export const noopObservability: Observability = {
  logger: { log() {} },
  telemetry: { event() {} },
  metrics: { increment() {}, timing() {} },
  analytics: { screen() {}, action() {} },
  crash: { capture() {} },
}

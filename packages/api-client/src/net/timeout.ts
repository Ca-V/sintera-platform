// @sintera/api-client — utilitário de rede: timeout via AbortController (decisão D2, MOBILE-019).
// PURO e domain-agnostic — serve qualquer operação do pacote. Compõe um `signal` externo (opcional, ex.: o
// hook cancelando no unmount) com um timeout interno; o que disparar primeiro aborta a operação.
export const DEFAULT_TIMEOUT_MS = 10_000

/** Erro de timeout — distinguível de erros de rede/DB por `name === 'TimeoutError'`. */
export class TimeoutError extends Error {
  constructor(ms: number = DEFAULT_TIMEOUT_MS) {
    super(`Operação excedeu o tempo limite de ${ms}ms`)
    this.name = 'TimeoutError'
  }
}

/** Cria um AbortSignal que aborta por timeout OU quando o `external` abortar. Retorna também `cleanup`
 *  (limpar o timer/listener) — o chamador DEVE chamá-lo no `finally` para não vazar timer. */
export function withTimeout(
  external?: AbortSignal,
  ms: number = DEFAULT_TIMEOUT_MS,
): { signal: AbortSignal; cleanup: () => void } {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(new TimeoutError(ms)), ms)
  const onExternalAbort = () => controller.abort(external?.reason)

  if (external) {
    if (external.aborted) controller.abort(external.reason)
    else external.addEventListener('abort', onExternalAbort, { once: true })
  }

  const cleanup = () => {
    clearTimeout(timer)
    if (external) external.removeEventListener('abort', onExternalAbort)
  }
  return { signal: controller.signal, cleanup }
}

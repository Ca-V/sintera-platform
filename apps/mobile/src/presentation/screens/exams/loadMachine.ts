// Máquina de carga (LEITURA) — LÓGICA PURA (sem React/RN). Genérica sobre o tipo carregado `T`. Usada pelos
// hooks de Exames (Inc.5): listar (`T = ExamDTO[]`) e detalhe (`T = ExamDTO | null`). Domínios read-only
// futuros podem promovê-la para um local compartilhado — por ora vive no Inc.5 (evita abstração prematura).
//
// Fases:  idle → loading → ready | error        (error --RETRY--> loading)

export type LoadPhase = 'idle' | 'loading' | 'ready' | 'error'

export interface LoadState<T> {
  phase: LoadPhase
  data: T | null
  /** Mensagem acionável quando `error`; null caso contrário. */
  error: string | null
}

export type LoadEvent<T> =
  | { type: 'LOAD' }
  | { type: 'SUCCESS'; data: T }
  | { type: 'FAILURE'; error: string }
  | { type: 'RETRY' }
  | { type: 'SET'; data: T } // atualização SILENCIOSA (refresh em segundo plano): vai a 'ready' sem piscar 'loading'

export function initialLoadState<T>(): LoadState<T> {
  return { phase: 'idle', data: null, error: null }
}

/** Mensagem de erro para o estado `error`: usa a do Error quando houver, senão o fallback. Fonte ÚNICA (antes
 *  duplicada nos hooks de lista/detalhe). */
export function loadErrorMessage(e: unknown, fallback: string): string {
  return e instanceof Error && e.message ? e.message : fallback
}

/** Reducer puro e determinístico. Eventos inválidos para a fase atual são ignorados (retorna o mesmo estado). */
export function loadReducer<T>(state: LoadState<T>, event: LoadEvent<T>): LoadState<T> {
  // SET aplica dados frescos a partir de QUALQUER fase (refresh silencioso ao refocar a tela) → 'ready'.
  if (event.type === 'SET') return { phase: 'ready', data: event.data, error: null }
  switch (state.phase) {
    case 'idle':
      if (event.type === 'LOAD') return { phase: 'loading', data: null, error: null }
      return state
    case 'loading':
      if (event.type === 'SUCCESS') return { phase: 'ready', data: event.data, error: null }
      if (event.type === 'FAILURE') return { phase: 'error', data: null, error: event.error }
      return state
    case 'ready':
      if (event.type === 'RETRY' || event.type === 'LOAD') return { phase: 'loading', data: null, error: null }
      return state
    case 'error':
      if (event.type === 'RETRY' || event.type === 'LOAD') return { phase: 'loading', data: null, error: null }
      return state
    default:
      return state
  }
}

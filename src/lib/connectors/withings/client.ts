// HIP-002 — Cliente HTTP do Withings (ISOLADO no adaptador). Encapsula a PARTICULARIDADE do Withings: toda resposta
// vem com HTTP 200 e um campo `status` no corpo (0 = ok); erros reais são códigos no corpo (401 token inválido, 601
// rate limit, etc.). O restante da plataforma nunca vê isso — recebe dados já normalizados ou um erro tipado.
// `fetch` e `sleep` são injetáveis (testes com fakes; sem rede). NUNCA loga tokens.

import { WITHINGS_API_BASE } from './config'

export type FetchLike = typeof fetch
export type Sleep = (ms: number) => Promise<void>

/** Erro tipado do Withings — carrega o `status` do corpo para o adaptador decidir (auth vs rate limit vs outro). */
export class WithingsApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message)
    this.name = 'WithingsApiError'
  }
  /** Token inválido/expirado — o adaptador mapeia para o caminho de reconexão do núcleo. */
  get isAuth(): boolean { return this.status === 401 }
  /** Excesso de requisições (rate limit) — sujeito a backoff/retry. */
  get isRateLimit(): boolean { return this.status === 601 }
}

export interface WithingsClientDeps {
  fetchImpl?: FetchLike
  sleep?: Sleep
  apiBase?: string
  /** Tentativas extra em rate limit (601). */
  maxRetries?: number
  /** Base do backoff exponencial (ms). */
  backoffBaseMs?: number
}

export interface WithingsClient {
  /** Chama uma ação da API (form-urlencoded). Devolve `body` já desembrulhado; lança WithingsApiError se status≠0. */
  call(path: string, form: Record<string, string>, bearerToken?: string): Promise<Record<string, unknown>>
}

/** Cliente Withings. `path` ex.: '/v2/oauth2', '/measure', '/notify'. */
export function createWithingsClient(deps: WithingsClientDeps = {}): WithingsClient {
  const fetchImpl = deps.fetchImpl ?? fetch
  const sleep = deps.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)))
  const apiBase = deps.apiBase ?? WITHINGS_API_BASE
  const maxRetries = deps.maxRetries ?? 3
  const backoffBaseMs = deps.backoffBaseMs ?? 500

  return {
    async call(path, form, bearerToken) {
      let attempt = 0
      for (;;) {
        const headers: Record<string, string> = { 'Content-Type': 'application/x-www-form-urlencoded' }
        if (bearerToken) headers.Authorization = `Bearer ${bearerToken}` // nunca logado
        const res = await fetchImpl(`${apiBase}${path}`, {
          method: 'POST',
          headers,
          body: new URLSearchParams(form).toString(),
        })
        let json: { status?: number; body?: Record<string, unknown>; error?: unknown }
        try {
          json = (await res.json()) as typeof json
        } catch {
          throw new WithingsApiError(-1, `resposta não-JSON do Withings (HTTP ${res.status})`)
        }
        const status = typeof json?.status === 'number' ? json.status : -1
        if (status === 0) return json.body ?? {}
        // Rate limit → backoff exponencial e retry (limitado).
        if (status === 601 && attempt < maxRetries) {
          await sleep(backoffBaseMs * 2 ** attempt)
          attempt += 1
          continue
        }
        const detail = json?.error != null ? String(json.error) : `status ${status}`
        throw new WithingsApiError(status, `Withings ${path}: ${detail}`)
      }
    },
  }
}

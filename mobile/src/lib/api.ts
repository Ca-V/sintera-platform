// Client de API do Mobile — chama as MESMAS rotas /api da Web com o token da sessão
// Supabase no header Authorization (Bearer). O backend (getAuthedSupabase, ADR-020)
// resolve o usuário pelo token e aplica RLS. Assim o Mobile reutiliza 100% das regras
// de negócio já implementadas, sem duplicar lógica.
import { supabase } from './supabase'
import { API_URL } from './config'

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

async function authHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { ...(await authHeader()) }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  const json = text ? safeParse(text) : {}
  if (!res.ok) {
    // 401 = sessão inválida/expirada apesar do auto-refresh. Encerra a sessão para a
    // guarda de navegação levar ao login, em vez de deixar telas "quebradas" com erro.
    if (res.status === 401) { void supabase.auth.signOut() }
    const msg = (json as { error?: string })?.error ?? `Falha (${res.status})`
    throw new ApiError(res.status, msg)
  }
  return json as T
}

function safeParse(text: string): unknown {
  try { return JSON.parse(text) } catch { return {} }
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body ?? {}),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body ?? {}),
  del: <T>(path: string) => request<T>('DELETE', path),
}

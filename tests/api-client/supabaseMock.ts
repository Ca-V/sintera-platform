// Harness de teste do @sintera/api-client — mock do cliente Supabase (ativo compartilhado: Auth, Profile e
// qualquer módulo futuro). NÃO é um arquivo de teste (sem sufixo .test) — é infraestrutura de mocks reutilizável.
//
// Cobre as duas superfícies que os módulos de domínio usam:
//  • client.auth.*  (signInWithPassword, signOut, getSession, onAuthStateChange)
//  • client.from(table)…  cadeia postgrest encadeável e "thenable" que resolve para um resultado pré-definido.
import { vi } from 'vitest'
import type { SupabaseClient, Session } from '@supabase/supabase-js'

export type PgResult = { data?: unknown; error: unknown }

/** Builder postgrest mockado: todo método encadeável retorna o próprio builder; o builder é "thenable"
 *  e resolve para `result`. Registra as chamadas para asserção (ex.: qual payload foi ao upsert). */
export function mockQueryBuilder(result: PgResult) {
  const calls: Record<string, unknown[]> = {}
  const builder: Record<string, unknown> = {}
  const methods = ['select', 'insert', 'update', 'upsert', 'delete', 'eq', 'order', 'limit', 'single', 'maybeSingle', 'abortSignal']
  for (const m of methods) {
    builder[m] = vi.fn((...args: unknown[]) => { calls[m] = args; return builder })
  }
  // Torna o builder aguardável (PromiseLike) resolvendo para o resultado pré-definido.
  builder.then = (resolve: (r: PgResult) => unknown) => Promise.resolve(result).then(resolve)
  builder.__calls = calls
  return builder
}

export type MockSupabaseOpts = {
  /** Sessão retornada por getSession/getUser (use `session.user.id` nos módulos que precisam do id). */
  session?: Session | null
  /** Resultado de signInWithPassword. */
  signInResult?: { data: { session: Session | null }; error: unknown }
  /** Erro de signOut (default: null). */
  signOutError?: unknown
  /** Fábrica de builder por tabela — permite `from('profiles')` devolver um resultado específico. */
  from?: (table: string) => ReturnType<typeof mockQueryBuilder>
}

/** Cliente Supabase mockado o suficiente para os módulos de domínio do api-client. Cast para SupabaseClient nos testes. */
export function mockSupabase(opts: MockSupabaseOpts = {}) {
  const unsubscribe = vi.fn()
  const client = {
    auth: {
      signInWithPassword: vi.fn(async () => opts.signInResult ?? { data: { session: opts.session ?? null }, error: null }),
      signOut: vi.fn(async () => ({ error: opts.signOutError ?? null })),
      getSession: vi.fn(async () => ({ data: { session: opts.session ?? null } })),
      getUser: vi.fn(async () => ({ data: { user: opts.session?.user ?? null } })),
      onAuthStateChange: vi.fn((_cb: unknown) => ({ data: { subscription: { unsubscribe } } })),
    },
    from: vi.fn((table: string) => (opts.from ? opts.from(table) : mockQueryBuilder({ data: null, error: null }))),
    __unsubscribe: unsubscribe,
  }
  return client as unknown as SupabaseClient & { __unsubscribe: typeof unsubscribe }
}

/** Sessão fake mínima (só o que os módulos usam: user.id). */
export function fakeSession(userId = 'user-123'): Session {
  return { user: { id: userId } } as unknown as Session
}

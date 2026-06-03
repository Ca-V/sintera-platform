// Rate limiter em memória — 5 chamadas por minuto por userId
//
// LIMITAÇÃO DOCUMENTADA (DMEAV Ajuste A3 — aprovado):
// Esta implementação usa Map em memória do processo Node.js.
// Em ambiente serverless (Vercel), múltiplas instâncias não compartilham estado.
// O rate limit é efetivo por instância, não globalmente.
// Revisão com Supabase ou Upstash Redis planejada quando houver escala real.

interface RateEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateEntry>()
const LIMIT = 5
const WINDOW_MS = 60_000

export function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const entry = store.get(userId)

  if (!entry || now > entry.resetAt) {
    store.set(userId, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }

  if (entry.count >= LIMIT) return false
  entry.count++
  return true
}

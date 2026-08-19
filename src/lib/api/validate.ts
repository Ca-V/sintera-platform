// SEC-006 · Validação de schema de entrada para rotas de API (fundação, pura, sem dependências externas).
// Padrão de resultado alinhado a @sintera/validation (Result<T,string>): a falha é sempre uma mensagem
// acionável (voz do produto). NÃO adiciona zod nem toca a fronteira travada de @sintera/validation
// (ver packages/validation/src/index.ts / ADR-007). Uso nas rotas: parse → 400 com mensagem em caso de falha.
import { NextResponse } from 'next/server'

export type Validated<T> = { ok: true; value: T } | { ok: false; error: string }

const okV = <T>(value: T): Validated<T> => ({ ok: true, value })
const errV = (error: string): Validated<never> => ({ ok: false, error })

/** Lê e valida que o corpo é um objeto JSON (não array, não null). Erros de parse viram 400 acionável. */
export async function readJsonObject(
  request: { json: () => Promise<unknown> },
  message = 'Corpo inválido.',
): Promise<Validated<Record<string, unknown>>> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errV(message)
  }
  if (body === null || typeof body !== 'object' || Array.isArray(body)) return errV(message)
  return okV(body as Record<string, unknown>)
}

/** Campo string obrigatório, não vazio (após trim). `message` sobrepõe a mensagem padrão. */
export function requireString(
  obj: Record<string, unknown>,
  field: string,
  message?: string,
): Validated<string> {
  const v = obj[field]
  if (typeof v !== 'string' || v.trim() === '') return errV(message ?? `${field} é obrigatório.`)
  return okV(v)
}

/** Campo com valor num conjunto permitido (allowlist). `message` sobrepõe a mensagem padrão. */
export function requireEnum(
  obj: Record<string, unknown>,
  field: string,
  allowed: ReadonlySet<string> | readonly string[],
  message?: string,
): Validated<string> {
  const set = allowed instanceof Set ? allowed : new Set(allowed)
  const v = obj[field]
  if (typeof v !== 'string' || !set.has(v)) {
    return errV(message ?? `${field} inválido.`)
  }
  return okV(v)
}

/** Campo obrigatório com semântica *legacy* de presença (truthy): rejeita apenas valores falsy
 *  (undefined/null/''/0/false), preservando o comportamento de checagens `if (!campo)` já existentes.
 *  NÃO faz trim (diferente de `requireString`) — use quando o objetivo é padronizar sem endurecer. */
export function requirePresent(
  obj: Record<string, unknown>,
  field: string,
  message?: string,
): Validated<unknown> {
  const v = obj?.[field]
  if (!v) return errV(message ?? `${field} é obrigatório.`)
  return okV(v)
}

/** Inteiro obrigatório dentro de [min, max]. Rejeita não-números, NaN e fora do intervalo. */
export function requireIntInRange(
  obj: Record<string, unknown>,
  field: string,
  min: number,
  max: number,
  message?: string,
): Validated<number> {
  const v = obj[field]
  if (typeof v !== 'number' || !Number.isInteger(v) || v < min || v > max) {
    return errV(message ?? `${field} deve ser um inteiro entre ${min} e ${max}.`)
  }
  return okV(v)
}

/** Resposta 400 padrão (mensagem acionável). Mantém o formato { error } usado nas rotas. */
export function badRequest(error: string, status = 400): NextResponse {
  return NextResponse.json({ error }, { status })
}

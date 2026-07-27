// @sintera/validation — infraestrutura de validação (pura). O CONTRATO de resultado é o `Result` canônico de
// @sintera/types (dedup); aqui a falha é sempre uma mensagem acionável (string, voz do produto).
import type { Result } from '@sintera/types'

/** Resultado de validação = `Result<T, string>` (erro é uma mensagem acionável). */
export type ValidationResult<T> = Result<T, string>

export const ok = <T>(value: T): ValidationResult<T> => ({ ok: true, value })
export const err = (error: string): ValidationResult<never> => ({ ok: false, error })

/** Combinador: aplica os validadores em ordem; retorna o primeiro erro ou o valor do último `ok`. */
export function all<T>(input: T, ...validators: ReadonlyArray<(v: T) => ValidationResult<T>>): ValidationResult<T> {
  let current = input
  for (const validate of validators) {
    const r = validate(current)
    if (!r.ok) return r
    current = r.value
  }
  return ok(current)
}

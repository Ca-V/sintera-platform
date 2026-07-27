// @sintera/validation — infraestrutura de validação (pura, sem dependências externas).
// Resultado discriminado: sucesso carrega o valor NORMALIZADO; falha carrega uma mensagem acionável (voz do produto).

export type ValidationResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: string }

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

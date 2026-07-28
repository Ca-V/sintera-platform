// @sintera/validation — infraestrutura de validação (pura). O CONTRATO de resultado é o `Result` canônico de
// @sintera/types (dedup); aqui a falha é sempre uma mensagem acionável (string, voz do produto).
import type { Result } from '@sintera/types'

/** Resultado de validação = `Result<T, string>` (erro é uma mensagem acionável). */
export type ValidationResult<T> = Result<T, string>

export const ok = <T>(value: T): ValidationResult<T> => ({ ok: true, value })
export const err = (error: string): ValidationResult<never> => ({ ok: false, error })

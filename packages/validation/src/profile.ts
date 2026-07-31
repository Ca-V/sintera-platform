// @sintera/validation — validadores do domínio Perfil (campos editáveis: name, phone). Puros e determinísticos.
// Convenção MOBILE-019: name/phone são OPCIONAIS; vazio → null (limpa o campo). A validação é da TELA (não do
// api-client); estes validadores são a infra compartilhada que a tela (e a Web) consomem.
import { ok, err, type ValidationResult } from './result'

export const NAME_MAX = 120
export const PHONE_MIN_DIGITS = 8

/** Normaliza o nome: colapsa espaços internos e apara as bordas. */
export function normalizeName(raw: string | null | undefined): string {
  return (raw ?? '').replace(/\s+/g, ' ').trim()
}

/** Normaliza o telefone para dígitos com "+" inicial opcional (formato livre — MOBILE-019). */
export function normalizePhone(raw: string | null | undefined): string {
  const s = (raw ?? '').trim()
  if (!s) return ''
  const plus = s.startsWith('+') ? '+' : ''
  return plus + s.replace(/\D/g, '')
}

/** Valida/normaliza o nome. Vazio → `null` (opcional). Presente → 1..120 chars. */
export function validateName(raw: string | null | undefined): ValidationResult<string | null> {
  const name = normalizeName(raw)
  if (name.length === 0) return ok(null)
  if (name.length > NAME_MAX) return err(`O nome deve ter no máximo ${NAME_MAX} caracteres.`)
  return ok(name)
}

/** Valida/normaliza o telefone. Vazio → `null` (opcional). Presente → ao menos 8 dígitos. */
export function validatePhone(raw: string | null | undefined): ValidationResult<string | null> {
  const phone = normalizePhone(raw)
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 0) return ok(null)
  if (digits.length < PHONE_MIN_DIGITS) return err('Telefone inválido: informe o número com DDD.')
  return ok(phone)
}

/** Valida o conjunto editável do Perfil (name + phone). Retorna os valores normalizados ou o primeiro erro. */
export function validateProfileEditable(input: { name?: string | null; phone?: string | null }):
  ValidationResult<{ name: string | null; phone: string | null }> {
  const name = validateName(input.name)
  if (!name.ok) return name
  const phone = validatePhone(input.phone)
  if (!phone.ok) return phone
  return ok({ name: name.value, phone: phone.value })
}

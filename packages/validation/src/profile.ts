// @sintera/validation — validadores do domínio Perfil (campos editáveis: name, phone). Puros e determinísticos.
// Convenção MOBILE-019: name/phone são OPCIONAIS; vazio → null (limpa o campo). A validação é da TELA (não do
// api-client); estes validadores são a infra compartilhada que a tela (e a Web) consomem.
import { ok, err, type ValidationResult } from './result'

export const NAME_MAX = 120
export const PHONE_MIN_DIGITS = 8

// Faixa etária — vocabulário canônico (buckets já usados pelos dados/Prevenção). Lista ABERTA a null
// (não informado). SSOT do seletor no Perfil (Web + Mobile).
export const AGE_RANGE_OPTIONS = ['18-25', '26-35', '36-45', '46+'] as const
export type AgeRange = (typeof AGE_RANGE_OPTIONS)[number]

/**
 * Rótulo da opção vazia do seletor — não informar a faixa é ESCOLHA legítima, não ausência de resposta.
 *
 * A lista de faixas já era compartilhada, mas este texto estava escrito à mão nas duas telas. É copy que a
 * pessoa lê: reescrevê-lo num lado (para "Prefiro não dizer", por exemplo) e não no outro faria as duas telas
 * falarem diferente sobre a mesma escolha, sem ninguém perceber (base única, 27/08).
 */
export const AGE_RANGE_EMPTY_LABEL = 'Não informar'

// Objetivos — texto livre (sem taxonomia fechada): a usuária escreve, separando por vírgula. Limites de sanidade.
export const GOALS_MAX = 10
export const GOAL_MAX_LEN = 60

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

/** Valida/normaliza a faixa etária. Vazio → `null` (opcional). Presente → deve estar no vocabulário canônico. */
export function validateAgeRange(raw: string | null | undefined): ValidationResult<string | null> {
  const v = (raw ?? '').trim()
  if (v.length === 0) return ok(null)
  if (!(AGE_RANGE_OPTIONS as readonly string[]).includes(v)) return err('Faixa etária inválida.')
  return ok(v)
}

/** Converte o texto do campo Objetivos (itens por vírgula) em lista normalizada — para consumo em qualquer tela. */
export function parseGoals(raw: string | null | undefined): string[] {
  return (raw ?? '')
    .split(',')
    .map(s => s.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
}
/** Projeta a lista de objetivos de volta no texto do campo (SSOT da apresentação do input). */
export function goalsToInput(goals: string[] | null | undefined): string {
  return (goals ?? []).join(', ')
}

/** Valida/normaliza objetivos. Vazio → `null` (opcional). Presente → ≤10 itens, cada ≤60 chars. */
export function validateGoals(input: string[] | null | undefined): ValidationResult<string[] | null> {
  const list = (input ?? []).map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean)
  if (list.length === 0) return ok(null)
  if (list.length > GOALS_MAX) return err(`Informe no máximo ${GOALS_MAX} objetivos.`)
  if (list.some(s => s.length > GOAL_MAX_LEN)) return err(`Cada objetivo deve ter no máximo ${GOAL_MAX_LEN} caracteres.`)
  return ok(list)
}

/** Valida o conjunto editável do Perfil (name + phone + faixa etária + objetivos). Normaliza ou retorna o 1º erro. */
export function validateProfileEditable(input: { name?: string | null; phone?: string | null; age_range?: string | null; goals?: string[] | null }):
  ValidationResult<{ name: string | null; phone: string | null; age_range: string | null; goals: string[] | null }> {
  const name = validateName(input.name)
  if (!name.ok) return name
  const phone = validatePhone(input.phone)
  if (!phone.ok) return phone
  const ageRange = validateAgeRange(input.age_range)
  if (!ageRange.ok) return ageRange
  const goals = validateGoals(input.goals)
  if (!goals.ok) return goals
  return ok({ name: name.value, phone: phone.value, age_range: ageRange.value, goals: goals.value })
}

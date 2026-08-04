// @sintera/core — Conferência de identidade do exame (factual, não-clínico). Fonte ÚNICA (Web + Mobile).
// Compara o nome do paciente do laudo com o nome do perfil para sinalizar exame de OUTRA pessoa. É AVISO, não
// bloqueio: nomes variam (apelido, nome do meio, acentos) → só sinaliza quando claramente não há sobreposição.

export type NameMatch = 'match' | 'mismatch' | 'unverified'

const CONNECTIVES = new Set(['de', 'da', 'do', 'dos', 'das', 'e', 'di', 'del', 'la'])

/** Normaliza um nome em tokens significativos (sem acento, minúsculo, sem conectivos). */
export function nameTokens(name: string): string[] {
  return name
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // remove acentos
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length >= 2 && !CONNECTIVES.has(t))
}

/**
 * Compara nome do perfil com nome do laudo.
 * - 'unverified': falta algum dos nomes.
 * - 'match': sobreposição suficiente de tokens (1º+último, ou o único token).
 * - 'mismatch': sobreposição insuficiente (provável pessoa diferente).
 */
export function compareNames(profileName?: string | null, examName?: string | null): NameMatch {
  if (!profileName || !examName) return 'unverified'
  const p = nameTokens(profileName)
  const e = nameTokens(examName)
  if (p.length === 0 || e.length === 0) return 'unverified'
  const eSet = new Set(e)
  const overlap = p.filter(t => eSet.has(t)).length
  const needed = p.length >= 2 ? 2 : 1
  return overlap >= needed ? 'match' : 'mismatch'
}

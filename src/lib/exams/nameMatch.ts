// ============================================================
// SINTERA — Conferência de identidade do exame (factual, não-clínico)
// ============================================================
// Compara o nome do paciente extraído do laudo com o nome da usuária (perfil)
// para sinalizar quando um exame pode ser de OUTRA pessoa. É um AVISO, não um
// bloqueio: nomes variam (apelido, nome do meio, acentos), então preferimos
// não gerar falso alarme — só sinalizamos quando claramente não há sobreposição.
// ============================================================

export type NameMatch = 'match' | 'mismatch' | 'unverified'

// Conectivos comuns em nomes — ignorados na comparação.
const CONNECTIVES = new Set(['de', 'da', 'do', 'dos', 'das', 'e', 'di', 'del', 'la'])

/** Normaliza um nome em tokens significativos (sem acento, minúsculo, sem conectivos). */
export function nameTokens(name: string): string[] {
  return name
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // remove acentos
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')                          // só letras
    .split(/\s+/)
    .filter(t => t.length >= 2 && !CONNECTIVES.has(t))
}

/**
 * Compara nome do perfil com nome do laudo.
 * - 'unverified': falta algum dos nomes.
 * - 'match': há sobreposição suficiente de tokens (1º+último, ou o único token).
 * - 'mismatch': sobreposição insuficiente (provável pessoa diferente).
 */
export function compareNames(profileName?: string | null, examName?: string | null): NameMatch {
  if (!profileName || !examName) return 'unverified'
  const p = nameTokens(profileName)
  const e = nameTokens(examName)
  if (p.length === 0 || e.length === 0) return 'unverified'

  const eSet = new Set(e)
  const overlap = p.filter(t => eSet.has(t)).length

  // Perfil com 1 token: basta esse token aparecer. Com 2+: exige ao menos 2
  // tokens em comum (tipicamente primeiro nome + um sobrenome).
  const needed = p.length >= 2 ? 2 : 1
  return overlap >= needed ? 'match' : 'mismatch'
}

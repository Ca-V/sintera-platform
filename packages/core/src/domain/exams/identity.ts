// @sintera/core — Identificação padronizada do exame (F1/F3) — derivação PURA do que o card/detalhe exibem:
//   NOME do exame  ·  LABORATÓRIO/clínica  ·  (médico solicitante vem separado, coluna própria)
//
// O nome vem do `type` sem a proveniência (" • laboratório"); o laboratório da coluna `issuer`, com
// fallback para a parte após " • " do `type`. Determinística; fonte ÚNICA (Web + Mobile). O médico
// ASSINANTE do laudo nunca entra aqui (está no documento).

const SEP = ' • '

export interface ExamIdentity {
  /** Nome do exame, sem proveniência. Nunca vazio. */
  name: string
  /** Laboratório/clínica responsável, quando conhecido; senão null. */
  lab: string | null
}

/**
 * Deriva { name, lab } a partir da IDENTIDADE já resolvida pelo pipeline.
 * NOME: prefere `displayTitle` (Clinical Identity — nome resolvido, sem proveniência); sem ele, cai para o
 *   legado (parte do `type` antes do " • lab"). Onde o pipeline resolveu, NÃO há rederivação do nome.
 * LAB: `issuer` tem precedência; fallback é a parte após " • " do `type`.
 * Determinística; fonte ÚNICA (Web + Mobile) — sem duplicação de lógica entre telas.
 */
export function deriveExamIdentity(type: string | null | undefined, issuer?: string | null, displayTitle?: string | null): ExamIdentity {
  const raw = (type ?? '').trim()
  const resolved = (displayTitle ?? '').trim()
  const name = resolved || (raw.split(SEP)[0] ?? '').trim() || 'Exame'
  const fromType = raw.includes(SEP) ? raw.split(SEP).slice(1).join(SEP).trim() : ''
  const lab = (issuer ?? '').trim() || fromType || null
  return { name, lab }
}

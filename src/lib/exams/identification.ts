// Identificação padronizada do exame (F1/F3) — derivação PURA do que o card/detalhe exibem:
//   NOME do exame  ·  LABORATÓRIO/clínica  ·  (médico solicitante vem separado, coluna própria)
//
// O nome vem do `type` sem a proveniência (" • laboratório"); o laboratório da coluna `issuer`, com
// fallback para a parte após " • " do `type`. Determinística; reutilizada na lista e no detalhe (uma
// só regra, sem duplicação). O médico ASSINANTE do laudo nunca entra aqui (está no documento).

const SEP = ' • '

export interface ExamIdentity {
  /** Nome do exame, sem proveniência. Nunca vazio. */
  name: string
  /** Laboratório/clínica responsável, quando conhecido; senão null. */
  lab: string | null
}

/**
 * Deriva { name, lab } a partir do `type` (que pode conter "Nome • Laboratório") e do `issuer`.
 * `issuer` tem precedência para o laboratório; o fallback é a parte após " • " do type.
 */
export function deriveExamIdentity(type: string | null | undefined, issuer?: string | null): ExamIdentity {
  const raw = (type ?? '').trim()
  const name = (raw.split(SEP)[0] ?? '').trim() || 'Exame'
  const fromType = raw.includes(SEP) ? raw.split(SEP).slice(1).join(SEP).trim() : ''
  const lab = (issuer ?? '').trim() || fromType || null
  return { name, lab }
}
